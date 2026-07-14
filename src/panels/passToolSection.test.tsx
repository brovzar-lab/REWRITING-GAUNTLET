import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PassToolSection } from './PassToolSection';
import { useAppStore } from '../store/appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('Plot pass tool section: set-up / pay-off status', () => {
  it('renders nothing until the writer marks a beat — no dead UI', () => {
    const { container } = render(<PassToolSection passId="plot" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists statuses as writer facts and jumps to the exact line', async () => {
    const user = userEvent.setup();
    useAppStore.getState().setStoryBeat('setup', 'sc1', 'sc1-e2');
    render(<PassToolSection passId="plot" />);
    const region = screen.getByRole('region', { name: /set-up . pay-off status/i });
    expect(region).toHaveTextContent(/Writer/);
    expect(region).toHaveTextContent(/Unpaid set-up/i);
    await user.click(within(region).getByRole('button', { name: /Scene 1/ }));
    expect(useAppStore.getState().selection).toEqual({ sceneId: 'sc1', elementId: 'sc1-e2' });
  });
});

describe('Structure pass tool section: high points', () => {
  it('is absent until at least one high point is placed', () => {
    const { container } = render(<PassToolSection passId="structure" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows placed points and names what is still missing', () => {
    useAppStore.getState().setHighPoint('sc4', 'midpoint');
    render(<PassToolSection passId="structure" />);
    const region = screen.getByRole('region', { name: /high points/i });
    expect(region).toHaveTextContent(/Mid-Point Plot Turn/);
    expect(region).toHaveTextContent(/Third Act Climax/); // still missing
  });
});

describe('Story & Theme pass tool section: theme and motifs', () => {
  it('is absent with no theme and no motifs', () => {
    const { container } = render(<PassToolSection passId="story-theme" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the theme statement and motif coverage with a jump', async () => {
    const user = userEvent.setup();
    useAppStore.getState().updateCompass({ themeThroughAction: 'Marisol stops counting.' });
    useAppStore.getState().addMotif('Herons');
    const motifId = useAppStore.getState().gamePlan.compass.motifs[0].id;
    useAppStore.getState().addMotifOccurrence(motifId, { sceneId: 'sc2', elementId: 'sc2-e5' });
    render(<PassToolSection passId="story-theme" />);
    const region = screen.getByRole('region', { name: /theme . motifs/i });
    expect(region).toHaveTextContent('Marisol stops counting.');
    expect(region).toHaveTextContent(/Herons/);
    expect(region).toHaveTextContent(/1/); // appears in 1 scene
    await user.click(within(region).getByRole('button', { name: /Herons/ }));
    expect(useAppStore.getState().selection).toEqual({ sceneId: 'sc2', elementId: 'sc2-e5' });
  });
});

describe('provenance: tool sections are writer-sourced, never AI', () => {
  it('carries a Writer chip, not an AI one', () => {
    useAppStore.getState().setHighPoint('sc4', 'midpoint');
    render(<PassToolSection passId="structure" />);
    const region = screen.getByRole('region', { name: /high points/i });
    expect(within(region).getByText('Writer')).toBeInTheDocument();
    expect(within(region).queryByText('AI')).not.toBeInTheDocument();
  });
});
