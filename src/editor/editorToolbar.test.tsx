import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorToolbar } from './EditorToolbar';
import { ScreenplayEditor } from './ScreenplayEditor';
import { useAppStore } from '../store/appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

function renderEditorWithToolbar() {
  return render(
    <>
      <EditorToolbar />
      <ScreenplayEditor />
    </>,
  );
}

describe('editor toolbar', () => {
  it('element selector reflects the selected element type and changes it', async () => {
    const user = userEvent.setup();
    renderEditorWithToolbar();
    act(() => {
      useAppStore.getState().select({ sceneId: 'sc2', elementId: 'sc2-e5' });
    });
    const select = screen.getByLabelText('Element type') as HTMLSelectElement;
    const before = select.value;
    expect(['dialogue', 'action', 'character', 'scene_heading', 'parenthetical', 'transition']).toContain(before);
    const target = before === 'action' ? 'dialogue' : 'action';
    await user.selectOptions(select, target);
    const line = document.querySelector('[data-element-id="sc2-e5"]');
    expect(line?.getAttribute('data-element-type')).toBe(target);
  });

  it('undo is disabled with no history and undoes an element retype', async () => {
    const user = userEvent.setup();
    renderEditorWithToolbar();
    const undoButton = screen.getByRole('button', { name: 'Undo' });
    expect(undoButton).toBeDisabled();
    act(() => {
      useAppStore.getState().select({ sceneId: 'sc2', elementId: 'sc2-e5' });
    });
    const select = screen.getByLabelText('Element type') as HTMLSelectElement;
    const original = select.value;
    await user.selectOptions(select, original === 'action' ? 'dialogue' : 'action');
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    const line = document.querySelector('[data-element-id="sc2-e5"]');
    expect(line?.getAttribute('data-element-type')).toBe(original);
  });

  it('hosts zoom controls and a go-to-page button', async () => {
    const user = userEvent.setup();
    renderEditorWithToolbar();
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(useAppStore.getState().zoom).toBeCloseTo(1.1);
    await user.click(screen.getByRole('button', { name: 'Go to page' }));
    expect(useAppStore.getState().goToPageOpen).toBe(true);
  });
});
