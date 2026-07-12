import type { Scene, Screenplay } from '../model/screenplay';
import type { Citation, Finding } from '../workflow/types';
import type { AIProvider, DiagnoseRequest } from './provider';

/** The default provider: deterministic, offline, free. It only claims what it
    can point at — structural signals with exact citations. It is honest and
    shallow by design; the optional cloud provider is where diagnosis gets
    smarter, and both return the same Finding shape. */

const MAX_PER_PASS = 5;
const LONG_SPEECH_CHARS = 200;
const TALKY_RATIO = 0.75;
const OUTLIER_FACTOR = 1.6;

function cueName(text: string): string {
  return text
    .replace(/\(.*?\)/g, '')
    .trim()
    .toUpperCase();
}

interface CharacterInfo {
  name: string;
  sceneIds: string[];
  firstCue: Citation;
  cues: Citation[];
  dialogueCount: number;
}

function characterMap(sp: Screenplay): CharacterInfo[] {
  const byName = new Map<string, CharacterInfo>();
  for (const scene of sp.scenes) {
    for (let i = 0; i < scene.elements.length; i++) {
      const el = scene.elements[i];
      if (el.type !== 'character') continue;
      const name = cueName(el.text);
      if (!name) continue;
      const cite = { sceneId: scene.id, elementId: el.id };
      const info = byName.get(name) ?? { name, sceneIds: [], firstCue: cite, cues: [], dialogueCount: 0 };
      if (!info.sceneIds.includes(scene.id)) info.sceneIds.push(scene.id);
      info.cues.push(cite);
      if (scene.elements[i + 1]?.type === 'dialogue') info.dialogueCount += 1;
      byName.set(name, info);
    }
  }
  return [...byName.values()];
}

function sceneLength(scene: Scene): number {
  return scene.elements.reduce((n, e) => n + e.text.length, 0);
}

function heading(scene: Scene): Citation {
  return { sceneId: scene.id, elementId: scene.elements[0].id };
}

/** True when the names differ by at most one edit (insert, delete, replace). */
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return false;
  if (Math.abs(a.length - b.length) > 1) return false;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < short.length && j < long.length) {
    if (short[i] === long[j]) {
      i++;
      j++;
    } else {
      edits++;
      if (edits > 1) return false;
      if (short.length === long.length) i++;
      j++;
    }
  }
  return edits + (long.length - j) <= 1;
}

const cleanWhitespace = (text: string): string => text.replace(/ {2,}/g, ' ').replace(/[ \t]+$/g, '');

type Ctx = DiagnoseRequest & { make: (partial: MakeInput) => Finding };

interface MakeInput {
  status: Finding['status'];
  summary: string;
  citations: Citation[];
  proposal?: Finding['proposal'];
}

function actBalance(ctx: Ctx): Finding[] {
  const scenes = ctx.screenplay.scenes;
  if (scenes.length < 6) return [];
  const out: Finding[] = [];
  for (const act of [1, 2, 3] as const) {
    const inAct = scenes.filter((s) => s.act === act);
    if (inAct.length === 0) continue;
    const share = inAct.length / scenes.length;
    if (share < 0.15 || share > 0.55) {
      out.push(
        ctx.make({
          status: 'uncertain',
          summary: `Act ${act} holds ${inAct.length} of ${scenes.length} scenes (${Math.round(share * 100)}%). The acts may be out of balance.`,
          citations: [heading(inAct[0])],
        }),
      );
    }
  }
  return out;
}

function singleAppearanceCharacters(ctx: Ctx): Finding[] {
  const singles = characterMap(ctx.screenplay).filter((c) => c.sceneIds.length === 1 && c.dialogueCount > 0);
  return singles.slice(0, 3).map((c) => {
    const scene = ctx.screenplay.scenes.find((s) => s.id === c.sceneIds[0])!;
    return ctx.make({
      status: 'uncertain',
      summary: `${c.name} speaks in only one scene (${scene.slug}). Does this character earn the space, or can another carry the function?`,
      citations: [c.firstCue],
    });
  });
}

function unconnectedScenes(ctx: Ctx): Finding[] {
  const touched = new Set(ctx.connections.flatMap((c) => [c.fromSceneId, c.toSceneId]));
  return ctx.screenplay.scenes
    .filter((s) => !touched.has(s.id))
    .slice(0, 3)
    .map((s) =>
      ctx.make({
        status: 'uncertain',
        summary: `No tracked set-up, escalation, or relationship touches "${s.slug}". What is this scene doing for the story?`,
        citations: [heading(s)],
      }),
    );
}

function backwardsSetupPayoff(ctx: Ctx): Finding[] {
  const numberOf = new Map(ctx.screenplay.scenes.map((s) => [s.id, s.number]));
  return ctx.connections
    .filter(
      (c) =>
        c.kind === 'setup_payoff' &&
        numberOf.has(c.fromSceneId) &&
        numberOf.has(c.toSceneId) &&
        numberOf.get(c.fromSceneId)! > numberOf.get(c.toSceneId)!,
    )
    .map((c) => {
      const from = ctx.screenplay.scenes.find((s) => s.id === c.fromSceneId)!;
      const to = ctx.screenplay.scenes.find((s) => s.id === c.toSceneId)!;
      return ctx.make({
        status: 'priority_concern',
        summary: `The "${c.label}" pay-off (scene ${to.number}) lands before its set-up (scene ${from.number}). Cause and effect run backwards here.`,
        citations: [heading(from), heading(to)],
      });
    });
}

function lengthOutliers(ctx: Ctx, lens: 'scene' | 'pressure'): Finding[] {
  const scenes = ctx.screenplay.scenes;
  if (scenes.length < 3) return [];
  const avg = scenes.reduce((n, s) => n + sceneLength(s), 0) / scenes.length;
  return scenes
    .filter((s) => sceneLength(s) > avg * OUTLIER_FACTOR)
    .slice(0, 3)
    .map((s) =>
      ctx.make({
        status: 'uncertain',
        summary:
          lens === 'scene'
            ? `"${s.slug}" runs well past the average scene. Can it enter later or get out earlier?`
            : `"${s.slug}" is one of the longest stretches. Does the pressure on the protagonist turn anywhere inside it?`,
        citations: [heading(s)],
      }),
    );
}

function missingRelationships(ctx: Ctx): Finding[] {
  if (ctx.connections.some((c) => c.kind === 'relationship')) return [];
  if (ctx.screenplay.scenes.length === 0) return [];
  return [
    ctx.make({
      status: 'uncertain',
      summary: 'No relationship threads are tracked on the board yet. Which two people carry the emotion of this story?',
      citations: [heading(ctx.screenplay.scenes[0])],
    }),
  ];
}

function softActTwoEnd(ctx: Ctx): Finding[] {
  const scenes = ctx.screenplay.scenes;
  if (scenes.length < 6) return [];
  const actTwo = scenes.filter((s) => s.act === 2);
  if (actTwo.length === 0) return [];
  const last = actTwo[actTwo.length - 1];
  const avg = scenes.reduce((n, s) => n + sceneLength(s), 0) / scenes.length;
  if (sceneLength(last) >= avg * 0.6) return [];
  return [
    ctx.make({
      status: 'uncertain',
      summary: `The end of Act Two ("${last.slug}") is one of the thinnest scenes. The escalation into Act Three may be soft.`,
      citations: [heading(last)],
    }),
  ];
}

function longSpeeches(ctx: Ctx): Finding[] {
  const out: Finding[] = [];
  for (const scene of ctx.screenplay.scenes) {
    for (const el of scene.elements) {
      if (el.type === 'dialogue' && el.text.length > LONG_SPEECH_CHARS) {
        out.push(
          ctx.make({
            status: 'uncertain',
            summary: `A speech in "${scene.slug}" runs ${el.text.length} characters. Read it aloud: does it hold, or can subtext do the work?`,
            citations: [{ sceneId: scene.id, elementId: el.id }],
          }),
        );
      }
    }
  }
  return out.slice(0, 3);
}

function talkyScenes(ctx: Ctx): Finding[] {
  const out: Finding[] = [];
  for (const scene of ctx.screenplay.scenes) {
    let dialogue = 0;
    let action = 0;
    for (const el of scene.elements) {
      if (el.type === 'dialogue') dialogue += el.text.length;
      if (el.type === 'action') action += el.text.length;
    }
    if (dialogue > LONG_SPEECH_CHARS && dialogue / Math.max(1, dialogue + action) > TALKY_RATIO) {
      out.push(
        ctx.make({
          status: 'uncertain',
          summary: `"${scene.slug}" is almost all talk. Is there behavior that could carry part of it?`,
          citations: [heading(scene)],
        }),
      );
    }
  }
  return out.slice(0, 2);
}

function nearDuplicateNames(ctx: Ctx): Finding[] {
  const chars = characterMap(ctx.screenplay).filter((c) => c.name.length >= 4);
  const out: Finding[] = [];
  for (let i = 0; i < chars.length; i++) {
    for (let j = i + 1; j < chars.length; j++) {
      const a = chars[i];
      const b = chars[j];
      if (!withinOneEdit(a.name, b.name)) continue;
      const [rare, common] = a.cues.length < b.cues.length ? [a, b] : [b, a];
      const cue = rare.firstCue;
      const cueEl = ctx.screenplay.scenes
        .find((s) => s.id === cue.sceneId)!
        .elements.find((e) => e.id === cue.elementId)!;
      out.push(
        ctx.make({
          status: 'priority_concern',
          summary: `${rare.name} (${rare.cues.length}x) looks like a misspelling of ${common.name} (${common.cues.length}x).`,
          citations: [cue, common.firstCue],
          proposal: {
            sceneId: cue.sceneId,
            elementId: cue.elementId,
            oldText: cueEl.text,
            newText: cueEl.text.replace(rare.name, common.name),
            rationale: `Unify the character name: ${rare.name} appears ${rare.cues.length} time(s), ${common.name} appears ${common.cues.length} time(s).`,
          },
        }),
      );
    }
  }
  return out.slice(0, 3);
}

function whitespaceCleanups(ctx: Ctx): Finding[] {
  const out: Finding[] = [];
  for (const scene of ctx.screenplay.scenes) {
    for (const el of scene.elements) {
      const cleaned = cleanWhitespace(el.text);
      if (cleaned !== el.text) {
        out.push(
          ctx.make({
            status: 'clear',
            summary: `Stray spacing in "${scene.slug}" (doubled or trailing spaces).`,
            citations: [{ sceneId: scene.id, elementId: el.id }],
            proposal: {
              sceneId: scene.id,
              elementId: el.id,
              oldText: el.text,
              newText: cleaned,
              rationale: 'Collapse doubled spaces and trim trailing whitespace.',
            },
          }),
        );
      }
    }
  }
  return out.slice(0, MAX_PER_PASS);
}

const PASS_LENSES: Record<string, (ctx: Ctx) => Finding[]> = {
  foundation: (ctx) => actBalance(ctx),
  character: (ctx) => singleAppearanceCharacters(ctx),
  'story-theme': (ctx) => unconnectedScenes(ctx),
  structure: (ctx) => [...actBalance(ctx), ...softActTwoEnd(ctx)],
  plot: (ctx) => backwardsSetupPayoff(ctx),
  corr: (ctx) => lengthOutliers(ctx, 'pressure'),
  relationship: (ctx) => missingRelationships(ctx),
  scene: (ctx) => lengthOutliers(ctx, 'scene'),
  dialogue: (ctx) => [...longSpeeches(ctx), ...talkyScenes(ctx)],
  consistency: (ctx) => nearDuplicateNames(ctx),
  polish: (ctx) => whitespaceCleanups(ctx),
};

export const localAnalyzer: AIProvider = {
  id: 'local',
  label: 'Local analyzer',
  diagnose(request: DiagnoseRequest): Promise<Finding[]> {
    let n = 0;
    const ctx: Ctx = {
      ...request,
      make: ({ status, summary, citations, proposal }) => ({
        id: `${request.passRunId}-local-${++n}`,
        passId: request.pass.id,
        passRunId: request.passRunId,
        provider: 'local',
        claimType: 'ai_hypothesis',
        status,
        summary,
        citations,
        proposal,
        resolution: 'open',
        createdAt: request.now,
      }),
    };
    const lens = PASS_LENSES[request.pass.id];
    const findings = lens ? lens(ctx).slice(0, MAX_PER_PASS) : [];
    return Promise.resolve(findings);
  },
};
