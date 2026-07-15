import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';
import { whatWorkedItems } from '../workflow/whatWorked';

/** Collapsible protected list shown above Game Plan and Passes: what the
    readers and the writer's own read say must not break in the rewrite. */
export function WhatWorkedPin() {
  const t = useT();
  const workflow = useAppStore((s) => s.workflow);
  const screenplay = useAppStore((s) => s.screenplay);
  const [open, setOpen] = useState(false);
  const items = whatWorkedItems(workflow, screenplay);
  return (
    <div className="ww-pin">
      <button type="button" className="ww-pin-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        {t('ww.title')} · {items.length}
      </button>
      {open && (
        <ul className="ww-pin-list">
          {items.length === 0 && <li className="ww-pin-empty">{t('ww.empty')}</li>}
          {items.map((i) => (
            <li key={i.id} className="ww-pin-item">
              <span className="ww-pin-text">{i.text}</span>
              <span className="ww-pin-attr">{i.attribution}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
