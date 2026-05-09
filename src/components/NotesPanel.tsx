import { useState } from 'react';
import { ChevronDown, ChevronUp, StickyNote } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useI18n } from '../i18n';

export function NotesPanel() {
  const { currentOntology } = useAppStore();
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="notes-panel">
      <button
        className="notes-panel-header"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls="notes-panel-body"
      >
        <span className="notes-panel-title">
          <StickyNote size={14} />
          {t('notes.title')}
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div id="notes-panel-body" className="notes-panel-body">
          {currentOntology.description ? (
            <p className="notes-panel-text">{currentOntology.description}</p>
          ) : (
            <p className="notes-panel-empty">{t('notes.empty')}</p>
          )}
        </div>
      )}
    </div>
  );
}
