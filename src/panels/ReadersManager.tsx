import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n/strings';
import type { Reader } from '../workflow/types';

/** Registered readers, with the Epps limits enforced by the store and the
    recommendation stated up front: three readers, five max, one interim. */
export function ReadersManager() {
  const readers = useAppStore((s) => s.workflow.readers);
  const addReader = useAppStore((s) => s.addReader);
  const removeReader = useAppStore((s) => s.removeReader);
  const t = useT();

  const [name, setName] = useState('');
  const [role, setRole] = useState<Reader['role']>('initial');
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    if (name.trim() === '') return;
    try {
      addReader(name.trim(), role);
      setName('');
      setError(null);
    } catch {
      setError(role === 'initial' ? t('readers.errInitial') : t('readers.errInterim'));
    }
  };

  return (
    <section className="readers-manager" aria-label={t('readers.title')}>
      <h3 className="inspector-section">{t('readers.title')}</h3>
      <p className="inspector-hint">{t('readers.hint')}</p>
      {readers.length > 0 && (
        <ul className="readers-list">
          {readers.map((r) => (
            <li key={r.id} className="reader-row">
              <span className={`source-chip source-${r.role === 'interim' ? 'interim_reader' : 'reader'}`}>
                {r.role === 'interim' ? t('readers.interim') : t('readers.initial')}
              </span>
              <span className="reader-row-name">{r.name}</span>
              <button
                type="button"
                className="seg-button reader-remove"
                aria-label={`${t('readers.remove')} ${r.name}`}
                onClick={() => removeReader(r.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="reader-add"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <label className="control-label" htmlFor="reader-name">
          {t('readers.name')}
        </label>
        <input id="reader-name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="control-label" htmlFor="reader-role">
          {t('readers.role')}
        </label>
        <select id="reader-role" value={role} onChange={(e) => setRole(e.target.value as Reader['role'])}>
          <option value="initial">{t('readers.initial')}</option>
          <option value="interim">{t('readers.interim')}</option>
        </select>
        <button type="submit" className="seg-button" disabled={name.trim() === ''}>
          {t('readers.addBtn')}
        </button>
      </form>
      {error && (
        <p className="inspector-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
