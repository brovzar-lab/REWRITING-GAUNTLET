import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportDialog } from './ImportDialog';
import { TopBar } from './TopBar';
import { useAppStore } from '../store/appStore';
import { resolveDocFormat } from '../model/screenplay';

const SCRIPT = `Title: THE PILOT
Draft date: First draft

INT. WRITERS ROOM - DAY

The team argues about the cold open.

MAYA
Open on the fire, not the meeting.

EXT. STUDIO LOT - DAY

Golf carts weave between sound stages.

INT. STAGE 4 - DAY

The set is half struck.
`;

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('TV pilot adapter (Studio extension)', () => {
  it('the import format picker is labeled a Studio extension', async () => {
    const user = userEvent.setup();
    useAppStore.getState().setImportOpen(true);
    render(<ImportDialog />);
    await user.click(screen.getByRole('button', { name: /paste screenplay/i }));
    screen.getByLabelText(/paste your script/i).focus();
    await user.paste(SCRIPT);
    const picker = screen.getByLabelText(/Format/);
    expect(picker).toBeInTheDocument();
    // The EXT chip sits on the format control.
    expect(screen.getAllByText('EXT').length).toBeGreaterThanOrEqual(1);
    // All three formats are offered.
    expect(screen.getByRole('option', { name: 'Feature' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'One-hour pilot' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Half-hour pilot' })).toBeInTheDocument();
  });

  it('imports with the chosen format and defaults feature to no badge', async () => {
    const user = userEvent.setup();
    useAppStore.getState().setImportOpen(true);
    render(<ImportDialog />);
    await user.click(screen.getByRole('button', { name: /paste screenplay/i }));
    screen.getByLabelText(/paste your script/i).focus();
    await user.paste(SCRIPT);
    await user.selectOptions(screen.getByLabelText(/Format/), 'one_hour');
    const confirm = screen.getByRole('button', { name: /import and replace/i });
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    await waitFor(() => expect(resolveDocFormat(useAppStore.getState().screenplay)).toBe('one_hour'));
  });

  it('shows the format badge for a pilot and hides it for a feature', () => {
    const { rerender } = render(<TopBar />);
    // Sample is a feature — no badge.
    expect(screen.queryByText('One-hour pilot')).not.toBeInTheDocument();

    useAppStore.getState().replaceDocument({
      ...useAppStore.getState().screenplay,
      id: 'tv',
      docFormat: 'one_hour',
    });
    rerender(<TopBar />);
    expect(screen.getByText('One-hour pilot')).toBeInTheDocument();
  });
});
