import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PolishReadBar } from './PolishReadBar';
import { PassWorkspace } from './PassWorkspace';
import { ExportMenu } from './ExportMenu';
import { useAppStore } from '../store/appStore';
import { paginate } from '../pagination/engine';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('the Polish Read bar', () => {
  it('is hidden until started — no dead UI', () => {
    const { container } = render(<PolishReadBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it('walks pages and only finishes at the last page', async () => {
    const user = userEvent.setup();
    const pageCount = paginate(useAppStore.getState().screenplay).pageCount;
    useAppStore.getState().startPolishRead();
    render(<PolishReadBar />);
    expect(screen.getByText(new RegExp(`Page 1 of ${pageCount}`))).toBeInTheDocument();
    const finish = screen.getByRole('button', { name: /Finish Polish Read/ });
    expect(finish).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(useAppStore.getState().polishReadPage).toBe(2);

    act(() => useAppStore.getState().setPolishReadPage(pageCount));
    expect(screen.getByRole('button', { name: /Finish Polish Read/ })).toBeEnabled();
  });

  it('shows the book polish objectives as a checklist', () => {
    useAppStore.getState().startPolishRead();
    render(<PolishReadBar />);
    expect(screen.getByText(/Dialogue reads clean/i)).toBeInTheDocument();
    expect(screen.getByText(/No holdovers or orphans/i)).toBeInTheDocument();
  });
});

describe('the Polish pass workspace offers the Polish Read', () => {
  it('shows Start Polish Read on the Polish pass', () => {
    useAppStore.getState().setActivePass('polish');
    render(<PassWorkspace />);
    expect(screen.getByRole('button', { name: 'Start Polish Read' })).toBeInTheDocument();
  });
});

describe('export readiness (advisory)', () => {
  it('reports pages-read, priority concerns, and unpaid set-ups without blocking export', () => {
    useAppStore.getState().setStoryBeat('setup', 'sc1', 'sc1-e2'); // one unpaid set-up
    useAppStore.getState().setExportOpen(true);
    render(<ExportMenu />);
    const region = screen.getByRole('region', { name: /export readiness/i });
    expect(region).toHaveTextContent(/Polish Read not finished/i);
    expect(region).toHaveTextContent(/1 unpaid set-up/i);
    // Export options remain available.
    expect(screen.getByRole('button', { name: /Fountain/ })).toBeEnabled();
  });

  it('reflects a finished Polish Read', () => {
    useAppStore.getState().startPolishRead();
    useAppStore.getState().completePolishRead();
    useAppStore.getState().setExportOpen(true);
    render(<ExportMenu />);
    expect(
      within(screen.getByRole('region', { name: /export readiness/i })).getByText(/All pages read/i),
    ).toBeInTheDocument();
  });
});
