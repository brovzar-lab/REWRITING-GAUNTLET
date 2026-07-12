import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnnotatedReadBar } from './AnnotatedReadBar';
import { useAppStore } from '../store/appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('annotated read mode', () => {
  it('entering the read selects scene 1 and marks it visited', () => {
    useAppStore.getState().enterReadMode();
    const s = useAppStore.getState();
    const first = s.screenplay.scenes[0];
    expect(s.readModeActive).toBe(true);
    expect(s.selection?.sceneId).toBe(first.id);
    expect(s.workflow.visitedScenes).toContain(first.id);
  });

  it('next and previous walk the scenes and record visits', async () => {
    useAppStore.getState().enterReadMode();
    const user = userEvent.setup();
    render(<AnnotatedReadBar />);
    await user.click(screen.getByRole('button', { name: /next scene/i }));
    const s = useAppStore.getState();
    expect(s.selection?.sceneId).toBe(s.screenplay.scenes[1].id);
    expect(s.workflow.visitedScenes).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: /previous scene/i }));
    expect(useAppStore.getState().selection?.sceneId).toBe(s.screenplay.scenes[0].id);
  });

  it('a margin note saves as writer evidence on the current scene', async () => {
    useAppStore.getState().enterReadMode();
    const user = userEvent.setup();
    render(<AnnotatedReadBar />);
    await user.type(screen.getByLabelText(/margin note/i), 'Opening feels slow.');
    await user.click(screen.getByRole('button', { name: /save margin note/i }));
    const added = useAppStore.getState().evidence.at(-1)!;
    expect(added.source).toBe('writer');
    expect(added.sceneId).toBe(useAppStore.getState().screenplay.scenes[0].id);
    expect(added.summary).toBe('Opening feels slow.');
  });

  it('complete stays disabled until every scene is visited, then unlocks AI', async () => {
    useAppStore.getState().enterReadMode();
    const user = userEvent.setup();
    render(<AnnotatedReadBar />);
    const complete = screen.getByRole('button', { name: /mark read complete/i });
    expect(complete).toBeDisabled();

    const sceneCount = useAppStore.getState().screenplay.scenes.length;
    for (let i = 0; i < sceneCount - 1; i++) {
      await user.click(screen.getByRole('button', { name: /next scene/i }));
    }
    expect(complete).toBeEnabled();
    await user.click(complete);
    const s = useAppStore.getState();
    expect(s.workflow.annotatedReadComplete).toBe(true);
    expect(s.readModeActive).toBe(false);
  });

  it('says the read is private and that AI stays locked', () => {
    useAppStore.getState().enterReadMode();
    render(<AnnotatedReadBar />);
    expect(screen.getByText(/This read is private/i)).toBeInTheDocument();
    expect(screen.getByText(/locked until/i)).toBeInTheDocument();
  });
});
