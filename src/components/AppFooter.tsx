import { Sparkles } from 'lucide-react';
import { useI18n } from '../i18n';

export function AppFooter() {
  const { t } = useI18n();
  return (
    <footer className="app-footer">
      <a href="https://github.com/features/copilot" target="_blank" rel="noopener noreferrer">
        <Sparkles size={14} />
        {t('footer.built')}
      </a>
      <span className="app-footer-sep">&middot;</span>
      <a href="https://github.com/videlalvaro" target="_blank" rel="noopener noreferrer">
        {t('footer.supervised')}
      </a>
    </footer>
  );
}
