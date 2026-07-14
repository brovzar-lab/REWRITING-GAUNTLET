import { useEffect, useRef, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Scene } from '../model/screenplay';
import { hasStatedPoint, type ScenePointVerdict } from '../model/scenepoint';
import type { HighPointRole } from '../model/markers';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';
import type { StringKey } from '../i18n/strings';

const HIGH_POINT_ROLES: HighPointRole[] = [
  'act_one_end',
  'midpoint',
  'act_two_end',
  'climax',
  'emotional_high',
  'emotional_low',
];

const FUNCTION_KEY = {
  plot: 'function.plot',
  setup: 'function.setup',
  opposition: 'function.opposition',
  resolution: 'function.resolution',
  relationship: 'function.relationship',
} as const;

/** Verdict markers: icon + word, never color alone. Set in the inspector. */
const VERDICT_MARK: Partial<Record<ScenePointVerdict, { icon: string; key: StringKey }>> = {
  unsure: { icon: '?', key: 'sp.unsure' },
  cut_candidate: { icon: '✕', key: 'sp.cut' },
};

/** The dotted chip itself becomes the editor: the writer types the Scene
    Point directly inside the card. Enter saves, Escape cancels, blur saves.
    No popover, no overlay — the card just grows while editing. */
function InCardPointEditor({
  scene,
  onClose,
}: {
  scene: Scene;
  onClose: (reason: 'enter' | 'escape' | 'blur') => void;
}) {
  const t = useT();
  const point = useAppStore((s) => s.scenePoints[scene.id]?.point ?? '');
  const updateScenePoint = useAppStore((s) => s.updateScenePoint);
  const [draft, setDraft] = useState(point);
  const closing = useRef(false);

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
    <textarea
      className="card-point-edit"
      rows={3}
      autoFocus
      value={draft}
      aria-label={t('sp.title')}
      placeholder={t('sp.placeholder')}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          save('enter');
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          cancel();
        }
      }}
      onBlur={() => save('blur')}
      // The board's drag sensor must not treat typing as a card drag.
      onPointerDown={(e) => e.stopPropagation()}
    />
  );
}

export function StoryCard({ scene }: { scene: Scene }) {
  const selection = useAppStore((s) => s.selection);
  const select = useAppStore((s) => s.select);
  const scenePoint = useAppStore((s) => s.scenePoints[scene.id]);
  const fullBoard = useAppStore((s) => s.fullBoard);
  const highPoint = useAppStore((s) => s.highPoints.find((m) => m.sceneId === scene.id));
  const setHighPoint = useAppStore((s) => s.setHighPoint);
  const t = useT();
  const [editing, setEditing] = useState(false);
  const chipRef = useRef<HTMLButtonElement>(null);
  const wantChipFocus = useRef(false);

  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({ id: scene.id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: scene.id });

  const selected = selection?.sceneId === scene.id;
  const pointStated = hasStatedPoint(scenePoint);
  const mark = scenePoint?.verdict ? VERDICT_MARK[scenePoint.verdict] : undefined;

  // The chip unmounts while editing; refocus it once it is back.
  useEffect(() => {
    if (!editing && wantChipFocus.current) {
      wantChipFocus.current = false;
      chipRef.current?.focus();
    }
  }, [editing]);

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
      {editing ? (
        <InCardPointEditor
          scene={scene}
          onClose={(reason) => {
            // A blur-save means the writer clicked elsewhere; don't steal focus back.
            wantChipFocus.current = reason !== 'blur';
            setEditing(false);
          }}
        />
      ) : (
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
      )}
      {mark && (
        <span className="card-verdict">
          <span aria-hidden="true">{mark.icon}</span> {t(mark.key)}
        </span>
      )}
      {highPoint && (
        <span className="card-highpoint">{t(`hp.short.${highPoint.role}` as StringKey)}</span>
      )}
      {fullBoard && (
        <select
          className="card-hp-select"
          aria-label={t('hp.select')}
          value={highPoint?.role ?? ''}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => setHighPoint(scene.id, (e.target.value || null) as HighPointRole | null)}
        >
          <option value="">{t('hp.none')}</option>
          {HIGH_POINT_ROLES.map((role) => (
            <option key={role} value={role}>
              {t(`hp.full.${role}` as StringKey)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
