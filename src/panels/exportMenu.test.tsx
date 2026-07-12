import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportMenu } from './ExportMenu';
import { PrintView } from './PrintView';
import { useAppStore } from '../store/appStore';
import { serializeFountain } from '../io/fountain';
import { serializeFdx } from '../io/fdx';
import { paginate } from '../pagination/engine';

let capturedBlobs: Blob[];

// jsdom's Blob has no .text(); go through FileReader.
const blobText = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(blob);
  });

beforeEach(() => {
  capturedBlobs = [];
  useAppStore.getState().resetToSample();
  useAppStore.getState().setExportOpen(true);
  URL.createObjectURL = vi.fn((blob: Blob) => {
    capturedBlobs.push(blob);
    return 'blob:mock';
  });
  URL.revokeObjectURL = vi.fn();
});

describe('export menu', () => {
  it('offers Fountain, FDX, and Print/PDF, each with its fidelity caveat', () => {
    render(<ExportMenu />);
    expect(screen.getByRole('button', { name: /Fountain/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Final Draft/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Print \/ PDF/ })).toBeInTheDocument();
    expect(screen.getByText(/not yet validated inside the Final Draft application/i)).toBeInTheDocument();
    expect(screen.getByText(/system print dialog/i)).toBeInTheDocument();
  });

  it('downloads the working draft as Fountain', async () => {
    const user = userEvent.setup();
    render(<ExportMenu />);
    await user.click(screen.getByRole('button', { name: /Fountain/ }));
    expect(capturedBlobs).toHaveLength(1);
    const text = await blobText(capturedBlobs[0]);
    expect(text).toBe(serializeFountain(useAppStore.getState().screenplay));
  });

  it('downloads the working draft as FDX', async () => {
    const user = userEvent.setup();
    render(<ExportMenu />);
    await user.click(screen.getByRole('button', { name: /Final Draft/ }));
    expect(capturedBlobs).toHaveLength(1);
    const text = await blobText(capturedBlobs[0]);
    expect(text).toBe(serializeFdx(useAppStore.getState().screenplay));
  });

  it('Print/PDF opens the print view rendering the engine pages 1:1', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ExportMenu />
        <PrintView />
      </>,
    );
    await user.click(screen.getByRole('button', { name: /Print \/ PDF/ }));
    const result = paginate(useAppStore.getState().screenplay);
    expect(document.querySelectorAll('.print-page')).toHaveLength(result.pageCount);
    const firstText = result.pages[0].lines.find((l) => l.kind === 'text')!;
    expect(document.querySelector('.print-page')!.textContent).toContain(firstText.text);
  });
});
