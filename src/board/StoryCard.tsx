import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Scene } from '../model/screenplay';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';

const FUNCTION_KEY = {
  plot: 'function.plot',
  setup: 'function.setup',
  opposition: 'function.opposition',
  resolution: 'function.resolution',
  relationship: 'function.relationship',
} as const;

export function StoryCard({ scene }: { scene: Scene }) {
  const selection = useAppStore((s) => s.selection);
  const select = useAppStore((s) => s.select);
  const t = useT();

  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({ id: scene.id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: scene.id });

  const selected = selection?.sceneId === scene.id;

  return (
    <button
      type="button"
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
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
  );
}
