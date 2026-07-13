import { useEffect, useRef, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Scene } from '../model/screenplay';
import { emptyScenePoint, hasStatedPoint, type ScenePointVerdict } from '../model/scenepoint';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';
import type { StringKey } from '../i18n/strings';

const FUNCTION_KEY = {
  plot: 'function.plot',
  setup: 'function.setup',
  opposition: 'function.opposition',
  resolution: 'function.resolution',
  relationship: 'function.relationship',
} as const;

/** Verdict vocabulary: icon + word, never color alone. */
const VERDICTS: { id: ScenePointVerdict; icon: string; key: StringKey }[] = [
  { id: 'earns', icon: '✓', key: 'sp.earns' },
  { id: 'unsure', icon: '?', key: 'sp.unsure' },
  { id: 'cut_candidate', icon: '✕', key: 'sp.cut' },
];

/** Compact in-place Scene Point editor: the writer acts on the card itself.
    Enter saves, Escape cancels, leaving the popover saves the draft. */
function ScenePointPopover({
  scene,
  onClose,
}: {
  scene: Scene;
  onClose: (reason: 'enter' | 'escape' | 'blur') => void;
}) {
  const t = useT();
  const scenePoint = useAppStore((s) => s.scenePoints[scene.id]) ?? emptyScenePoint(scene.id);
  const updateScenePoint = useAppStore((s) => s.updateScenePoint);
  const [draft, setDraft] = useState(scenePoint.point);
  const closing = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // The board scrolls; make sure the whole editor is visible when it opens.
  useEffect(() => {
    rootRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, []);

  const save = (reason: 'enter' | 'blur') => {
    if (closing.current) return;
    closing.current = true;
    updateScenePoint(scene.id, { point: draft });
    onClose(reason);
  };

  const cancel = () => {
    if (closing.current) return;
    closing.current = true;
    onClose('escape');
  };

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label={t('sp.title')}
      className="sp-card-pop"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          cancel();
        }
      }}
      onBlur={(e) => {
        // Focus left the popover entirely: commit the draft, keep focus where the writer sent it.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) save('blur');
      }}
    >
      <label htmlFor={`sp-pop-${scene.id}`} className="gp-label">
        {t('sp.title')}
      </label>
      <textarea
        id={`sp-pop-${scene.id}`}
        rows={3}
        autoFocus
        value={draft}
        placeholder={t('sp.placeholder')}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            save('enter');
          }
        }}
      />
      <span className="gp-label">{t('sp.verdict')}</span>
      <span className="sp-verdicts">
        {VERDICTS.map(({ id, icon, key }) => (
          <button
            key={id}
            type="button"
            className="seg-button"
            aria-pressed={scenePoint.verdict === id}
            onClick={() =>
              updateScenePoint(scene.id, { verdict: scenePoint.verdict === id ? null : id })
            }
          >
            <span aria-hidden="true">{icon}</span> {t(key)}
          </button>
        ))}
      </span>
    </div>
  );
}

export function StoryCard({ scene }: { scene: Scene }) {
  const selection = useAppStore((s) => s.selection);
  const select = useAppStore((s) => s.select);
  const scenePoint = useAppStore((s) => s.scenePoints[scene.id]);
  const t = useT();
  const [editing, setEditing] = useState(false);
  const chipRef = useRef<HTMLButtonElement>(null);

  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({ id: scene.id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: scene.id });

  const selected = selection?.sceneId === scene.id;
  const pointStated = hasStatedPoint(scenePoint);
  const verdict = scenePoint?.verdict ?? null;
  const verdictEntry = VERDICTS.find((v) => v.id === verdict);

  return (
    <div
      ref={setDropRef}
      className={[
        'ds-story-card',
        `fn-${scene.storyFunction}`,
        selected ? 'is-selected' : '',
        isDragging ? 'is-dragging' : '',
        isOver ? 'is-drop-target' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ transform: CSS.Translate.toString(transform) }}
      data-card-frame={scene.id}
    >
      <button
        type="button"
        ref={setDragRef}
        className="card-main"
        data-scene-card={scene.id}
        onClick={() => select({ sceneId: scene.id, elementId: scene.elements[0].id })}
        {...attributes}
        {...listeners}
        aria-pressed={selected}
        aria-label={`${t('card.scene')} ${scene.number}: ${scene.slug}. ${t(FUNCTION_KEY[scene.storyFunction])}`}
      >
        <span className="card-top">
          <b className="card-number">{scene.number}</b>
          {selected && (
            <span className="card-selected-marker" aria-hidden="true">
              ▸
            </span>
          )}
        </span>
        <small className="card-slug">{scene.slug}</small>
        <span className="card-function">{t(FUNCTION_KEY[scene.storyFunction])}</span>
      </button>
      <button
        type="button"
        ref={chipRef}
        className={pointStated ? 'card-point-preview' : 'card-nopoint'}
        title={t('sp.editPoint')}
        aria-label={pointStated ? `${t('sp.title')}: ${scenePoint!.point}` : undefined}
        onClick={() => setEditing(true)}
      >
        {pointStated ? scenePoint!.point : t('sp.nopoint')}
      </button>
      {verdictEntry && verdict !== 'earns' && (
        <span className="card-verdict">
          <span aria-hidden="true">{verdictEntry.icon}</span> {t(verdictEntry.key)}
        </span>
      )}
      {editing && (
        <ScenePointPopover
          scene={scene}
          onClose={(reason) => {
            setEditing(false);
            // Focus returns to the chip unless the writer deliberately left
            // (a blur-save means they clicked elsewhere; don't steal it back).
            if (reason !== 'blur') chipRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}
