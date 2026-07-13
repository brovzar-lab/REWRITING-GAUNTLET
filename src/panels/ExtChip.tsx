import { useT } from '../i18n/strings';

/** EXT chip: marks a field as a Studio extension, never book-attributed. */
export function ExtChip() {
  const t = useT();
  return (
    <span className="ext-chip" title={t('ext.tip')}>
      {t('ext.label')}
    </span>
  );
}
