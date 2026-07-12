import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore, elementText } from '../store/appStore';
import { db, initPersistence } from '../store/persistence';
import { parseFountain } from '../io/fountain';
import type { Finding } from './types';

async function until(check: () => Promise<boolean> | boolean, timeoutMs = 2000): Promise<void> {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error('condition not met in time');
}

let dispose: (() => void) | undefined;

beforeEach(async () => {
  dispose?.();
  dispose = undefined;
  await Promise.all([db.documents.clear(), db.ui.clear(), db.baselines.clear(), db.snapshots.clear(), db.workflow.clear()]);
  useAppStore.getState().resetToSample();
});

function fakeFinding(partial: Partial<Finding> = {}): Finding {
  return {
    id: partial.id ?? 'f1',
    passId: 'character',
    passRunId: 'run1',
    provider: 'local',
    claimType: 'ai_hypothesis',
    status: 'uncertain',
    summary: 'Test hypothesis',
    citations: [{ sceneId: 'sc2', elementId: 'sc2-e5' }],
    proposal: {
      sceneId: 'sc2',
      elementId: 'sc2-e5',
      oldText: 'You never stopped keeping score, Papá.',
      newText: 'You never stopped counting, Papá.',
      rationale: 'Sharper verb.',
    },
    resolution: 'open',
    createdAt: 1,
    ...partial,
  };
}

describe('reader caps (Epps rules)', () => {
  it('allows up to five initial readers and rejects the sixth', () => {
    const s = useAppStore.getState();
    for (let i = 0; i < 5; i++) s.addReader(`Reader ${i + 1}`, 'initial');
    expect(useAppStore.getState().workflow.readers).toHaveLength(5);
    expect(() => useAppStore.getState().addReader('One Too Many', 'initial')).toThrow(/five/i);
  });

  it('allows exactly one interim reader', () => {
    useAppStore.getState().addReader('Diego M.', 'interim');
    expect(() => useAppStore.getState().addReader('Second Interim', 'interim')).toThrow(/one/i);
  });
});

describe('annotated-read gate', () => {
  it('blocks AI findings before the writer completes the private read', () => {
    expect(useAppStore.getState().workflow.annotatedReadComplete).toBe(false);
    expect(() => useAppStore.getState().setFindings('run1', [fakeFinding()])).toThrow(/annotated read/i);
  });

  it('unlocks after completeAnnotatedRead()', () => {
    useAppStore.getState().completeAnnotatedRead();
    useAppStore.getState().setFindings('run1', [fakeFinding()]);
    expect(useAppStore.getState().workflow.findings).toHaveLength(1);
  });
});

describe('approvals and the scene lock', () => {
  beforeEach(() => {
    useAppStore.getState().completeAnnotatedRead();
  });

  it('approving a proposal applies exactly the cited element and records provenance', () => {
    useAppStore.getState().setFindings('run1', [fakeFinding()]);
    useAppStore.getState().approveProposal('f1');
    const s = useAppStore.getState();
    expect(elementText(s.screenplay, 'sc2', 'sc2-e5')).toBe('You never stopped counting, Papá.');
    expect(s.workflow.findings[0].resolution).toBe('approved');
    expect(s.workflow.approvals).toHaveLength(1);
    expect(s.workflow.approvals[0]).toMatchObject({
      findingId: 'f1',
      passId: 'character',
      elementId: 'sc2-e5',
      why: 'Sharper verb.',
    });
  });

  it('rejecting changes nothing and archives the finding', () => {
    useAppStore.getState().setFindings('run1', [fakeFinding()]);
    useAppStore.getState().rejectFinding('f1');
    const s = useAppStore.getState();
    expect(elementText(s.screenplay, 'sc2', 'sc2-e5')).toBe('You never stopped keeping score, Papá.');
    expect(s.workflow.findings[0].resolution).toBe('rejected');
    expect(s.workflow.approvals).toHaveLength(0);
  });

  it('refuses a proposal that targets an element the finding does not cite (scene lock)', () => {
    const rogue = fakeFinding({
      id: 'f2',
      proposal: {
        sceneId: 'sc9',
        elementId: 'sc9-e2',
        oldText: 'whatever',
        newText: 'HACKED',
        rationale: 'should never apply',
      },
    });
    useAppStore.getState().setFindings('run1', [rogue]);
    expect(() => useAppStore.getState().approveProposal('f2')).toThrow(/cite/i);
    expect(elementText(useAppStore.getState().screenplay, 'sc9', 'sc9-e2')).not.toBe('HACKED');
  });

  it('approving with no revision set auto-starts one so the change is marked', () => {
    expect(useAppStore.getState().revisionBaseline).toBeNull();
    useAppStore.getState().setFindings('run1', [fakeFinding()]);
    useAppStore.getState().approveProposal('f1');
    const s = useAppStore.getState();
    expect(s.revisionBaseline).not.toBeNull();
    expect(s.revisionBaseline!['sc2-e5']).toBe('You never stopped keeping score, Papá.');
    expect(s.revisionSetLabel).toBeTruthy();
  });

  it('approving records an AI evidence link on the changed line', () => {
    useAppStore.getState().setFindings('run1', [fakeFinding()]);
    useAppStore.getState().approveProposal('f1');
    const linked = useAppStore
      .getState()
      .evidence.filter((e) => e.elementId === 'sc2-e5' && e.source === 'ai');
    expect(linked).toHaveLength(1);
    expect(linked[0].claimType).toBe('writer_confirmed');
    expect(linked[0].summary).toBe('Test hypothesis');
  });

  it('an approved change shows as revised when a revision set is active', () => {
    useAppStore.getState().startRevisionSet('Blue');
    useAppStore.getState().setFindings('run1', [fakeFinding()]);
    useAppStore.getState().approveProposal('f1');
    const s = useAppStore.getState();
    expect(s.revisionBaseline!['sc2-e5']).not.toBe(elementText(s.screenplay, 'sc2', 'sc2-e5'));
  });
});

describe('pass orchestration', () => {
  it('completing a pass snapshots the draft and bumps the draft label', async () => {
    const before = useAppStore.getState().screenplay.draftLabel;
    await useAppStore.getState().completePass('character');
    const s = useAppStore.getState();
    expect(s.workflow.passRuns.character).toBe('complete');
    expect(s.screenplay.draftLabel).toBe('Rewrite 1');
    expect(s.screenplay.draftLabel).not.toBe(before);
    const snaps = await db.snapshots.where('screenplayId').equals(s.screenplay.id).toArray();
    expect(snaps).toHaveLength(1);
    expect(snaps[0].label).toMatch(/Character/);
  });

  it('each completed pass counts up the rewrite label', async () => {
    await useAppStore.getState().completePass('character');
    await useAppStore.getState().completePass('dialogue');
    expect(useAppStore.getState().screenplay.draftLabel).toBe('Rewrite 2');
  });

  it('passes are reusable lenses: a complete pass can run again', async () => {
    await useAppStore.getState().completePass('character');
    useAppStore.getState().setPassRunState('character', 'diagnosing');
    expect(useAppStore.getState().workflow.passRuns.character).toBe('diagnosing');
  });
});

describe('snapshots and document replacement', () => {
  it('takeSnapshot + restoreSnapshot round-trips the draft', async () => {
    dispose = await initPersistence({ debounceMs: 5 });
    const snapId = await useAppStore.getState().takeSnapshot('before test');
    useAppStore.getState().updateElementText('sc2', 'sc2-e5', 'CHANGED.');
    await useAppStore.getState().restoreSnapshot(snapId);
    expect(elementText(useAppStore.getState().screenplay, 'sc2', 'sc2-e5')).toBe(
      'You never stopped keeping score, Papá.',
    );
  });

  it('replaceDocument switches the working draft and survives reload', async () => {
    dispose = await initPersistence({ debounceMs: 5 });
    const imported = parseFountain('Title: TEST\n\nINT. ROOM - DAY\n\nA table.\n');
    useAppStore.getState().replaceDocument(imported);
    const s = useAppStore.getState();
    expect(s.screenplay.title).toBe('TEST');
    expect(s.evidence).toHaveLength(0);
    expect(s.workflow.annotatedReadComplete).toBe(false);
    await until(async () => (await db.ui.get('ui'))?.activeDocumentId === imported.id);
    await until(async () => !!(await db.documents.get(imported.id)));
    dispose();

    useAppStore.getState().resetToSample();
    dispose = await initPersistence({ debounceMs: 5 });
    expect(useAppStore.getState().screenplay.title).toBe('TEST');
  });
});
