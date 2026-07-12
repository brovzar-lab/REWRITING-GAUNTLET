import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { computeRevisedElements, snapshotTexts } from './revision';
import { sampleScreenplay } from '../model/sample/gauntlet-sample';
import { useAppStore, elementText } from '../store/appStore';
import { db, initPersistence } from '../store/persistence';

async function until(check: () => Promise<boolean> | boolean, timeoutMs = 2000): Promise<void> {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error('condition not met in time');
}

describe('computeRevisedElements', () => {
  it('flags nothing when the draft matches the baseline', () => {
    const baseline = snapshotTexts(sampleScreenplay);
    expect(computeRevisedElements(sampleScreenplay, baseline).size).toBe(0);
  });

  it('flags an element whose text changed', () => {
    const baseline = snapshotTexts(sampleScreenplay);
    const changed = structuredClone(sampleScreenplay);
    changed.scenes[1].elements[4].text = 'You never stopped counting, Papá.';
    const revised = computeRevisedElements(changed, baseline);
    expect(revised.has('sc2-e5')).toBe(true);
    expect(revised.size).toBe(1);
  });

  it('flags an element that did not exist at baseline time', () => {
    const baseline = snapshotTexts(sampleScreenplay);
    const changed = structuredClone(sampleScreenplay);
    changed.scenes[0].elements.push({ id: 'sc1-new', type: 'action', text: 'New beat.' });
    expect(computeRevisedElements(changed, baseline).has('sc1-new')).toBe(true);
  });
});

describe('revision set persistence', () => {
  let dispose: (() => void) | undefined;

  beforeEach(async () => {
    dispose?.();
    await db.documents.clear();
    await db.ui.clear();
    await db.baselines.clear();
    useAppStore.getState().resetToSample();
  });

  it('startRevisionSet snapshots the draft and survives a reload', async () => {
    dispose = await initPersistence({ debounceMs: 5 });
    useAppStore.getState().startRevisionSet('Blue');
    useAppStore.getState().updateElementText('sc2', 'sc2-e5', 'REVISED FOR BLUE.');
    await until(async () => !!(await db.baselines.get(sampleScreenplay.id)));
    dispose();

    useAppStore.getState().resetToSample();
    expect(useAppStore.getState().revisionBaseline).toBeNull();
    dispose = await initPersistence({ debounceMs: 5 });

    const s = useAppStore.getState();
    expect(s.revisionSetLabel).toBe('Blue');
    expect(s.revisionBaseline).not.toBeNull();
    expect(elementText(s.screenplay, 'sc2', 'sc2-e5')).toBe('REVISED FOR BLUE.');
    expect(computeRevisedElements(s.screenplay, s.revisionBaseline!).has('sc2-e5')).toBe(true);
  });
});
