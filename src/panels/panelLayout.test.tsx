import { beforeEach, describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import { PanelLayout } from './PanelLayout';
import { useAppStore } from '../store/appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
  useAppStore.getState().setBoardDock('side');
});

function renderLayout() {
  return render(
    <PanelLayout
      topBar={<span>bar</span>}
      navigator={<span>nav</span>}
      editor={<span>editor</span>}
      board={<div className="board">board</div>}
      inspector={<span>inspector</span>}
      tray={<span>tray</span>}
    />,
  );
}

describe('board dock layout', () => {
  it('side dock puts the board in the middle grid, no bottom shelf', () => {
    const { container } = renderLayout();
    expect(container.querySelector('.middle .board-panel .board')).not.toBeNull();
    expect(container.querySelector('.board-shelf')).toBeNull();
  });

  it('bottom dock keeps the board shelf below the middle grid', () => {
    const { container } = renderLayout();
    act(() => {
      useAppStore.getState().setBoardDock('bottom');
    });
    expect(container.querySelector('.board-shelf .board')).not.toBeNull();
    expect(container.querySelector('.middle .board-panel')).toBeNull();
  });
});
