import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkPalette } from './MarkPalette';
import { useAppStore } from '../store/appStore';

describe('MarkPalette', () => {
  beforeEach(() => {
    const s = useAppStore.getState();
    s.resetToSample();
    s.enterReadMode();
    const scene = useAppStore.getState().screenplay.scenes[0];
    useAppStore.getState().select({ sceneId: scene.id, elementId: scene.elements[0].id });
  });

  it('clicking a mark row adds a mark on the selected line', async () => {
    render(<MarkPalette />);
    await userEvent.click(screen.getByRole('button', { name: /Great stuff/ }));
    const marks = useAppStore.getState().workflow.readMarks;
    expect(marks).toHaveLength(1);
    expect(marks[0].type).toBe('great');
  });

  it('keyboard shortcut X adds a cut mark', async () => {
    render(<MarkPalette />);
    await userEvent.keyboard('x');
    expect(useAppStore.getState().workflow.readMarks[0]?.type).toBe('cut');
  });

  it('pressing the same key again removes the mark (toggle)', async () => {
    render(<MarkPalette />);
    await userEvent.keyboard('g');
    await userEvent.keyboard('g');
    expect(useAppStore.getState().workflow.readMarks).toHaveLength(0);
  });
});
