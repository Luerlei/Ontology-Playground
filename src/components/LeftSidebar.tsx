import { useState } from 'react';
import { ChevronDown, ChevronRight, Compass, Layers3 } from 'lucide-react';
import { QuestPanel } from './QuestPanel';
import { ModelCataloguePanel } from './ModelCataloguePanel';
import { useI18n } from '../i18n';

interface LeftSidebarProps {
  onCreateModel?: () => void;
}

export function LeftSidebar({ onCreateModel }: LeftSidebarProps) {
  const { t } = useI18n();
  const [questCollapsed, setQuestCollapsed] = useState(true);
  const [catalogueCollapsed, setCatalogueCollapsed] = useState(false);

  return (
    <aside className="left-sidebar">
      <section className={`left-sidebar-section ${questCollapsed ? 'collapsed' : ''}`}>
        <button className="left-sidebar-section-header" onClick={() => setQuestCollapsed((prev) => !prev)}>
          {questCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          <Compass size={14} />
          <span>{t('left.quests.title')}</span>
        </button>
        {!questCollapsed && (
          <div className="left-sidebar-section-body quests-body">
            <QuestPanel hideHeader />
          </div>
        )}
      </section>

      <section className={`left-sidebar-section ${catalogueCollapsed ? 'collapsed' : ''}`}>
        <button className="left-sidebar-section-header" onClick={() => setCatalogueCollapsed((prev) => !prev)}>
          {catalogueCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          <Layers3 size={14} />
          <span>{t('left.model.title')}</span>
        </button>
        {!catalogueCollapsed && (
          <div className="left-sidebar-section-body catalogue-body">
            <ModelCataloguePanel onCreateModel={onCreateModel} />
          </div>
        )}
      </section>
    </aside>
  );
}
