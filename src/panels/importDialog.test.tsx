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

async function paste(text: string) {
  const user = userEvent.setup();
  const box = screen.getByLabelText(/paste your script/i);
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
  it('shows title, scene count, page count, and the act-guess note after pasting', async () => {
    render(<ImportDialog />);
    await paste(FOUNTAIN);
    expect(within(screen.getByTestId('import-preview')).getByText('THE LONG NIGHT')).toBeInTheDocument();
    expect(screen.getByText(/Scenes: 3/)).toBeInTheDocument();
    expect(screen.getByText(/Pages \(approx\.\): 1/)).toBeInTheDocument();
    expect(screen.getByText(/acts are assigned by thirds/i)).toBeInTheDocument();
  });

  it('keeps the import button disabled until something parses', async () => {
    render(<ImportDialog />);
    const confirm = screen.getByRole('button', { name: /import and replace/i });
    expect(confirm).toBeDisabled();
    await paste(FOUNTAIN);
    expect(confirm).toBeEnabled();
  });

  it('states that PDF import means pasting the text', () => {
    render(<ImportDialog />);
    expect(screen.getByText(/pdf/i)).toBeInTheDocument();
  });

  it('imports: snapshots the old draft, replaces the working draft, closes', async () => {
    const oldId = useAppStore.getState().screenplay.id;
    render(<ImportDialog />);
    const user = await paste(FOUNTAIN);
    await user.click(screen.getByRole('button', { name: /import and replace/i }));
    await waitFor(() => expect(useAppStore.getState().screenplay.title).toBe('THE LONG NIGHT'));
    expect(useAppStore.getState().importOpen).toBe(false);
    expect(useAppStore.getState().workflow.annotatedReadComplete).toBe(false);
    const snaps = await db.snapshots.where('screenplayId').equals(oldId).toArray();
    expect(snaps).toHaveLength(1);
  });

  it('detects pasted FDX and shows the Final Draft caveat', async () => {
    render(<ImportDialog />);
    await paste(FDX);
    expect(screen.getByText(/Scenes: 1/)).toBeInTheDocument();
    expect(screen.getByText(/not yet validated inside the Final Draft application/i)).toBeInTheDocument();
  });
});
