import { beforeEach, describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import { ScreenplayEditor } from './ScreenplayEditor';
import { useAppStore } from '../store/appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('selected-line visibility', () => {
  it('the selected element carries the sp-selected class on the page', () => {
    render(<ScreenplayEditor />);
    act(() => {
      useAppStore.getState().select({ sceneId: 'sc2', elementId: 'sc2-e5' });
    });
    const line = document.querySelector('[data-element-id="sc2-e5"]');
    expect(line?.classList.contains('sp-selected')).toBe(true);
  });

  it('moving the selection moves the highlight', () => {
    render(<ScreenplayEditor />);
    act(() => {
      useAppStore.getState().select({ sceneId: 'sc2', elementId: 'sc2-e5' });
    });
    act(() => {
      useAppStore.getState().select({ sceneId: 'sc3', elementId: 'sc3-e2' });
    });
    expect(document.querySelector('[data-element-id="sc2-e5"]')?.classList.contains('sp-selected')).toBe(false);
    expect(document.querySelector('[data-element-id="sc3-e2"]')?.classList.contains('sp-selected')).toBe(true);
  });
});
