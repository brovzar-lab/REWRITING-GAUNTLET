import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore, elementText } from './appStore';
import { db, initPersistence } from './persistence';
import { sampleScreenplay } from '../model/sample/gauntlet-sample';
import { emptyGamePlan } from '../model/gameplan';

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
  await db.documents.clear();
  await db.ui.clear();
  await db.workflow.clear();
  await db.baselines.clear();
  useAppStore.getState().resetToSample();
});

describe('store', () => {
  it('updateElementText mutates the canonical model', () => {
    useAppStore.getState().updateElementText('sc2', 'sc2-e5', 'REVISED LINE.');
    expect(elementText(useAppStore.getState().screenplay, 'sc2', 'sc2-e5')).toBe('REVISED LINE.');
  });

  it('reorderScenes moves a scene and renumbers sequentially', () => {
    useAppStore.getState().reorderScenes(0, 2);
    const scenes = useAppStore.getState().screenplay.scenes;
    expect(scenes[2].id).toBe('sc1');
    scenes.forEach((s, i) => expect(s.number).toBe(i + 1));
  });
});

describe('persistence', () => {
  it('autosaves an edit to IndexedDB (debounced)', async () => {
    dispose = await initPersistence({ debounceMs: 5 });
    useAppStore.getState().updateElementText('sc2', 'sc2-e5', 'You never stopped counting, Papá.');
    await until(async () => {
      const row = await db.documents.get(sampleScreenplay.id);
      return !!row && elementText(row.screenplay, 'sc2', 'sc2-e5') === 'You never stopped counting, Papá.';
    });
  });

  it('recovers the edited draft and UI state into a fresh boot', async () => {
    dispose = await initPersistence({ debounceMs: 5 });
    const s = useAppStore.getState();
    s.updateElementText('sc2', 'sc2-e5', 'RECOVERED AFTER RELOAD.');
    s.setTheme('day');
    s.setActivePass('character');
    await until(async () => !!(await db.documents.get(sampleScreenplay.id)));
    await until(async () => (await db.ui.get('ui'))?.theme === 'day');
    dispose();

    // Simulate a reload: store falls back to pristine sample, then hydrates.
    useAppStore.getState().resetToSample();
    expect(elementText(useAppStore.getState().screenplay, 'sc2', 'sc2-e5')).not.toBe('RECOVERED AFTER RELOAD.');
    dispose = await initPersistence({ debounceMs: 5 });
    const state = useAppStore.getState();
    expect(elementText(state.screenplay, 'sc2', 'sc2-e5')).toBe('RECOVERED AFTER RELOAD.');
    expect(state.theme).toBe('day');
    expect(state.activePassId).toBe('character');
  });

  it('the game plan survives a reload', async () => {
    dispose = await initPersistence({ debounceMs: 5 });
    const s = useAppStore.getState();
    s.updateGamePlan({ statementOfIntent: 'Sharpen the father-daughter spine.' });
    s.addMotif('Herons');
    const motifId = useAppStore.getState().gamePlan.compass.motifs[0].id;
    s.addMotifOccurrence(motifId, { sceneId: 'sc2', elementId: 'sc2-e5' });
    await until(async () => {
      const row = await db.workflow.get(sampleScreenplay.id);
      return row?.gamePlan?.statementOfIntent === 'Sharpen the father-daughter spine.';
    });
    dispose();

    useAppStore.getState().resetToSample();
    expect(useAppStore.getState().gamePlan.statementOfIntent).toBe('');
    dispose = await initPersistence({ debounceMs: 5 });
    const gp = useAppStore.getState().gamePlan;
    expect(gp.statementOfIntent).toBe('Sharpen the father-daughter spine.');
    expect(gp.compass.motifs[0].name).toBe('Herons');
    expect(gp.compass.motifs[0].occurrences).toEqual([{ sceneId: 'sc2', elementId: 'sc2-e5' }]);
  });

  it('scene points survive a reload', async () => {
    dispose = await initPersistence({ debounceMs: 5 });
    const s = useAppStore.getState();
    s.updateScenePoint('sc2', { point: 'The wake reopens the ledger.', verdict: 'earns' });
    await until(async () => {
      const row = await db.workflow.get(sampleScreenplay.id);
      return row?.scenePoints?.sc2?.point === 'The wake reopens the ledger.';
    });
    dispose();

    useAppStore.getState().resetToSample();
    expect(useAppStore.getState().scenePoints).toEqual({});
    dispose = await initPersistence({ debounceMs: 5 });
    const sp = useAppStore.getState().scenePoints.sc2;
    expect(sp.point).toBe('The wake reopens the ledger.');
    expect(sp.verdict).toBe('earns');
  });

  it('story beats survive a reload', async () => {
    dispose = await initPersistence({ debounceMs: 5 });
    const s = useAppStore.getState();
    s.setStoryBeat('setup', 'sc1', 'sc1-e2');
    s.setStoryBeat('payoff', 'sc3', 'sc3-e1');
    const setup = useAppStore.getState().storyBeats.find((b) => b.elementId === 'sc1-e2')!;
    const payoff = useAppStore.getState().storyBeats.find((b) => b.elementId === 'sc3-e1')!;
    s.pairBeats(setup.id, payoff.id);
    await until(async () => {
      const row = await db.workflow.get(sampleScreenplay.id);
      return (row?.storyBeats?.length ?? 0) === 2;
    });
    dispose();

    useAppStore.getState().resetToSample();
    expect(useAppStore.getState().storyBeats).toEqual([]);
    dispose = await initPersistence({ debounceMs: 5 });
    const beats = useAppStore.getState().storyBeats;
    expect(beats).toHaveLength(2);
    const reloadedSetup = beats.find((b) => b.elementId === 'sc1-e2')!;
    expect(reloadedSetup.kind).toBe('setup');
    expect(reloadedSetup.pairedWith).toBe(beats.find((b) => b.elementId === 'sc3-e1')!.id);
  });

  it('high points survive a reload', async () => {
    dispose = await initPersistence({ debounceMs: 5 });
    useAppStore.getState().setHighPoint('sc4', 'midpoint');
    useAppStore.getState().setHighPoint('sc2', 'emotional_low');
    await until(async () => {
      const row = await db.workflow.get(sampleScreenplay.id);
      return (row?.highPoints?.length ?? 0) === 2;
    });
    dispose();

    useAppStore.getState().resetToSample();
    expect(useAppStore.getState().highPoints).toEqual([]);
    dispose = await initPersistence({ debounceMs: 5 });
    const hp = useAppStore.getState().highPoints;
    expect(hp).toContainEqual({ role: 'midpoint', sceneId: 'sc4' });
    expect(hp).toContainEqual({ role: 'emotional_low', sceneId: 'sc2' });
  });

  it('a finished Polish Read survives a reload', async () => {
    dispose = await initPersistence({ debounceMs: 5 });
    useAppStore.getState().startPolishRead();
    useAppStore.getState().completePolishRead();
    await until(async () => (await db.workflow.get(sampleScreenplay.id))?.polishReadComplete === true);
    dispose();

    useAppStore.getState().resetToSample();
    expect(useAppStore.getState().polishReadComplete).toBe(false);
    dispose = await initPersistence({ debounceMs: 5 });
    expect(useAppStore.getState().polishReadComplete).toBe(true);
  });

  it('a pre-methodology save (no gamePlan key) hydrates with defaults and loses nothing', async () => {
    // Simulate a workflow row written before the Epps methodology phase.
    await db.workflow.put({
      id: sampleScreenplay.id,
      state: {
        annotatedReadComplete: true,
        visitedScenes: ['sc1'],
        readers: [],
        findings: [],
        approvals: [],
        passRuns: { polish: 'complete' },
        cloudAiConsent: false,
        // Legacy row: intentionally no readMarks / reader notes — hydration
        // must normalize them (see loadWorkflow).
      } as unknown as import('../workflow/types').WorkflowState,
      evidence: [],
      connections: [],
    });
    dispose = await initPersistence({ debounceMs: 5 });
    const state = useAppStore.getState();
    expect(state.workflow.annotatedReadComplete).toBe(true);
    expect(state.workflow.visitedScenes).toEqual(['sc1']);
    expect(state.workflow.passRuns.polish).toBe('complete');
    expect(state.gamePlan).toEqual(emptyGamePlan());
    expect(state.scenePoints).toEqual({});
    expect(state.storyBeats).toEqual([]);
    expect(state.highPoints).toEqual([]);
    expect(state.polishReadComplete).toBe(false);
  });
});
