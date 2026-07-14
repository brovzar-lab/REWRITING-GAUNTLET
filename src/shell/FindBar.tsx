import { useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';

/** Find in script: searches the canonical model and jumps the selection to each
    match. Honest and simple — it navigates, it does not rewrite. */
export function FindBar() {
  const t = useT();
  const screenplay = useAppStore((s) => s.screenplay);
  const select = useAppStore((s) => s.select);
  const setFindOpen = useAppStore((s) => s.setFindOpen);
  const [query, setQuery] = useState('');
  const [at, setAt] = useState(0);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as { sceneId: string; elementId: string }[];
    const out: { sceneId: string; elementId: string }[] = [];
    for (const scene of screenplay.scenes) {
      for (const el of scene.elements) {
        if (el.text.toLowerCase().includes(q)) out.push({ sceneId: scene.id, elementId: el.id });
      }
    }
    return out;
  }, [query, screenplay]);

  // Select the match at `index` and park the cursor on the one after it.
  const jump = (index: number) => {
    if (matches.length === 0) return;
    const i = ((index % matches.length) + matches.length) % matches.length;
    select(matches[i]);
    setAt((i + 1) % matches.length);
  };

  return (
    <div className="find-bar" role="search">
      <input
        type="text"
        className="find-input"
        aria-label={t('toolbar.find')}
        placeholder={t('find.placeholder')}
        value={query}
        autoFocus
        onChange={(e) => {
          setQuery(e.target.value);
          setAt(0);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            jump(e.shiftKey ? at - 2 : at);
          }
          if (e.key === 'Escape') setFindOpen(false);
        }}
      />
      <span className="find-count">
        {query.trim() === ''
          ? ''
          : matches.length === 0
            ? t('find.none')
            : t('find.count').replace('{n}', String(matches.length))}
      </span>
      <button type="button" className="tool-button" onClick={() => jump(at)} disabled={matches.length === 0}>
        ↓
      </button>
      <button type="button" className="tool-button" aria-label={t('find.close')} onClick={() => setFindOpen(false)}>
        ×
      </button>
    </div>
  );
}
