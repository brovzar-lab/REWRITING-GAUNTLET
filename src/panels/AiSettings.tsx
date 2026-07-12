import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { keyStore, resolveProvider } from '../ai';
import { useT } from '../i18n/strings';

/** The consent screen. The cloud assistant stays off until the writer reads
    what leaves the machine, ticks consent, and supplies their own key.
    The local analyzer needs none of that and is always available. */
export function AiSettings() {
  const open = useAppStore((s) => s.aiSettingsOpen);
  const setOpen = useAppStore((s) => s.setAiSettingsOpen);
  const consent = useAppStore((s) => s.workflow.cloudAiConsent);
  const setCloudAiConsent = useAppStore((s) => s.setCloudAiConsent);
  const t = useT();
  const [key, setKey] = useState(() => keyStore.get());

  if (!open) return null;

  const active = resolveProvider(consent);
  const close = () => setOpen(false);

  return (
    <div className="import-overlay" onClick={close}>
      <div
        className="import-dialog ai-settings"
        role="dialog"
        aria-modal="true"
        aria-label={t('ai.settings')}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') close();
        }}
      >
        <h2 className="panel-title">{t('ai.settings')}</h2>
        <p className="ai-active" aria-live="polite">
          {active.id === 'cloud' ? t('ai.activeCloud') : t('ai.activeLocal')}
        </p>

        <section aria-label={t('ai.localTitle')} className="ai-provider-block">
          <h3 className="inspector-section">{t('ai.localTitle')}</h3>
          <p className="import-note">{t('ai.localDesc')}</p>
        </section>

        <section aria-label={t('ai.cloudTitle')} className="ai-provider-block">
          <h3 className="inspector-section">{t('ai.cloudTitle')}</h3>
          <p className="import-note">{t('ai.consentText')}</p>
          <label className="ai-consent-row">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setCloudAiConsent(e.target.checked)}
            />
            <span>{t('ai.consentCheck')}</span>
          </label>
          <label className="control-label" htmlFor="ai-api-key">
            {t('ai.keyLabel')}
          </label>
          <input
            id="ai-api-key"
            type="password"
            autoComplete="off"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              keyStore.set(e.target.value.trim());
            }}
          />
          <p className="import-note">{t('ai.keyNote')}</p>
        </section>

        <div className="import-actions">
          <button type="button" className="seg-button" onClick={close}>
            {t('ai.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
