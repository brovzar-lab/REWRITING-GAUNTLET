import { describe, expect, it } from 'vitest';
import { useAppStore } from './appStore';

describe('board dock', () => {
  it('defaults to side and can dock to bottom', () => {
    expect(useAppStore.getState().boardDock).toBe('side');
    useAppStore.getState().setBoardDock('bottom');
    expect(useAppStore.getState().boardDock).toBe('bottom');
    useAppStore.getState().setBoardDock('side');
    expect(useAppStore.getState().boardDock).toBe('side');
  });
});
