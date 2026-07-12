import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkflowStrip, currentStep, type JourneyState } from './WorkflowStrip';
import { useAppStore } from '../store/appStore';

const base: JourneyState = {
  annotatedReadComplete: false,
  activePassId: null,
  passRuns: {},
  findings: [],
};

describe('currentStep derivation', () => {
  it('is Private read until the annotated read is complete', () => {
    expect(currentStep(base)).toBe(1);
  });

  it('is Choose pass once the read is done and no pass is active', () => {
    expect(currentStep({ ...base, annotatedReadComplete: true })).toBe(2);
  });

  it('is Diagnose for an active pass never run', () => {
    expect(currentStep({ ...base, annotatedReadComplete: true, activePassId: 'character' })).toBe(3);
  });

  it('is Diagnose while diagnosing', () => {
    expect(
      currentStep({
        ...base,
        annotatedReadComplete: true,
        activePassId: 'character',
        passRuns: { character: 'diagnosing' },
      }),
    ).toBe(3);
  });

  it('is Review proposals while reviewing with open findings', () => {
    expect(
      currentStep({
        ...base,
        annotatedReadComplete: true,
        activePassId: 'character',
        passRuns: { character: 'reviewing' },
        findings: [{ passId: 'character', resolution: 'open' }],
      }),
    ).toBe(4);
  });

  it('is Complete pass while reviewing with none open', () => {
    expect(
      currentStep({
        ...base,
        annotatedReadComplete: true,
        activePassId: 'character',
        passRuns: { character: 'reviewing' },
        findings: [{ passId: 'character', resolution: 'approved' }],
      }),
    ).toBe(5);
  });

  it('is Export once the pass is complete', () => {
    expect(
      currentStep({
        ...base,
        annotatedReadComplete: true,
        activePassId: 'character',
        passRuns: { character: 'complete' },
      }),
    ).toBe(6);
  });
});

describe('workflow strip', () => {
  beforeEach(() => {
    useAppStore.getState().resetToSample();
  });

  it('fresh app marks Private read as the current step and Import as done', () => {
    render(<WorkflowStrip />);
    const current = screen.getByText('Private read');
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText(/Import/).className).toContain('is-done');
  });
});
