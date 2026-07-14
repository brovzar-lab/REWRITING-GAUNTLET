import { describe, expect, it } from 'vitest';
import { localAnalyzer } from './localAnalyzer';
import { EPPS_PASSES } from '../model/passes';
import { sampleConnections, sampleScreenplay } from '../model/sample/gauntlet-sample';
import { emptyScenePoint } from '../model/scenepoint';
import type { Connection, Screenplay } from '../model/screenplay';
import type { DiagnoseRequest } from './provider';

/** Hand-built fixture with known, deliberate problems:
    - "  " double space in fx-s1-e2 and a trailing space in fx-s3-e4 (polish)
    - MARTA's speech in fx-s1-e4 is over 200 chars (dialogue)
    - MARTHA (fx-s2-e3) is a near-duplicate of MARTA (consistency)
    - GUARD appears in exactly one scene (character)
    - the only setup_payoff connection pays off BEFORE its set-up (plot)
    - no relationship connections at all (relationship)
    - fx-s4 has no connections touching it (story-theme) */
const LONG_SPEECH =
  'I kept the books for thirty years and nobody asked me once what the numbers meant, not my father, not the bank, ' +
  'not the priest who blessed the harvest, and now you walk in with a folder and expect me to hand over the whole ledger of my life.';

function fixture(): { screenplay: Screenplay; connections: Connection[] } {
  const screenplay: Screenplay = {
    id: 'fx',
    title: 'FIXTURE',
    draftLabel: 'Test draft',
    scenes: [
      {
        id: 'fx-s1',
        number: 1,
        act: 1,
        slug: 'INT. KITCHEN - DAY',
        storyFunction: 'setup',
        elements: [
          { id: 'fx-s1-e1', type: 'scene_heading', text: 'INT. KITCHEN - DAY' },
          { id: 'fx-s1-e2', type: 'action', text: 'Marta cooks.  The radio hums.' },
          { id: 'fx-s1-e3', type: 'character', text: 'MARTA' },
          { id: 'fx-s1-e4', type: 'dialogue', text: LONG_SPEECH },
        ],
      },
      {
        id: 'fx-s2',
        number: 2,
        act: 1,
        slug: 'EXT. FIELD - DAY',
        storyFunction: 'plot',
        elements: [
          { id: 'fx-s2-e1', type: 'scene_heading', text: 'EXT. FIELD - DAY' },
          { id: 'fx-s2-e2', type: 'action', text: 'Rows of maize.' },
          { id: 'fx-s2-e3', type: 'character', text: 'MARTHA' },
          { id: 'fx-s2-e4', type: 'dialogue', text: 'The east rows are dry.' },
        ],
      },
      {
        id: 'fx-s3',
        number: 3,
        act: 2,
        slug: 'INT. BANK - DAY',
        storyFunction: 'opposition',
        elements: [
          { id: 'fx-s3-e1', type: 'scene_heading', text: 'INT. BANK - DAY' },
          { id: 'fx-s3-e2', type: 'action', text: 'A long queue. Marta waits with the ledger under her arm.' },
          { id: 'fx-s3-e3', type: 'character', text: 'MARTA' },
          { id: 'fx-s3-e4', type: 'dialogue', text: 'I want to see the manager. ' },
          { id: 'fx-s3-e5', type: 'action', text: 'The teller looks past her to the man behind.' },
          { id: 'fx-s3-e6', type: 'action', text: 'Marta does not move. The queue grumbles. Minutes pass on the wall clock.' },
        ],
      },
      {
        id: 'fx-s4',
        number: 4,
        act: 3,
        slug: 'EXT. ROAD - NIGHT',
        storyFunction: 'resolution',
        elements: [
          { id: 'fx-s4-e1', type: 'scene_heading', text: 'EXT. ROAD - NIGHT' },
          { id: 'fx-s4-e2', type: 'character', text: 'GUARD' },
          { id: 'fx-s4-e3', type: 'dialogue', text: 'Road is closed after dark.' },
        ],
      },
    ],
  };
  const connections: Connection[] = [
    // Deliberately backwards: the "payoff" scene comes before its set-up.
    { id: 'cx1', fromSceneId: 'fx-s3', toSceneId: 'fx-s1', kind: 'setup_payoff', label: 'ledger' },
    { id: 'cx2', fromSceneId: 'fx-s1', toSceneId: 'fx-s2', kind: 'escalation', label: 'drought' },
  ];
  return { screenplay, connections };
}

function req(passId: string): DiagnoseRequest {
  const { screenplay, connections } = fixture();
  const pass = EPPS_PASSES.find((p) => p.id === passId)!;
  return { screenplay, connections, pass, passRunId: `run-${passId}`, now: 1700000000000 };
}

const allElementIds = (sp: Screenplay) => new Set(sp.scenes.flatMap((s) => s.elements.map((e) => e.id)));

describe('local analyzer', () => {
  it('is deterministic: same input, same findings', async () => {
    const a = await localAnalyzer.diagnose(req('character'));
    const b = await localAnalyzer.diagnose(req('character'));
    expect(a).toEqual(b);
  });

  it('every finding is a labeled hypothesis with real citations and no score', async () => {
    for (const pass of EPPS_PASSES) {
      const findings = await localAnalyzer.diagnose(req(pass.id));
      const ids = allElementIds(fixture().screenplay);
      for (const f of findings) {
        expect(f.provider).toBe('local');
        expect(f.claimType).toBe('ai_hypothesis');
        expect(f.resolution).toBe('open');
        expect(f.passId).toBe(pass.id);
        expect(f.citations.length).toBeGreaterThan(0);
        for (const c of f.citations) expect(ids.has(c.elementId)).toBe(true);
        expect(f).not.toHaveProperty('score');
        if (f.proposal) {
          expect(f.citations.some((c) => c.elementId === f.proposal!.elementId)).toBe(true);
        }
      }
    }
  });

  it('character pass flags single-appearance characters', async () => {
    const findings = await localAnalyzer.diagnose(req('character'));
    const summaries = findings.map((f) => f.summary).join(' | ');
    expect(summaries).toMatch(/GUARD/);
  });

  it('consistency pass proposes fixing the MARTHA/MARTA near-duplicate', async () => {
    const findings = await localAnalyzer.diagnose(req('consistency'));
    const dup = findings.find((f) => f.proposal);
    expect(dup).toBeDefined();
    expect(dup!.proposal).toMatchObject({ elementId: 'fx-s2-e3', oldText: 'MARTHA', newText: 'MARTA' });
  });

  it('polish pass proposes exact whitespace cleanups', async () => {
    const findings = await localAnalyzer.diagnose(req('polish'));
    const targets = findings.filter((f) => f.proposal).map((f) => f.proposal!);
    expect(targets).toContainEqual(
      expect.objectContaining({
        elementId: 'fx-s1-e2',
        oldText: 'Marta cooks.  The radio hums.',
        newText: 'Marta cooks. The radio hums.',
      }),
    );
    expect(targets).toContainEqual(
      expect.objectContaining({
        elementId: 'fx-s3-e4',
        oldText: 'I want to see the manager. ',
        newText: 'I want to see the manager.',
      }),
    );
  });

  it('dialogue pass cites the overlong speech', async () => {
    const findings = await localAnalyzer.diagnose(req('dialogue'));
    expect(findings.some((f) => f.citations.some((c) => c.elementId === 'fx-s1-e4'))).toBe(true);
  });

  it('plot pass flags a payoff that lands before its set-up as a priority concern', async () => {
    const findings = await localAnalyzer.diagnose(req('plot'));
    const backwards = findings.find((f) => f.status === 'priority_concern');
    expect(backwards).toBeDefined();
    expect(backwards!.citations.map((c) => c.sceneId)).toContain('fx-s3');
  });

  it('relationship pass notices there are no relationship connections', async () => {
    const findings = await localAnalyzer.diagnose(req('relationship'));
    expect(findings.length).toBeGreaterThan(0);
  });

  it('story and theme pass flags the unconnected scene', async () => {
    const findings = await localAnalyzer.diagnose(req('story-theme'));
    expect(findings.some((f) => f.citations.some((c) => c.sceneId === 'fx-s4'))).toBe(true);
  });
});

describe('the shipped sample demonstrates the core loop', () => {
  const request = (passId: string): DiagnoseRequest => ({
    screenplay: sampleScreenplay,
    connections: sampleConnections,
    pass: EPPS_PASSES.find((p) => p.id === passId)!,
    passRunId: 'run-sample-demo',
    now: 1,
  });

  const textOf = (sceneId: string, elementId: string) =>
    sampleScreenplay.scenes.find((s) => s.id === sceneId)!.elements.find((e) => e.id === elementId)!.text;

  it('polish yields at least one approvable proposal citing real sample text', async () => {
    const findings = await localAnalyzer.diagnose(request('polish'));
    const proposals = findings.filter((f) => f.proposal);
    expect(proposals.length).toBeGreaterThanOrEqual(1);
    for (const f of proposals) {
      expect(f.proposal!.oldText).toBe(textOf(f.proposal!.sceneId, f.proposal!.elementId));
      expect(f.proposal!.newText).not.toBe(f.proposal!.oldText);
    }
  });

  it('consistency yields at least one approvable proposal citing real sample text', async () => {
    const findings = await localAnalyzer.diagnose(request('consistency'));
    const proposals = findings.filter((f) => f.proposal);
    expect(proposals.length).toBeGreaterThanOrEqual(1);
    expect(proposals[0].proposal!.oldText).toBe(textOf(proposals[0].proposal!.sceneId, proposals[0].proposal!.elementId));
  });
});

describe('scene pass: scenes with no stated scene point', () => {
  const scenePass = EPPS_PASSES.find((p) => p.id === 'scene')!;

  it('cites exactly the unpointed scenes, at their headings, with no proposal', async () => {
    const { screenplay, connections } = fixture();
    const pointed = screenplay.scenes[0];
    const findings = await localAnalyzer.diagnose({
      screenplay,
      connections,
      scenePoints: {
        [pointed.id]: { ...emptyScenePoint(pointed.id), point: 'The kitchen is a courtroom.' },
      },
      pass: scenePass,
      passRunId: 'run-sp',
      now: 1,
    });
    const f = findings.find((x) => x.summary.includes('Scene Point'));
    expect(f).toBeDefined();
    expect(f!.citations.map((c) => c.elementId)).toEqual(
      screenplay.scenes.slice(1).map((s) => s.elements[0].id),
    );
    expect(f!.proposal).toBeUndefined();
  });

  it('stays silent when every scene has a stated point', async () => {
    const { screenplay, connections } = fixture();
    const scenePoints = Object.fromEntries(
      screenplay.scenes.map((s) => [s.id, { ...emptyScenePoint(s.id), point: `Point of ${s.slug}.` }]),
    );
    const findings = await localAnalyzer.diagnose({
      screenplay,
      connections,
      scenePoints,
      pass: scenePass,
      passRunId: 'run-sp2',
      now: 1,
    });
    expect(findings.find((x) => x.summary.includes('Scene Point'))).toBeUndefined();
  });

  it('with no scene point data at all, it honestly reports every scene unpointed', async () => {
    const findings = await localAnalyzer.diagnose(req('scene'));
    const f = findings.find((x) => x.summary.includes('Scene Point'));
    expect(f).toBeDefined();
    const { screenplay } = fixture();
    expect(f!.citations.length).toBe(screenplay.scenes.length);
  });
});

describe('plot pass: repeated information', () => {
  function withRepeat(): { screenplay: Screenplay; connections: Connection[] } {
    const screenplay: Screenplay = {
      id: 'rx',
      title: 'REPEAT',
      draftLabel: 'D',
      scenes: [
        {
          id: 'rx-s1',
          number: 1,
          act: 1,
          slug: 'INT. OFFICE - DAY',
          storyFunction: 'plot',
          elements: [
            { id: 'rx-s1-e1', type: 'scene_heading', text: 'INT. OFFICE - DAY' },
            { id: 'rx-s1-e2', type: 'action', text: 'The dam upstream has been condemned for years.' },
          ],
        },
        {
          id: 'rx-s2',
          number: 2,
          act: 2,
          slug: 'EXT. RIVER - DAY',
          storyFunction: 'plot',
          elements: [
            { id: 'rx-s2-e1', type: 'scene_heading', text: 'EXT. RIVER - DAY' },
            { id: 'rx-s2-e2', type: 'action', text: 'The dam upstream has been condemned for years.' },
          ],
        },
      ],
    };
    return { screenplay, connections: [] };
  }

  it('cites both occurrences of a near-identical line', async () => {
    const { screenplay, connections } = withRepeat();
    const findings = await localAnalyzer.diagnose({
      screenplay,
      connections,
      pass: EPPS_PASSES.find((p) => p.id === 'plot')!,
      passRunId: 'run-rx',
      now: 1,
    });
    const repeat = findings.find((f) => /same information|word for word|repeat/i.test(f.summary));
    expect(repeat).toBeDefined();
    expect(repeat!.citations).toHaveLength(2);
    expect(repeat!.citations.map((c) => c.elementId).sort()).toEqual(['rx-s1-e2', 'rx-s2-e2']);
  });

  it('does not flag short or one-off lines', async () => {
    const { screenplay, connections } = fixture();
    const findings = await localAnalyzer.diagnose({
      screenplay,
      connections,
      pass: EPPS_PASSES.find((p) => p.id === 'plot')!,
      passRunId: 'run-plain',
      now: 1,
    });
    expect(findings.find((f) => /same information|word for word/i.test(f.summary))).toBeUndefined();
  });
});
