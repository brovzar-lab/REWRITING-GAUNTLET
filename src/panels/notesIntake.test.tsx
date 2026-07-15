import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotesIntake } from './NotesIntake';
import { useAppStore } from '../store/appStore';

describe('NotesIntake', () => {
  beforeEach(() => {
    useAppStore.getState().resetToSample();
  });

  it('renders five reader slots plus a separate You lane (never a sixth slot)', () => {
    render(<NotesIntake />);
    expect(screen.getAllByRole('button', { name: /\+ Reader/ })).toHaveLength(5);
    expect(screen.getByText('Your private read')).toBeInTheDocument();
  });

  it('shows the consent nudge and the tag-later guidance', () => {
    render(<NotesIntake />);
    expect(screen.getByText(/Ask permission before recording/)).toBeInTheDocument();
    expect(screen.getByText(/Tag notes after the session/)).toBeInTheDocument();
  });

  it('adds a reader through the inline slot input', async () => {
    render(<NotesIntake />);
    await userEvent.click(screen.getAllByRole('button', { name: /\+ Reader/ })[0]);
    await userEvent.type(screen.getByPlaceholderText(/Reader name/), 'Rodrigo{Enter}');
    expect(useAppStore.getState().workflow.readers[0].name).toBe('Rodrigo');
  });

  it('adding a note defaults to symptom; retag buttons quarantine remedies', async () => {
    useAppStore.getState().addReader('Rodrigo', 'initial', 'director');
    render(<NotesIntake />);
    await userEvent.type(screen.getByPlaceholderText(/Type a note/), 'Act two sags{Enter}');
    const notes = useAppStore.getState().workflow.readers[0].notes ?? [];
    expect(notes[0].kind).toBe('symptom');
    await userEvent.click(screen.getByRole('button', { name: /Their remedy/ }));
    expect((useAppStore.getState().workflow.readers[0].notes ?? [])[0].kind).toBe('remedy');
  });

  it('what-worked notes land in the protected pane', async () => {
    useAppStore.getState().addReader('Ana', 'initial');
    const reader = useAppStore.getState().workflow.readers[0];
    useAppStore.getState().addReaderNote(reader.id, {
      id: 'n1',
      quote: 'The kitchen scene sings',
      kind: 'whatWorked',
      createdAt: 1,
    });
    render(<NotesIntake />);
    const pane = screen.getByRole('complementary', { name: /What worked/ });
    expect(pane).toHaveTextContent('The kitchen scene sings');
    expect(pane).toHaveTextContent('Ana');
  });
});
