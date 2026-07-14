import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Board } from '../board/Board';
import { StructureView } from './StructureView';
import { SceneNavigator } from './SceneNavigator';
import { useAppStore } from '../store/appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
  useAppStore.getState().setFullBoard(true);
});

const frame = (sceneId: string) =>
  document.querySelector(`[data-card-frame="${sceneId}"]`) as HTMLElement;

describe('placing high points on the card (full board)', () => {
  it('assigns a structural role from the card and shows it as a word on the card', async () => {
    const user = userEvent.setup();
    render(<Board />);
    const select = within(frame('sc4')).getByLabelText(/high point/i);
    await user.selectOptions(select, 'midpoint');
    expect(useAppStore.getState().highPoints).toContainEqual({ role: 'midpoint', sceneId: 'sc4' });
    expect(frame('sc4')).toHaveTextContent(/Mid-Point/i);
  });

  it('does not render the high-point control in the compact side board — no clutter', () => {
    useAppStore.getState().setFullBoard(false);
    render(<Board />);
    expect(within(frame('sc4')).queryByLabelText(/high point/i)).not.toBeInTheDocument();
  });
});

describe('the Four High Points checklist and momentum strip in StructureView', () => {
  it('lists the four points, showing which are placed, and jumps to the scene', async () => {
    const user = userEvent.setup();
    useAppStore.getState().setHighPoint('sc4', 'midpoint');
    render(<StructureView />);
    const list = screen.getByRole('list', { name: /four high points/i });
    expect(within(list).getByText(/Mid-Point Plot Turn/i)).toBeInTheDocument();
    await user.click(within(list).getByRole('button', { name: /Mid-Point Plot Turn/i }));
    expect(useAppStore.getState().selection?.sceneId).toBe('sc4');
  });

  it('draws the momentum strip from emotional highs and lows, with words', () => {
    useAppStore.getState().setHighPoint('sc2', 'emotional_high');
    useAppStore.getState().setHighPoint('sc5', 'emotional_low');
    render(<StructureView />);
    const strip = screen.getByRole('group', { name: /momentum/i });
    expect(within(strip).getAllByText(/high|low/i).length).toBeGreaterThanOrEqual(2);
  });

  it('teaches with an empty state before any high point is placed', () => {
    render(<StructureView />);
    expect(screen.getByText(/place your four high points/i)).toBeInTheDocument();
  });
});

describe('the navigator flags scenes carrying a structural high point', () => {
  it('shows the role abbreviation next to the scene', () => {
    useAppStore.getState().setHighPoint('sc4', 'midpoint');
    render(<SceneNavigator />);
    const row = screen.getByRole('button', { name: /INT\. AGUAS DEL VALLE/i });
    expect(row).toHaveTextContent(/MID/i);
  });
});
