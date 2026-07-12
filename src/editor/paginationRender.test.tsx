import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ScreenplayEditor } from './ScreenplayEditor';
import { useAppStore } from '../store/appStore';
import { paginate } from '../pagination/engine';
import { sampleScreenplay } from '../model/sample/gauntlet-sample';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('true page rendering', () => {
  it('renders one page header per page after the first', () => {
    render(<ScreenplayEditor />);
    const r = paginate(sampleScreenplay);
    const headers = document.querySelectorAll('.sp-page-header');
    expect(headers.length).toBe(r.pageCount - 1);
    expect(headers[0].textContent).toContain('2.');
  });

  it('renders (MORE) and NAME (CONT\'D) exactly where the engine splits dialogue', () => {
    render(<ScreenplayEditor />);
    const r = paginate(sampleScreenplay);
    const expectedMore = r.pages.filter((p) => p.lines.at(-1)?.kind === 'more').length;
    const expectedContd = r.pages.filter((p) => p.lines.some((l) => l.kind === 'contd')).length;
    expect(document.querySelectorAll('.sp-more').length).toBe(expectedMore);
    const contds = [...document.querySelectorAll('.sp-contd')];
    expect(contds.length).toBe(expectedContd);
    for (const c of contds) expect(c.textContent).toMatch(/\(CONT'D\)$/);
  });

  it('labels scene headings with their scene number', () => {
    render(<ScreenplayEditor />);
    const heading = document.querySelector('[data-element-id="sc6-e1"]');
    expect(heading?.getAttribute('data-scene-number')).toBe('6');
  });

  it('the engine and DOM agree on page count as the text changes', () => {
    render(<ScreenplayEditor />);
    useAppStore.getState().updateElementText('sc1', 'sc1-e2', 'Short.');
    const r = paginate(useAppStore.getState().screenplay);
    expect(document.querySelectorAll('.sp-page-header').length).toBe(r.pageCount - 1);
  });
});
