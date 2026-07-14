import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from './appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('polish read store state', () => {
  it('starts inactive and complete=false', () => {
    const s = useAppStore.getState();
    expect(s.polishReadActive).toBe(false);
    expect(s.polishReadComplete).toBe(false);
  });

  it('start activates at page 1; page setter never goes below 1', () => {
    const s = useAppStore.getState();
    s.startPolishRead();
    expect(useAppStore.getState().polishReadActive).toBe(true);
    expect(useAppStore.getState().polishReadPage).toBe(1);
    s.setPolishReadPage(-3);
    expect(useAppStore.getState().polishReadPage).toBe(1);
  });

  it('completing marks it done, exits, and makes the Polish pass reviewable', () => {
    const s = useAppStore.getState();
    s.startPolishRead();
    s.completePolishRead();
    const st = useAppStore.getState();
    expect(st.polishReadActive).toBe(false);
    expect(st.polishReadComplete).toBe(true);
    expect(st.workflow.passRuns.polish).toBe('reviewing');
  });

  it('does not downgrade an already-complete Polish pass', () => {
    const s = useAppStore.getState();
    s.setPassRunState('polish', 'complete');
    s.completePolishRead();
    expect(useAppStore.getState().workflow.passRuns.polish).toBe('complete');
  });

  it('importing a new document resets the polish read', () => {
    const s = useAppStore.getState();
    s.startPolishRead();
    s.completePolishRead();
    s.replaceDocument({ id: 'n', title: 'N', draftLabel: 'First', scenes: s.screenplay.scenes });
    expect(useAppStore.getState().polishReadComplete).toBe(false);
  });
});
