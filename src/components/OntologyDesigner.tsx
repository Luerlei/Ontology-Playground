import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useDesignerStore } from '../store/designerStore';
import { useAppStore } from '../store/appStore';
import { navigate } from '../lib/router';
import { EntityForm, RelationshipForm, MetadataForm, DesignerPreview, DesignerToolbar, DesignerValidation, TemplatePicker } from './designer';
import type { Route } from '../lib/router';
import { useI18n } from '../i18n';
import { fetchCatalogueDynamic } from '../lib/catalogueApi';

interface OntologyDesignerProps {
  route: Route & { page: 'designer' };
}

export function OntologyDesigner({ route }: OntologyDesignerProps) {
  const { ontology, setOntologyName, setOntologyDescription, loadDraft, undo, redo } = useDesignerStore();
  const darkMode = useAppStore((s) => s.darkMode);
  const { t } = useI18n();
  const isEmpty = ontology.entityTypes.length === 0 && ontology.relationships.length === 0;

  // Keyboard shortcuts: Cmd/Ctrl+Z → undo, Cmd/Ctrl+Shift+Z → redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key !== 'z') return;
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // Load existing ontology into the designer when editing via /#/designer/<id>
  useEffect(() => {
    if (!route.ontologyId) return;
    const id = route.ontologyId;
    fetchCatalogueDynamic()
      .then((data) => {
        const entry = data.entries.find((e) => e.id === id);
        if (entry) {
          loadDraft(entry.ontology, {
            icon: entry.icon ?? '📦',
            category: entry.category,
            tags: entry.tags,
            author: entry.author,
          });
        }
      })
      .catch(() => {
        // silently stay with current draft
      });
  }, [route.ontologyId, loadDraft]);

  return (
    <div className={`designer-page ${darkMode ? '' : 'light-theme'}`}>
      {/* Top bar */}
      <div className="designer-topbar">
        <button className="designer-back-btn" onClick={() => navigate({ page: 'home' })}>
          <ArrowLeft size={16} /> {t('designer.page.back')}
        </button>
        <div className="designer-meta-fields">
          <input
            className="designer-meta-name"
            type="text"
            value={ontology.name}
            onChange={(e) => setOntologyName(e.target.value)}
            placeholder={t('designer.page.name_placeholder')}
          />
          <input
            className="designer-meta-desc"
            type="text"
            value={ontology.description}
            onChange={(e) => setOntologyDescription(e.target.value)}
            placeholder={t('designer.page.description_placeholder')}
          />
        </div>
        <DesignerToolbar catalogueId={route.ontologyId} />
      </div>

      {/* Split pane */}
      <div className="designer-split">
        {/* Left: editor forms */}
        <div className="designer-sidebar">
          {isEmpty && <TemplatePicker />}
          <DesignerValidation />
          <MetadataForm />
          <EntityForm />
          <RelationshipForm />
        </div>

        {/* Right: live preview */}
        <DesignerPreview />
      </div>
    </div>
  );
}
