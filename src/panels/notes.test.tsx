import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvidenceInspector } from './EvidenceInspector';
import { useAppStore } from '../store/appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
  useAppStore.getState().select({ sceneId: 'sc2', elementId: 'sc2-e5' });
});

describe('note authoring in the inspector', () => {
  it('adds a writer note with claim type and status to the selected line', async () => {
    const user = userEvent.setup();
    render(<EvidenceInspector />);
    await user.click(screen.getByRole('button', { name: /add note/i }));
    await user.type(screen.getByLabelText(/note text/i), 'Marta never answers the question.');
    await user.selectOptions(screen.getByLabelText(/claim type/i), 'textual_fact');
    await user.selectOptions(screen.getByLabelText(/^status/i), 'uncertain');
    await user.click(screen.getByRole('button', { name: /save note/i }));

    const added = useAppStore.getState().evidence.at(-1)!;
    expect(added).toMatchObject({
      source: 'writer',
      claimType: 'textual_fact',
      status: 'uncertain',
      sceneId: 'sc2',
      elementId: 'sc2-e5',
      summary: 'Marta never answers the question.',
    });
    // It shows up in the evidence list right away.
    expect(screen.getByText('Marta never answers the question.')).toBeInTheDocument();
  });

  it('a reader note requires a registered reader and records the reader name', async () => {
    useAppStore.getState().addReader('Ana P.', 'initial');
    const user = userEvent.setup();
    render(<EvidenceInspector />);
    await user.click(screen.getByRole('button', { name: /add note/i }));
    await user.selectOptions(screen.getByLabelText(/source/i), 'reader');
    await user.selectOptions(screen.getByLabelText(/^reader$/i), 'Ana P.');
    await user.type(screen.getByLabelText(/note text/i), 'I lost track of the money here.');
    await user.click(screen.getByRole('button', { name: /save note/i }));

    const added = useAppStore.getState().evidence.at(-1)!;
    expect(added.source).toBe('reader');
    expect(added.readerName).toBe('Ana P.');
  });

  it('a note from the interim reader is labeled interim_reader, not reader', async () => {
    useAppStore.getState().addReader('Diego M.', 'interim');
    const user = userEvent.setup();
    render(<EvidenceInspector />);
    await user.click(screen.getByRole('button', { name: /add note/i }));
    await user.selectOptions(screen.getByLabelText(/source/i), 'reader');
    await user.selectOptions(screen.getByLabelText(/^reader$/i), 'Diego M.');
    await user.type(screen.getByLabelText(/note text/i), 'Second act sags for me.');
    await user.click(screen.getByRole('button', { name: /save note/i }));

    expect(useAppStore.getState().evidence.at(-1)!.source).toBe('interim_reader');
  });

  it('cannot save an empty note', async () => {
    const user = userEvent.setup();
    render(<EvidenceInspector />);
    await user.click(screen.getByRole('button', { name: /add note/i }));
    expect(screen.getByRole('button', { name: /save note/i })).toBeDisabled();
  });
});

describe('readers manager', () => {
  it('registers readers and shows the Epps recommendation', async () => {
    const user = userEvent.setup();
    render(<EvidenceInspector />);
    expect(screen.getByText(/three readers are recommended/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/reader name/i), 'Ana P.');
    await user.click(screen.getByRole('button', { name: /add reader/i }));
    expect(useAppStore.getState().workflow.readers).toHaveLength(1);
    expect(screen.getByText('Ana P.')).toBeInTheDocument();
  });

  it('refuses a sixth initial reader with a visible message', async () => {
    for (let i = 0; i < 5; i++) useAppStore.getState().addReader(`Reader ${i + 1}`, 'initial');
    const user = userEvent.setup();
    render(<EvidenceInspector />);
    await user.type(screen.getByLabelText(/reader name/i), 'One Too Many');
    await user.click(screen.getByRole('button', { name: /add reader/i }));
    expect(useAppStore.getState().workflow.readers).toHaveLength(5);
    expect(screen.getByRole('alert')).toHaveTextContent(/five/i);
  });

  it('refuses a second interim reader with a visible message', async () => {
    useAppStore.getState().addReader('Diego M.', 'interim');
    const user = userEvent.setup();
    render(<EvidenceInspector />);
    await user.type(screen.getByLabelText(/reader name/i), 'Second Interim');
    await user.selectOptions(screen.getByLabelText(/reader role/i), 'interim');
    await user.click(screen.getByRole('button', { name: /add reader/i }));
    expect(useAppStore.getState().workflow.readers).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent(/one/i);
  });

  it('removes a reader', async () => {
    useAppStore.getState().addReader('Ana P.', 'initial');
    const user = userEvent.setup();
    render(<EvidenceInspector />);
    await user.click(screen.getByRole('button', { name: /remove ana p\./i }));
    expect(useAppStore.getState().workflow.readers).toHaveLength(0);
  });
});
