import { describe, expect, it } from 'vitest';
import { emptyScenePoint, hasStatedPoint, unpointedScenes } from './scenepoint';
import { sampleScreenplay } from './sample/gauntlet-sample';

describe('emptyScenePoint', () => {
  it('starts with no point, no verdict, and empty extension fields', () => {
    const sp = emptyScenePoint('sc1');
    expect(sp.sceneId).toBe('sc1');
    expect(sp.point).toBe('');
    expect(sp.verdict).toBeNull();
    expect(sp.conflict).toBe('');
    expect(sp.turn).toBe('');
    expect(sp.valueChange).toBe('');
    expect(sp.audienceLearns).toBe('');
  });
});

describe('hasStatedPoint', () => {
  it('only a non-blank point counts as stated', () => {
    expect(hasStatedPoint(undefined)).toBe(false);
    expect(hasStatedPoint(emptyScenePoint('sc1'))).toBe(false);
    expect(hasStatedPoint({ ...emptyScenePoint('sc1'), point: '   ' })).toBe(false);
    expect(hasStatedPoint({ ...emptyScenePoint('sc1'), point: 'Marisol finds the ledger.' })).toBe(true);
  });
});

describe('unpointedScenes', () => {
  it('returns exactly the scenes with no stated point, in script order', () => {
    const all = unpointedScenes(sampleScreenplay, {});
    expect(all.map((s) => s.id)).toEqual(sampleScreenplay.scenes.map((s) => s.id));

    const first = sampleScreenplay.scenes[0];
    const some = unpointedScenes(sampleScreenplay, {
      [first.id]: { ...emptyScenePoint(first.id), point: 'The drought owns this valley.' },
    });
    expect(some.map((s) => s.id)).toEqual(sampleScreenplay.scenes.slice(1).map((s) => s.id));
  });
});
