import { beforeEach, describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScreenplayEditor } from './ScreenplayEditor';
import { useAppStore } from '../store/appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('annotation markers', () => {
  it('renders a note marker with count on lines that have evidence', () => {
    render(<ScreenplayEditor />);
    // Sample data ships one note on sc2-e2.
    const marker = document.querySelector('[data-element-id="sc2-e2"] .sp-note-marker');
    expect(marker).not.toBeNull();
    expect(marker!.textContent).toBe('1');
    // Lines without evidence carry no marker.
    expect(document.querySelector('[data-element-id="sc2-e1"] .sp-note-marker')).toBeNull();
  });

  it('marker click selects the line and opens the evidence tab', async () => {
    const user = userEvent.setup();
    useAppStore.getState().setInspectorTab('pass');
    render(<ScreenplayEditor />);
    const marker = document.querySelector('[data-element-id="sc2-e2"] .sp-note-marker') as HTMLElement;
    await user.click(marker);
    expect(useAppStore.getState().selection).toEqual({ sceneId: 'sc2', elementId: 'sc2-e2' });
    expect(useAppStore.getState().inspectorTab).toBe('evidence');
  });

  it('adding a note updates the marker count', () => {
    render(<ScreenplayEditor />);
    act(() => {
      useAppStore.getState().addEvidenceNote({
        id: 'ev-test-1',
        source: 'writer',
        claimType: 'textual_fact',
        status: 'uncertain',
        summary: 'Second note on this line.',
        sceneId: 'sc2',
        elementId: 'sc2-e2',
      });
    });
    const marker = document.querySelector('[data-element-id="sc2-e2"] .sp-note-marker');
    expect(marker!.textContent).toBe('2');
  });
});
