import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { paginate } from '../pagination/engine';
import { useT } from '../i18n/strings';
import type { Scene } from '../model/screenplay';

const ACT_KEYS = { 1: 'nav.act1', 2: 'nav.act2', 3: 'nav.act3' } as const;

export function SceneNavigator() {
  const screenplay = useAppStore((s) => s.screenplay);
  const selection = useAppStore((s) => s.selection);
  const select = useAppStore((s) => s.select);
  const t = useT();

  const pagination = useMemo(() => paginate(screenplay), [screenplay]);

  const acts = useMemo(() => {
    const byAct = new Map<1 | 2 | 3, Scene[]>([[1, []], [2, []], [3, []]]);
    for (const scene of screenplay.scenes) byAct.get(scene.act)?.push(scene);
    return [...byAct.entries()].filter(([, scenes]) => scenes.length > 0);
  }, [screenplay]);

  return (
    <nav className="scene-navigator" aria-label={t('nav.title')}>
      <h2 className="panel-title">{t('nav.title')}</h2>
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
              return (
                <li key={scene.id}>
                  <button
                    type="button"
                    className={`scene-row${selected ? ' is-selected' : ''}`}
                    aria-current={selected ? 'true' : undefined}
                    onClick={() => select({ sceneId: scene.id, elementId: heading.id })}
                  >
                    <span className="scene-number">{scene.number}</span>
                    <span className="scene-slug">{scene.slug}</span>
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
