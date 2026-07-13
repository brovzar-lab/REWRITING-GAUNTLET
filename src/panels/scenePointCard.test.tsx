import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvidenceInspector } from './EvidenceInspector';
import { PassWorkspace } from './PassWorkspace';
import { useAppStore } from '../store/appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('the Scene Point card in the Evidence tab', () => {
  it('appears for the selected scene with the book phrasing as placeholder', async () => {
    const user = userEvent.setup();
    useAppStore.getState().select({ sceneId: 'sc2', elementId: 'sc2-e5' });
    render(<EvidenceInspector />);
    const point = screen.getByLabelText(/scene point/i);
    expect(point).toHaveAttribute('placeholder', 'The point of this scene is…');
    await user.type(point, 'The wake reopens the ledger.');
    expect(useAppStore.getState().scenePoints.sc2.point).toBe('The wake reopens the ledger.');
  });

  it('records the earns-its-place verdict with words, toggling off on second click', async () => {
    const user = userEvent.setup();
    useAppStore.getState().select({ sceneId: 'sc2', elementId: 'sc2-e5' });
    render(<EvidenceInspector />);
    const cut = screen.getByRole('button', { name: /cut candidate/i });
    expect(cut).toHaveTextContent('Cut candidate');
    await user.click(cut);
    expect(useAppStore.getState().scenePoints.sc2.verdict).toBe('cut_candidate');
    expect(cut).toHaveAttribute('aria-pressed', 'true');
    await user.click(cut);
    expect(useAppStore.getState().scenePoints.sc2.verdict).toBeNull();
    // The other two verdicts exist as words too.
    expect(screen.getByRole('button', { name: /earns it/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unsure/i })).toBeInTheDocument();
  });

  it('labels the scene-dynamics sub-fields as a Studio extension', () => {
    useAppStore.getState().select({ sceneId: 'sc2', elementId: 'sc2-e5' });
    render(<EvidenceInspector />);
    const chip = screen.getByText('EXT');
    expect(chip).toHaveAttribute('title', "Studio extension — not from Epps's book");
    expect(screen.getByLabelText(/conflict/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^turn/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/value change/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/audience learns/i)).toBeInTheDocument();
  });

  it('is absent without a selection — no dead UI', () => {
    render(<EvidenceInspector />);
    expect(screen.queryByLabelText(/scene point/i)).not.toBeInTheDocument();
  });
});

describe('writer-marked cut candidates in the Scene pass workspace', () => {
  it('lists cut candidates as writer-sourced items that jump to the scene', async () => {
    const user = userEvent.setup();
    useAppStore.getState().updateScenePoint('sc2', { point: 'A detour.', verdict: 'cut_candidate' });
    useAppStore.getState().setActivePass('scene');
    render(<PassWorkspace />);
    const region = screen.getByRole('region', { name: /writer-marked cut candidates/i });
    expect(region).toHaveTextContent('Writer');
    await user.click(screen.getByRole('button', { name: /scene 2/i }));
    expect(useAppStore.getState().selection?.sceneId).toBe('sc2');
  });

  it('renders nothing when no scene is marked — no dead UI', () => {
    useAppStore.getState().setActivePass('scene');
    render(<PassWorkspace />);
    expect(screen.queryByRole('region', { name: /writer-marked cut candidates/i })).not.toBeInTheDocument();
  });
});
