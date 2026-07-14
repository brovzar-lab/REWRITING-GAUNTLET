import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from './appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('high point store state', () => {
  it('assigns a structural role to a scene, unique across scenes', () => {
    const s = useAppStore.getState();
    s.setHighPoint('sc4', 'midpoint');
    s.setHighPoint('sc6', 'midpoint'); // moving the unique role
    const hp = useAppStore.getState().highPoints;
    expect(hp.filter((m) => m.role === 'midpoint')).toEqual([{ role: 'midpoint', sceneId: 'sc6' }]);
  });

  it('a scene holds at most one marker; a new role replaces the old', () => {
    const s = useAppStore.getState();
    s.setHighPoint('sc4', 'midpoint');
    s.setHighPoint('sc4', 'emotional_high');
    const hp = useAppStore.getState().highPoints.filter((m) => m.sceneId === 'sc4');
    expect(hp).toEqual([{ role: 'emotional_high', sceneId: 'sc4' }]);
  });

  it('clears a scene marker with null', () => {
    const s = useAppStore.getState();
    s.setHighPoint('sc4', 'climax');
    s.setHighPoint('sc4', null);
    expect(useAppStore.getState().highPoints.find((m) => m.sceneId === 'sc4')).toBeUndefined();
  });

  it('emotional markers may repeat across scenes', () => {
    const s = useAppStore.getState();
    s.setHighPoint('sc2', 'emotional_low');
    s.setHighPoint('sc5', 'emotional_low');
    expect(useAppStore.getState().highPoints.filter((m) => m.role === 'emotional_low')).toHaveLength(2);
  });

  it('importing a new document clears high points', () => {
    const s = useAppStore.getState();
    s.setHighPoint('sc4', 'midpoint');
    s.replaceDocument({ id: 'n', title: 'N', draftLabel: 'First', scenes: s.screenplay.scenes });
    expect(useAppStore.getState().highPoints).toEqual([]);
  });
});
