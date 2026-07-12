import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportDialog } from './ImportDialog';
import { useAppStore } from '../store/appStore';
import { db } from '../store/db';

const FOUNTAIN = `Title: THE LONG NIGHT
Draft date: First draft

INT. KITCHEN - NIGHT

MARTA scrubs a pan that is already clean.

MARTA
Nobody comes home this late for good news.

EXT. STREET - NIGHT

A taxi idles under a dead streetlamp.

INT. HALLWAY - NIGHT

Keys tremble against the lock.
`;

const FDX = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<FinalDraft DocumentType="Script" Template="No" Version="5">
  <Content>
    <Paragraph Type="Scene Heading"><Text>INT. VAULT - DAY</Text></Paragraph>
    <Paragraph Type="Action"><Text>Dust on every ledger.</Text></Paragraph>
  </Content>
</FinalDraft>
`;

async function goToPasteStep(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /paste screenplay/i }));
  return screen.getByLabelText(/paste your script/i);
}

async function paste(text: string) {
  const user = userEvent.setup();
  const box = await goToPasteStep(user);
  await user.click(box);
  await user.paste(text);
  return user;
}

beforeEach(async () => {
  await db.snapshots.clear();
  useAppStore.getState().resetToSample();
  useAppStore.getState().setImportOpen(true);
});

describe('ImportDialog', () => {
  it('opens as an app-style menu: paste, Fountain file, Final Draft file, PDF note', () => {
    render(<ImportDialog />);
    expect(screen.getByRole('button', { name: /paste screenplay/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open fountain file/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open final draft file/i })).toBeInTheDocument();
    expect(screen.getByText(/pdf import is not available yet/i)).toBeInTheDocument();
    // No developer-form controls on the first screen.
    expect(screen.queryByLabelText(/paste your script/i)).not.toBeInTheDocument();
  });

  it('paste flow: preview shows title, scenes, pages, act-guess; import snapshots and replaces', async () => {
    const oldId = useAppStore.getState().screenplay.id;
    render(<ImportDialog />);
    const user = await paste(FOUNTAIN);
    const preview = screen.getByTestId('import-preview');
    expect(within(preview).getByText('THE LONG NIGHT')).toBeInTheDocument();
    expect(screen.getByText(/Scenes: 3/)).toBeInTheDocument();
    expect(screen.getByText(/Pages \(approx\.\): 1/)).toBeInTheDocument();
    expect(screen.getByText(/acts are assigned by thirds/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /import and replace/i }));
    await waitFor(() => expect(useAppStore.getState().screenplay.title).toBe('THE LONG NIGHT'));
    expect(useAppStore.getState().importOpen).toBe(false);
    const snaps = await db.snapshots.where('screenplayId').equals(oldId).toArray();
    expect(snaps).toHaveLength(1);
  });

  it('keeps the import button disabled until something parses', async () => {
    const user = userEvent.setup();
    render(<ImportDialog />);
    const box = await goToPasteStep(user);
    const confirm = screen.getByRole('button', { name: /import and replace/i });
    expect(confirm).toBeDisabled();
    await user.click(box);
    await user.paste(FOUNTAIN);
    expect(confirm).toBeEnabled();
  });

  it('detects pasted FDX and shows the Final Draft caveat', async () => {
    render(<ImportDialog />);
    await paste(FDX);
    expect(screen.getByText(/Scenes: 1/)).toBeInTheDocument();
    expect(screen.getByText(/not yet validated inside the Final Draft application/i)).toBeInTheDocument();
  });

  it('opening a Fountain file previews it and imports it', async () => {
    const user = userEvent.setup();
    render(<ImportDialog />);
    await user.upload(
      screen.getByTestId('import-file-fountain'),
      new File([FOUNTAIN], 'the-long-night.fountain', { type: 'text/plain' }),
    );
    await waitFor(() => expect(screen.getByTestId('import-preview')).toBeInTheDocument());
    expect(screen.getByText(/the-long-night\.fountain/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /import and replace/i }));
    await waitFor(() => expect(useAppStore.getState().screenplay.title).toBe('THE LONG NIGHT'));
  });

  it('Back returns to the menu without importing', async () => {
    render(<ImportDialog />);
    const user = await paste(FOUNTAIN);
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByRole('button', { name: /paste screenplay/i })).toBeInTheDocument();
    expect(useAppStore.getState().screenplay.title).not.toBe('THE LONG NIGHT');
  });
});
