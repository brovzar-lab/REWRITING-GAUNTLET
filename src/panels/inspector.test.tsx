import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvidenceInspector } from './EvidenceInspector';
import { useAppStore } from '../store/appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('EvidenceInspector', () => {
  it('prompts for a selection when nothing is selected', () => {
    render(<EvidenceInspector />);
    expect(screen.getByText('Select a screenplay line to see its evidence.')).toBeInTheDocument();
  });

  it('shows scene evidence with source, claim type, and status as icon + word', () => {
    useAppStore.getState().select({ sceneId: 'sc4', elementId: 'sc4-e4' });
    render(<EvidenceInspector />);
    // ev2 attaches to sc4-e4: reader "Ana P.", reader_reaction, priority_concern
    expect(screen.getByText(/Raúl’s buyout offer lands before/)).toBeInTheDocument();
    expect(screen.getByText('Reader')).toBeInTheDocument();
    expect(screen.getByText('Ana P.')).toBeInTheDocument();
    expect(screen.getByText('Reader reaction')).toBeInTheDocument();
    const status = screen.getByText('Priority concern');
    expect(status.closest('.evidence-status')?.querySelector('[data-status-icon]')).not.toBeNull();
  });

  it('lists other evidence in the same scene under a scene section', () => {
    // sc4-e1 (heading) has no direct evidence, but the scene has ev2
    useAppStore.getState().select({ sceneId: 'sc4', elementId: 'sc4-e1' });
    render(<EvidenceInspector />);
    expect(screen.getByText('No evidence is attached to this line yet.')).toBeInTheDocument();
    expect(screen.getByText(/Raúl’s buyout offer lands before/)).toBeInTheDocument();
  });

  it('clicking an evidence record selects its exact element (evidence → page round trip)', async () => {
    const user = userEvent.setup();
    useAppStore.getState().select({ sceneId: 'sc4', elementId: 'sc4-e1' });
    render(<EvidenceInspector />);
    await user.click(screen.getByRole('button', { name: /Raúl’s buyout offer lands before/ }));
    expect(useAppStore.getState().selection).toEqual({ sceneId: 'sc4', elementId: 'sc4-e4' });
  });
});
