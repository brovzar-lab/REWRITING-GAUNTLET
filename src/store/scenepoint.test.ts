import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from './appStore';
import { emptyScenePoint } from '../model/scenepoint';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('scene point store state', () => {
  it('starts empty and creates a scene point on first update', () => {
    const s = useAppStore.getState();
    expect(s.scenePoints).toEqual({});
    s.updateScenePoint('sc2', { point: 'Marisol refuses her brother’s help.' });
    expect(useAppStore.getState().scenePoints.sc2).toEqual({
      ...emptyScenePoint('sc2'),
      point: 'Marisol refuses her brother’s help.',
    });
  });

  it('patches verdict and extension fields without losing the point', () => {
    const s = useAppStore.getState();
    s.updateScenePoint('sc2', { point: 'The wake reopens the ledger.' });
    s.updateScenePoint('sc2', { verdict: 'cut_candidate' });
    s.updateScenePoint('sc2', { conflict: 'Grief vs arithmetic.' });
    const sp = useAppStore.getState().scenePoints.sc2;
    expect(sp.point).toBe('The wake reopens the ledger.');
    expect(sp.verdict).toBe('cut_candidate');
    expect(sp.conflict).toBe('Grief vs arithmetic.');
  });

  it('importing a new document resets scene points — they belong to the old draft', () => {
    const s = useAppStore.getState();
    s.updateScenePoint('sc2', { point: 'Old draft point.' });
    s.replaceDocument({ id: 'new-doc', title: 'NEW', draftLabel: 'First', scenes: s.screenplay.scenes });
    expect(useAppStore.getState().scenePoints).toEqual({});
  });
});
