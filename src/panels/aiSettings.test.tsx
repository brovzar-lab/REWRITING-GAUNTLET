import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiSettings } from './AiSettings';
import { useAppStore } from '../store/appStore';
import { keyStore, resolveProvider } from '../ai';

beforeEach(() => {
  keyStore.set('');
  useAppStore.getState().resetToSample();
  useAppStore.getState().setAiSettingsOpen(true);
});

describe('AI settings and consent', () => {
  it('discloses exactly what the cloud option sends before any consent', () => {
    render(<AiSettings />);
    expect(screen.getByText(/full text of your working draft is sent/i)).toBeInTheDocument();
    expect(screen.getByText(/stored only on this machine/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /I understand/i })).not.toBeChecked();
  });

  it('without consent the provider stays local even with a key', () => {
    keyStore.set('sk-something');
    expect(resolveProvider(useAppStore.getState().workflow.cloudAiConsent).id).toBe('local');
  });

  it('consent plus a key switches the provider to cloud; unticking reverts', async () => {
    const user = userEvent.setup();
    render(<AiSettings />);
    await user.type(screen.getByLabelText(/api key/i), 'sk-my-own-key');
    await user.click(screen.getByRole('checkbox', { name: /I understand/i }));
    expect(useAppStore.getState().workflow.cloudAiConsent).toBe(true);
    expect(keyStore.get()).toBe('sk-my-own-key');
    expect(resolveProvider(true).id).toBe('cloud');
    await user.click(screen.getByRole('checkbox', { name: /I understand/i }));
    expect(useAppStore.getState().workflow.cloudAiConsent).toBe(false);
    expect(resolveProvider(false).id).toBe('local');
  });

  it('shows which provider is currently active', async () => {
    render(<AiSettings />);
    expect(screen.getByText(/active: local analyzer/i)).toBeInTheDocument();
  });
});
