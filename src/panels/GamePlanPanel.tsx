import { useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';
import { EPPS_PASSES } from '../model/passes';
import { movePassPriority, type Motif } from '../model/gameplan';
import { ExtChip } from './ExtChip';
import './inspector.css';

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  ext,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  ext?: boolean;
}) {
  return (
    <div className="gp-field">
      <label htmlFor={id} className="gp-label">
        {label}
        {ext && <ExtChip />}
      </label>
      <textarea
        id={id}
        rows={2}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="gp-hint">{hint}</p>}
    </div>
  );
}

/** One pass chip in the priority list, draggable like a board card. */
function PriorityChip({ passId, index }: { passId: string; index: number }) {
  const pass = EPPS_PASSES.find((p) => p.id === passId);
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({ id: passId });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: passId });
  if (!pass) return null;
  return (
    <li
      ref={setDropRef}
      className={`gp-priority${isOver ? ' is-over' : ''}${isDragging ? ' is-dragging' : ''}`}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined}
    >
      <button type="button" ref={setDragRef} className="gp-priority-grip" {...attributes} {...listeners}>
        <span className="gp-priority-rank">{index + 1}</span>
        {pass.name}
      </button>
    </li>
  );
}

function MotifRow({ motif }: { motif: Motif }) {
  const t = useT();
  const screenplay = useAppStore((s) => s.screenplay);
  const selection = useAppStore((s) => s.selection);
  const select = useAppStore((s) => s.select);
  const addMotifOccurrence = useAppStore((s) => s.addMotifOccurrence);
  const removeMotifOccurrence = useAppStore((s) => s.removeMotifOccurrence);
  const removeMotif = useAppStore((s) => s.removeMotif);

  const sceneNumber = (sceneId: string) => screenplay.scenes.find((s) => s.id === sceneId)?.number ?? '?';

  return (
    <li className="gp-motif">
      <div className="gp-motif-head">
        <span className="gp-motif-name">{motif.name}</span>
        <button
          type="button"
          className="tool-button"
          aria-label={`${t('gp.motifRemove')}: ${motif.name}`}
          onClick={() => removeMotif(motif.id)}
        >
          ×
        </button>
      </div>
      <div className="gp-motif-occurrences">
        {motif.occurrences.map((o) => (
          <span key={o.elementId} className="gp-occurrence">
            <button type="button" className="gp-anchor" onClick={() => select(o)}>
              {t('gp.scene')} {sceneNumber(o.sceneId)}
            </button>
            <button
              type="button"
              className="gp-anchor-remove"
              aria-label={`${t('gp.occurrenceRemove')}: ${t('gp.scene')} ${sceneNumber(o.sceneId)}`}
              onClick={() => removeMotifOccurrence(motif.id, o.elementId)}
            >
              ×
            </button>
          </span>
        ))}
        <button
          type="button"
          className="tool-button gp-mark"
          disabled={!selection}
          title={selection ? undefined : t('gp.noSelection')}
          aria-label={`${t('gp.motifMark')} — ${motif.name}`}
          onClick={() => selection && addMotifOccurrence(motif.id, selection)}
        >
          {t('gp.motifMark')}
        </button>
      </div>
    </li>
  );
}

/** The writer's Game Plan + Compass. Writer-authored by design: the book has
    the writer draft it after the private read; the analyzer never fills it. */
export function GamePlanPanel() {
  const t = useT();
  const gamePlan = useAppStore((s) => s.gamePlan);
  const screenplay = useAppStore((s) => s.screenplay);
  const selection = useAppStore((s) => s.selection);
  const select = useAppStore((s) => s.select);
  const updateGamePlan = useAppStore((s) => s.updateGamePlan);
  const updateCompass = useAppStore((s) => s.updateCompass);
  const setPassPriorities = useAppStore((s) => s.setPassPriorities);
  const addMotif = useAppStore((s) => s.addMotif);
  const [motifDraft, setMotifDraft] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  function onDragEnd(event: DragEndEvent) {
    if (!event.over) return;
    setPassPriorities(
      movePassPriority(gamePlan.passPriorities, String(event.active.id), String(event.over.id)),
    );
  }

  const clockAnchor = gamePlan.compass.tickingClockAnchor;
  const clockScene = clockAnchor
    ? screenplay.scenes.find((s) => s.id === clockAnchor.sceneId)
    : undefined;

  return (
    <aside className="game-plan" aria-label={t('gp.tab')}>
      <h3 className="inspector-section">{t('gp.objective')}</h3>
      <Field
        id="gp-intent"
        label={t('gp.intent')}
        value={gamePlan.statementOfIntent}
        onChange={(v) => updateGamePlan({ statementOfIntent: v })}
        placeholder={t('gp.intentHint')}
      />
      <Field
        id="gp-about"
        label={t('gp.about')}
        value={gamePlan.about}
        onChange={(v) => updateGamePlan({ about: v })}
      />
      <Field
        id="gp-improves"
        label={t('gp.improves')}
        value={gamePlan.improves}
        onChange={(v) => updateGamePlan({ improves: v })}
      />
      <Field
        id="gp-keep"
        label={t('gp.keep')}
        value={gamePlan.mustNotBeLost}
        onChange={(v) => updateGamePlan({ mustNotBeLost: v })}
      />
      <Field
        id="gp-audience"
        label={t('gp.audience')}
        value={gamePlan.audiencePromise}
        onChange={(v) => updateGamePlan({ audiencePromise: v })}
        ext
      />
      <Field
        id="gp-spine"
        label={t('gp.spine')}
        value={gamePlan.emotionalSpine}
        onChange={(v) => updateGamePlan({ emotionalSpine: v })}
        ext
      />

      <h4 className="gp-subhead" id="gp-priorities-label">
        {t('gp.priorities')}
      </h4>
      <p className="gp-hint">{t('gp.prioritiesHint')}</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <ul className="gp-priorities" aria-labelledby="gp-priorities-label">
          {gamePlan.passPriorities.map((passId, index) => (
            <PriorityChip key={passId} passId={passId} index={index} />
          ))}
        </ul>
      </DndContext>

      <h3 className="inspector-section">{t('gp.compass')}</h3>
      <Field
        id="gp-touchstone"
        label={t('gp.touchstone')}
        value={gamePlan.compass.touchstone}
        onChange={(v) => updateCompass({ touchstone: v })}
        hint={t('gp.touchstoneHint')}
      />
      <Field
        id="gp-clock"
        label={t('gp.clock')}
        value={gamePlan.compass.tickingClock}
        onChange={(v) => updateCompass({ tickingClock: v })}
      />
      <div className="gp-clock-anchor">
        {clockAnchor ? (
          <>
            <button type="button" className="gp-anchor" onClick={() => select(clockAnchor)}>
              {t('gp.clockLinked')}: {t('gp.scene')} {clockScene?.number ?? '?'}
            </button>
            <button
              type="button"
              className="tool-button"
              onClick={() => updateCompass({ tickingClockAnchor: null })}
            >
              {t('gp.clockUnlink')}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="tool-button"
            disabled={!selection}
            title={selection ? undefined : t('gp.noSelection')}
            onClick={() => selection && updateCompass({ tickingClockAnchor: selection })}
          >
            {t('gp.clockLink')}
          </button>
        )}
      </div>
      <Field
        id="gp-theme"
        label={t('gp.theme')}
        value={gamePlan.compass.themeThroughAction}
        onChange={(v) => updateCompass({ themeThroughAction: v })}
        hint={t('gp.themeHint')}
      />

      <h4 className="gp-subhead">{t('gp.motifs')}</h4>
      <ul className="gp-motifs">
        {gamePlan.compass.motifs.map((motif) => (
          <MotifRow key={motif.id} motif={motif} />
        ))}
      </ul>
      <div className="gp-motif-add">
        <label htmlFor="gp-motif-name" className="gp-label">
          {t('gp.motifName')}
        </label>
        <div className="gp-motif-add-row">
          <input
            id="gp-motif-name"
            type="text"
            value={motifDraft}
            onChange={(e) => setMotifDraft(e.target.value)}
          />
          <button
            type="button"
            className="tool-button"
            disabled={!motifDraft.trim()}
            onClick={() => {
              addMotif(motifDraft.trim());
              setMotifDraft('');
            }}
          >
            {t('gp.motifAdd')}
          </button>
        </div>
      </div>
    </aside>
  );
}
