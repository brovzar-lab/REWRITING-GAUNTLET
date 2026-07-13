import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PassWorkspace } from './PassWorkspace';
import { PassTray } from './PassTray';
import { useAppStore, elementText } from '../store/appStore';
import { parseFountain } from '../io/fountain';

/** A draft with two deliberate polish problems (internal double spaces) so the
    local analyzer produces two real proposals to approve/reject. */
const DRAFT = `Title: PROOF DRAFT

INT. KITCHEN - NIGHT

Marta cooks.  The radio hums.

MARTA
Dinner is cold.

EXT. STREET - NIGHT

A taxi waits  outside.
`;

function primeDraft() {
  useAppStore.getState().replaceDocument(parseFountain(DRAFT));
}

async function diagnosePolish(user: ReturnType<typeof userEvent.setup>) {
  primeDraft();
  useAppStore.getState().completeAnnotatedRead();
  useAppStore.getState().setActivePass('polish');
  render(<PassWorkspace />);
  await user.click(screen.getByRole('button', { name: /^diagnose$/i }));
  await waitFor(() => expect(useAppStore.getState().workflow.findings.length).toBe(2));
}

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('the guided pass workspace', () => {
  it('clicking a pass chip opens the pass workspace tab', async () => {
    const user = userEvent.setup();
    render(<PassTray />);
    expect(useAppStore.getState().inspectorTab).toBe('evidence');
    await user.click(screen.getByRole('button', { name: /^8 Scene/i }));
    expect(useAppStore.getState().activePassId).toBe('scene');
    expect(useAppStore.getState().inspectorTab).toBe('pass');
  });

  it('shows objective and what the pass examines, even before the read is done', () => {
    useAppStore.getState().setActivePass('character');
    render(<PassWorkspace />);
    expect(screen.getByText(/Pass 2 of 11/)).toBeInTheDocument();
    expect(screen.getByText(/want, need, arc/i)).toBeInTheDocument(); // objective
    expect(screen.getByText(/what this pass examines/i)).toBeInTheDocument();
    expect(screen.getByText(/Opposition characters/i)).toBeInTheDocument();
    // Diagnosis stays locked, but the guidance is visible.
    expect(screen.getByText(/locked until your private annotated read/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^diagnose$/i })).not.toBeInTheDocument();
  });

  it('asks for a pass when none is active', () => {
    useAppStore.getState().completeAnnotatedRead();
    render(<PassWorkspace />);
    expect(screen.getByText(/choose a rewrite pass/i)).toBeInTheDocument();
  });

  it('diagnose fills the approve/reject queue and tracks progress', async () => {
    const user = userEvent.setup();
    await diagnosePolish(user);
    expect(screen.getAllByText(/AI hypothesis/i).length).toBe(2);
    expect(screen.getByText(/0 of 2 proposals resolved/i)).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /approve/i })[0]);
    expect(screen.getByText(/1 of 2 proposals resolved/i)).toBeInTheDocument();
    const first = useAppStore.getState().workflow.findings[0];
    expect(elementText(useAppStore.getState().screenplay, first.proposal!.sceneId, first.proposal!.elementId)).toBe(
      first.proposal!.newText,
    );
  });

  it('reject leaves the element alone and archives the finding visibly', async () => {
    const user = userEvent.setup();
    await diagnosePolish(user);
    await user.click(screen.getAllByRole('button', { name: /reject/i })[1]);
    const second = useAppStore.getState().workflow.findings[1];
    expect(elementText(useAppStore.getState().screenplay, second.proposal!.sceneId, second.proposal!.elementId)).toBe(
      second.proposal!.oldText,
    );
    expect(screen.getByText(/^rejected$/i)).toBeInTheDocument();
  });

  it('a diagnosed pass with nothing to cite says what was checked', async () => {
    primeDraft();
    useAppStore.getState().completeAnnotatedRead();
    useAppStore.getState().setActivePass('plot'); // the 2-scene draft has no connections, so plot finds nothing
    const user = userEvent.setup();
    render(<PassWorkspace />);
    expect(screen.getByText(/not diagnosed yet/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^diagnose$/i }));
    await waitFor(() =>
      expect(screen.getByText(/checked 2 scenes for set-ups that pay off out of order/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/no findings for this pass/i)).not.toBeInTheDocument();
  });

  it('recommends the next pass and activates it on click', async () => {
    primeDraft();
    useAppStore.getState().completeAnnotatedRead();
    useAppStore.getState().setActivePass('character');
    const user = userEvent.setup();
    render(<PassWorkspace />);
    const next = screen.getByRole('button', { name: /next.*story and theme/i });
    await user.click(next);
    expect(useAppStore.getState().activePassId).toBe('story-theme');
  });

  it('clicking a citation selects that exact line', async () => {
    const user = userEvent.setup();
    await diagnosePolish(user);
    const finding = useAppStore.getState().workflow.findings[0];
    await user.click(screen.getAllByRole('button', { name: /INT\. KITCHEN - NIGHT/ })[0]);
    expect(useAppStore.getState().selection).toEqual(finding.citations[0]);
  });

  it('shows old and new text for each proposal', async () => {
    const user = userEvent.setup();
    await diagnosePolish(user);
    const olds = [...document.querySelectorAll('.ai-proposal-old')].map((n) => n.textContent);
    const news = [...document.querySelectorAll('.ai-proposal-new')].map((n) => n.textContent);
    expect(olds).toContain('Marta cooks.  The radio hums.');
    expect(news).toContain('Marta cooks. The radio hums.');
  });
});
