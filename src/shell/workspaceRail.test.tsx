import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceRail } from './WorkspaceRail';
import { useAppStore } from '../store/appStore';

describe('WorkspaceRail groups', () => {
  beforeEach(() => {
    useAppStore.getState().resetToSample();
  });

  it('shows JOURNEY and STUDIO group labels with a divider', () => {
    render(<WorkspaceRail />);
    expect(screen.getByText('Journey')).toBeInTheDocument();
    expect(screen.getByText('Studio')).toBeInTheDocument();
    expect(document.querySelector('.rail-divider')).not.toBeNull();
  });

  it('renames the journey item to Read and it enters read mode', async () => {
    render(<WorkspaceRail />);
    await userEvent.click(screen.getByRole('button', { name: 'Read' }));
    expect(useAppStore.getState().readModeActive).toBe(true);
  });

  it('journey group starts at Read; Project is a Studio (management) item', () => {
    render(<WorkspaceRail />);
    const labels = Array.from(document.querySelectorAll('.rail-item .rail-label')).map((n) => n.textContent);
    expect(labels.slice(0, 5)).toEqual(['Read', 'Evidence', 'Game plan', 'Rewrite passes', 'Polish']);
    expect(labels.slice(5)).toEqual(['Project', 'Scenes', 'Board', 'History', 'Layouts']);
  });
});
