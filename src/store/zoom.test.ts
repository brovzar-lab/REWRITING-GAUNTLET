import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from './appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('zoom', () => {
  it('defaults to 100%', () => {
    expect(useAppStore.getState().zoom).toBe(1);
  });

  it('clamps to the 50%–200% range', () => {
    useAppStore.getState().setZoom(3);
    expect(useAppStore.getState().zoom).toBe(2);
    useAppStore.getState().setZoom(0.1);
    expect(useAppStore.getState().zoom).toBe(0.5);
    useAppStore.getState().setZoom(1.3);
    expect(useAppStore.getState().zoom).toBeCloseTo(1.3);
  });
});
