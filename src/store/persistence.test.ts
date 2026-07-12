import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore, elementText } from './appStore';
import { db, initPersistence } from './persistence';
import { sampleScreenplay } from '../model/sample/gauntlet-sample';

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
});
