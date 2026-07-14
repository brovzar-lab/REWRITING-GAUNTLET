import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportDialog } from './ImportDialog';
import { useAppStore } from '../store/appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

function fixturePdfFile(): File {
  const content =
    'BT /F1 12 Tf 72 720 Td (INT. KITCHEN - DAY) Tj 0 -20 Td (Marta cooks.) Tj ' +
    '0 -20 Td (MARTA) Tj 0 -14 Td (Nobody comes home this late.) Tj ET';
  const pdf =
    '%PDF-1.4\n' +
    `4 0 obj<</Length ${content.length}>>\nstream\n${content}\nendstream\nendobj\n%%EOF\n`;
  return new File([new TextEncoder().encode(pdf)], 'script.pdf', { type: 'application/pdf' });
}

describe('PDF import (best effort)', () => {
  it('offers a clearly best-effort PDF option', async () => {
    const user = userEvent.setup();
    useAppStore.getState().setImportOpen(true);
    render(<ImportDialog />);
    const opt = screen.getByRole('button', { name: /Open PDF \(best effort\)/i });
    expect(opt).toHaveTextContent(/formatting may be imperfect/i);
    void user; // menu-only assertion
  });

  it('extracts text, previews it, warns honestly, and imports on confirm', async () => {
    const user = userEvent.setup();
    useAppStore.getState().setImportOpen(true);
    render(<ImportDialog />);

    await user.upload(screen.getByTestId('import-file-pdf'), fixturePdfFile());

    // Preview appears with a best-effort warning, not a fidelity claim.
    await waitFor(() => expect(screen.getByTestId('import-preview')).toBeInTheDocument());
    expect(screen.getByText(/Best effort/i)).toBeInTheDocument();
    expect(screen.getByText(/not Final Draft fidelity/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Import and replace/i }));
    await waitFor(() =>
      expect(useAppStore.getState().screenplay.scenes[0].slug).toBe('INT. KITCHEN - DAY'),
    );
  });
});
