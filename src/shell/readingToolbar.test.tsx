import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReadingToolbar } from './ReadingToolbar';
import { useAppStore } from '../store/appStore';

describe('ReadingToolbar', () => {
  beforeEach(() => {
    const s = useAppStore.getState();
    s.resetToSample();
    s.enterReadMode();
  });

  it('shows the lock chip and the Studio Extension label', () => {
    render(<ReadingToolbar />);
    expect(screen.getByText(/Reading — editing is off/i)).toBeInTheDocument();
    expect(screen.getByText(/Studio Extension/)).toBeInTheDocument();
  });

  it('Finish sitting completes the read when all scenes are visited', () => {
    const scenes = useAppStore.getState().screenplay.scenes;
    scenes.forEach((sc) => useAppStore.getState().markSceneVisited(sc.id));
    render(<ReadingToolbar />);
    screen.getByRole('button', { name: 'Finish sitting' }).click();
    expect(useAppStore.getState().workflow.annotatedReadComplete).toBe(true);
    expect(useAppStore.getState().readModeActive).toBe(false);
  });

  it('Pause read exits without completing', () => {
    render(<ReadingToolbar />);
    screen.getByRole('button', { name: 'Pause read' }).click();
    expect(useAppStore.getState().readModeActive).toBe(false);
    expect(useAppStore.getState().workflow.annotatedReadComplete).toBe(false);
  });
});
