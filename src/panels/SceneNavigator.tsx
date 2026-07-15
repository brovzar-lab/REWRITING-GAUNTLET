import { useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { paginate } from '../pagination/engine';
import { computeRevisedElements } from '../editor/revision';
import { useT } from '../i18n/strings';
import type { StringKey } from '../i18n/strings';
import type { Scene } from '../model/screenplay';
import { isStructuralRole } from '../model/markers';

const ACT_KEYS = { 1: 'nav.act1', 2: 'nav.act2', 3: 'nav.act3' } as const;

export function SceneNavigator() {
  const screenplay = useAppStore((s) => s.screenplay);
  const selection = useAppStore((s) => s.selection);
  const select = useAppStore((s) => s.select);
  const evidence = useAppStore((s) => s.evidence);
  const highPoints = useAppStore((s) => s.highPoints);
  const t = useT();

  const structuralByScene = new Map(
    highPoints.filter((m) => isStructuralRole(m.role)).map((m) => [m.sceneId, m.role]),
  );

  const noteCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of evidence) counts.set(record.sceneId, (counts.get(record.sceneId) ?? 0) + 1);
    return counts;
  }, [evidence]);

  const revisionBaseline = useAppStore((s) => s.revisionBaseline);
  const pagination = useMemo(() => paginate(screenplay), [screenplay]);
  const revisedElements = useMemo(
    () => (revisionBaseline ? computeRevisedElements(screenplay, revisionBaseline) : new Set<string>()),
    [screenplay, revisionBaseline],
  );

  const [query, setQuery] = useState('');

  const acts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byAct = new Map<1 | 2 | 3, Scene[]>([[1, []], [2, []], [3, []]]);
    for (const scene of screenplay.scenes) {
      if (q && !scene.slug.toLowerCase().includes(q)) continue;
      byAct.get(scene.act)?.push(scene);
    }
    return [...byAct.entries()].filter(([, scenes]) => scenes.length > 0);
  }, [screenplay, query]);

  return (
    <nav className="scene-navigator" aria-label={t('nav.title')}>
      <h2 className="panel-title">{t('nav.title')}</h2>
      <input
        type="search"
        className="scene-search"
        aria-label={t('nav.search')}
        placeholder={t('nav.search')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {acts.map(([act, scenes]) => (
        <section key={act} role="group" aria-labelledby={`act-header-${act}`}>
          <h3 id={`act-header-${act}`} className="act-header">
            {t(ACT_KEYS[act])}
          </h3>
          <ul className="scene-list">
            {scenes.map((scene) => {
              const heading = scene.elements[0];
              const page = pagination.pageOfElement.get(heading.id) ?? 1;
              const selected = selection?.sceneId === scene.id;
              const revised = scene.elements.some((e) => revisedElements.has(e.id));
              return (
                <li key={scene.id}>
                  <button
                    type="button"
                    className={`scene-row${selected ? ' is-selected' : ''}`}
                    aria-current={selected ? 'true' : undefined}
                    onClick={() => select({ sceneId: scene.id, elementId: heading.id })}
                  >
                    <span className="scene-number">{scene.number}</span>
                    <span className="scene-slug">
                      {scene.slug}
                      {revised && (
                        <span className="scene-revised" role="img" aria-label={t('rev.revised')}>
                          {' '}*
                        </span>
                      )}
                    </span>
                    {structuralByScene.has(scene.id) && (
                      <span className="scene-highpoint">
                        {t(`hp.short.${structuralByScene.get(scene.id)!}` as StringKey)}
                      </span>
                    )}
                    {(noteCounts.get(scene.id) ?? 0) > 0 && (
                      <span className="scene-notes" aria-label={`${t('nav.notes')}: ${noteCounts.get(scene.id)}`}>
                        {noteCounts.get(scene.id)}
                      </span>
                    )}
                    <span className="scene-page">
                      {t('nav.page')} {page}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
