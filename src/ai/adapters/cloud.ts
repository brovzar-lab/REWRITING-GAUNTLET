import type { Citation, Finding } from '../../workflow/types';
import type { Screenplay } from '../../model/screenplay';
import type { AIProvider, DiagnoseRequest } from '../provider';

/** The optional cloud provider (Anthropic API, plain fetch, no SDK).
    This is the ONLY module allowed to name the vendor — everything else
    talks to the AIProvider interface. It never runs without the consent
    flag and a user-supplied key, and the consent screen states exactly
    what this file sends: the full screenplay text of the working draft. */

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-5';
const API_VERSION = '2023-06-01';
const MAX_FINDINGS = 5;

export interface CloudOptions {
  apiKey: string;
  fetchFn?: typeof fetch;
}

function scriptWithIds(sp: Screenplay): string {
  const lines: string[] = [];
  for (const scene of sp.scenes) {
    lines.push(`## Scene ${scene.number} (id ${scene.id}, act ${scene.act}): ${scene.slug}`);
    for (const el of scene.elements) {
      lines.push(`[${el.id}] (${el.type}) ${el.text}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function systemPrompt(passName: string, blurb: string): string {
  return [
    `You are assisting a screenwriter's own "${passName}" rewrite pass (${blurb}).`,
    'You diagnose; the writer decides. Reply with a JSON array (no prose) of at most',
    `${MAX_FINDINGS} findings: {"summary": string (one sentence, phrased as a hypothesis),`,
    '"status": "clear"|"uncertain"|"priority_concern",',
    '"citations": [{"sceneId": string, "elementId": string}] (exact ids from the script, at least one),',
    'optional "proposal": {"sceneId": string, "elementId": string, "newText": string, "rationale": string}',
    'where the proposal element MUST be one of your citations and newText replaces that single element only.',
    'Never give a numeric score. Never propose changes across scenes you did not cite.',
  ].join(' ');
}

interface RawFinding {
  summary?: unknown;
  status?: unknown;
  citations?: unknown;
  proposal?: { sceneId?: unknown; elementId?: unknown; newText?: unknown; rationale?: unknown };
}

const STATUSES = new Set(['clear', 'uncertain', 'priority_concern']);

export function createCloudProvider(options: CloudOptions): AIProvider {
  const fetchFn = options.fetchFn ?? fetch;
  return {
    id: 'cloud',
    label: 'Cloud AI',
    async diagnose(request: DiagnoseRequest): Promise<Finding[]> {
      const response = await fetchFn(API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': options.apiKey,
          'anthropic-version': API_VERSION,
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 2000,
          system: systemPrompt(request.pass.name, request.pass.blurb),
          messages: [
            {
              role: 'user',
              content: `Title: ${request.screenplay.title}\n\n${scriptWithIds(request.screenplay)}`,
            },
          ],
        }),
      });
      if (!response.ok) {
        throw new Error(`Cloud AI request failed (HTTP ${response.status}). Check your API key and try again.`);
      }
      const data = (await response.json()) as { content?: { type?: string; text?: string }[] };
      const text = (data.content ?? []).map((c) => c.text ?? '').join('');
      return mapFindings(text, request);
    },
  };
}

function parseJsonArray(text: string): RawFinding[] {
  const unfenced = text.replace(/```(?:json)?/g, '').trim();
  const start = unfenced.indexOf('[');
  const end = unfenced.lastIndexOf(']');
  if (start === -1 || end <= start) return [];
  try {
    const parsed: unknown = JSON.parse(unfenced.slice(start, end + 1));
    return Array.isArray(parsed) ? (parsed as RawFinding[]) : [];
  } catch {
    return [];
  }
}

/** Validate everything the model returned against the actual document.
    Unknown citations kill the finding; an uncited or unknown proposal target
    drops the proposal but keeps the hypothesis. oldText always comes from
    the document, never from the model. */
function mapFindings(text: string, request: DiagnoseRequest): Finding[] {
  const elements = new Map<string, { sceneId: string; text: string }>();
  for (const scene of request.screenplay.scenes) {
    for (const el of scene.elements) elements.set(el.id, { sceneId: scene.id, text: el.text });
  }

  const findings: Finding[] = [];
  let n = 0;
  for (const raw of parseJsonArray(text).slice(0, MAX_FINDINGS)) {
    if (typeof raw.summary !== 'string' || raw.summary.trim() === '') continue;
    const citations = (Array.isArray(raw.citations) ? raw.citations : [])
      .filter(
        (c): c is Citation =>
          typeof c === 'object' &&
          c !== null &&
          typeof (c as Citation).elementId === 'string' &&
          elements.get((c as Citation).elementId)?.sceneId === (c as Citation).sceneId,
      )
      .map((c) => ({ sceneId: c.sceneId, elementId: c.elementId }));
    if (citations.length === 0) continue;

    let proposal: Finding['proposal'];
    const p = raw.proposal;
    if (
      p &&
      typeof p.elementId === 'string' &&
      typeof p.newText === 'string' &&
      citations.some((c) => c.elementId === p.elementId)
    ) {
      const target = elements.get(p.elementId)!;
      proposal = {
        sceneId: target.sceneId,
        elementId: p.elementId,
        oldText: target.text,
        newText: p.newText,
        rationale: typeof p.rationale === 'string' ? p.rationale : '',
      };
    }

    findings.push({
      id: `${request.passRunId}-cloud-${++n}`,
      passId: request.pass.id,
      passRunId: request.passRunId,
      provider: 'cloud',
      claimType: 'ai_hypothesis',
      status: STATUSES.has(String(raw.status)) ? (raw.status as Finding['status']) : 'uncertain',
      summary: raw.summary.trim(),
      citations,
      proposal,
      resolution: 'open',
      createdAt: request.now,
    });
  }
  return findings;
}
