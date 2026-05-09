import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, Upload, Github, FilePlus, Undo2, Redo2, Database, Save, FolderOpen } from 'lucide-react';
import JSZip from 'jszip';
import { useDesignerStore } from '../../store/designerStore';
import type { ValidationError } from '../../store/designerStore';
import { useAppStore } from '../../store/appStore';
import { navigate } from '../../lib/router';
import { SubmitCatalogueModal } from './SubmitCatalogueModal';
import { useI18n } from '../../i18n';
import { DataSourcesModal } from '../DataSourcesModal';
import { serializeToRDF } from '../../lib/rdf/serializer';
import { updateCatalogueEntry } from '../../lib/catalogueApi';

/**
 * Toolbar buttons — rendered in the designer topbar.
 */
interface DesignerToolbarProps {
  catalogueId?: string;
}

export function DesignerToolbar({ catalogueId }: DesignerToolbarProps) {
  const { ontology, metadata, validate, resetDraft, undo, redo, _past, _future, loadDraft } = useDesignerStore();
  const loadOntology = useAppStore((s) => s.loadOntology);
  const dataBindings = useAppStore((s) => s.dataBindings);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDataSources, setShowDataSources] = useState(false);
  const [loadLocalError, setLoadLocalError] = useState<string | null>(null);
  const [saveRemoteStatus, setSaveRemoteStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveRemoteError, setSaveRemoteError] = useState<string | null>(null);
  const loadInputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();
  const canUndo = _past.length > 0;
  const canRedo = _future.length > 0;

  const handleValidate = () => {
    validate();
  };

  const handleLoadInPlayground = () => {
    const errors = validate();
    if (errors.length > 0) return;
    loadOntology(ontology, []);
    navigate({ page: 'home' });
  };

  const handleNewOntology = () => {
    resetDraft();
    setLoadLocalError(null);
  };

  const handleSubmitToCatalogue = () => {
    const errors = validate();
    if (errors.length > 0) return;
    setShowSubmitModal(true);
  };

  const handleUpdateCatalogue = async () => {
    if (!catalogueId) return;
    const errors = validate();
    if (errors.length > 0) return;

    setSaveRemoteStatus('saving');
    setSaveRemoteError(null);
    try {
      await updateCatalogueEntry({
        id: catalogueId,
        ontology,
        bindings: dataBindings,
        metadata: {
          name: ontology.name,
          description: ontology.description,
          icon: metadata.icon || ontology.entityTypes[0]?.icon || '📦',
          category: metadata.category || 'general',
          tags: metadata.tags ?? [],
          author: metadata.author || '',
        },
      });
      setSaveRemoteStatus('success');
      setTimeout(() => setSaveRemoteStatus('idle'), 2500);
    } catch (error) {
      setSaveRemoteStatus('error');
      setSaveRemoteError(error instanceof Error ? error.message : t('designer.toolbar.update_catalogue_failed'));
    }
  };

  const handleSaveLocalZip = async () => {
    const slug = ontology.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ontology';
    const rdf = serializeToRDF(ontology, []);
    const jsonContent = JSON.stringify({ ontology, bindings: dataBindings }, null, 2) + '\n';
    const metadataPayload = {
      name: ontology.name,
      description: ontology.description,
      icon: metadata.icon || ontology.entityTypes[0]?.icon || '📦',
      category: metadata.category || 'general',
      tags: metadata.tags ?? [],
      author: metadata.author || '',
      relationshipNameDictionary: metadata.relationshipNameDictionary ?? [],
    };

    const zip = new JSZip();
    zip.file(`${slug}.rdf`, rdf);
    zip.file(`${slug}.json`, jsonContent);
    zip.file('metadata.json', JSON.stringify(metadataPayload, null, 2) + '\n');
    const blob = await zip.generateAsync({ type: 'blob' });

    const fileName = `${slug}-model.zip`;
    const withFilePicker = window as Window & {
      showSaveFilePicker?: (options?: {
        suggestedName?: string;
        types?: Array<{ description: string; accept: Record<string, string[]> }>;
      }) => Promise<{
        createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
      }>;
    };

    if (withFilePicker.showSaveFilePicker) {
      const handle = await withFilePicker.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'ZIP archive',
            accept: { 'application/zip': ['.zip'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    }

    // Fallback for browsers without File System Access API
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadLocalZipClick = () => {
    setLoadLocalError(null);
    loadInputRef.current?.click();
  };

  const handleLoadLocalZip: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.rar')) {
      setLoadLocalError(t('designer.toolbar.load_local_rar_unsupported'));
      return;
    }

    try {
      const zip = await JSZip.loadAsync(file);
      const jsonFile = Object.values(zip.files).find((entry) => {
        const fileName = entry.name.toLowerCase();
        return !entry.dir && fileName.endsWith('.json') && fileName !== 'metadata.json';
      });

      if (!jsonFile) {
        throw new Error('missing model json');
      }

      const jsonText = await jsonFile.async('string');
      const parsed = JSON.parse(jsonText) as {
        ontology?: unknown;
        bindings?: unknown;
        metadata?: unknown;
      };

      const ontologyCandidate = (parsed.ontology && typeof parsed.ontology === 'object')
        ? parsed.ontology
        : parsed;

      if (!ontologyCandidate || typeof ontologyCandidate !== 'object') {
        throw new Error('invalid ontology');
      }

      const ontologyParsed = ontologyCandidate as {
        name?: unknown;
        description?: unknown;
        entityTypes?: unknown;
        relationships?: unknown;
      };

      if (!Array.isArray(ontologyParsed.entityTypes) || !Array.isArray(ontologyParsed.relationships)) {
        throw new Error('invalid ontology shape');
      }

      let metadataInZip: Record<string, unknown> | undefined;
      const metadataFile = zip.file('metadata.json');
      if (metadataFile) {
        const metadataText = await metadataFile.async('string');
        const parsedMetadata = JSON.parse(metadataText);
        if (parsedMetadata && typeof parsedMetadata === 'object') {
          metadataInZip = parsedMetadata as Record<string, unknown>;
        }
      } else if (parsed.metadata && typeof parsed.metadata === 'object') {
        metadataInZip = parsed.metadata as Record<string, unknown>;
      }

      const metadataUpdates = metadataInZip
        ? {
            icon: typeof metadataInZip.icon === 'string' ? metadataInZip.icon : undefined,
            category: typeof metadataInZip.category === 'string' ? metadataInZip.category : undefined,
            tags: Array.isArray(metadataInZip.tags) ? metadataInZip.tags.filter((v): v is string => typeof v === 'string') : undefined,
            author: typeof metadataInZip.author === 'string' ? metadataInZip.author : undefined,
            relationshipNameDictionary: Array.isArray(metadataInZip.relationshipNameDictionary)
              ? metadataInZip.relationshipNameDictionary.filter((v): v is string => typeof v === 'string')
              : undefined,
          }
        : undefined;

      const normalizedOntology = {
        name: typeof ontologyParsed.name === 'string' ? ontologyParsed.name : 'Imported Ontology',
        description: typeof ontologyParsed.description === 'string' ? ontologyParsed.description : '',
        entityTypes: ontologyParsed.entityTypes,
        relationships: ontologyParsed.relationships,
      };

      const bindings = Array.isArray(parsed.bindings) ? parsed.bindings : [];

      loadDraft(normalizedOntology, metadataUpdates);
      useAppStore.setState({ dataBindings: bindings });
      setLoadLocalError(null);
    } catch {
      setLoadLocalError(t('designer.toolbar.load_local_error'));
    }
  };

  return (
    <>
      <div className="designer-toolbar">
        <button className="designer-toolbar-btn" onClick={undo} disabled={!canUndo} title={t('designer.toolbar.undo_title')}>
          <Undo2 size={14} />
        </button>
        <button className="designer-toolbar-btn" onClick={redo} disabled={!canRedo} title={t('designer.toolbar.redo_title')}>
          <Redo2 size={14} />
        </button>
        <div className="designer-toolbar-sep" />
        <button className="designer-toolbar-btn" onClick={handleNewOntology} title={t('designer.toolbar.new_title')}>
          <FilePlus size={14} /> {t('designer.toolbar.new')}
        </button>
        <button className="designer-toolbar-btn" onClick={handleValidate} title={t('designer.toolbar.validate_title')}>
          <CheckCircle size={14} /> {t('designer.toolbar.validate')}
        </button>
        <div className="designer-toolbar-sep" />
        <button className="designer-toolbar-btn" onClick={() => { void handleSaveLocalZip(); }} title={t('designer.toolbar.save_local_title')}>
          <Save size={14} /> {t('designer.toolbar.save_local')}
        </button>
        {catalogueId && (
          <button
            className="designer-toolbar-btn"
            onClick={() => { void handleUpdateCatalogue(); }}
            title={t('designer.toolbar.update_catalogue_title')}
            disabled={saveRemoteStatus === 'saving'}
          >
            <Save size={14} />
            {saveRemoteStatus === 'saving' ? t('designer.toolbar.updating_catalogue') : t('designer.toolbar.update_catalogue')}
          </button>
        )}
        <button className="designer-toolbar-btn" onClick={handleLoadLocalZipClick} title={t('designer.toolbar.load_local_title')}>
          <FolderOpen size={14} /> {t('designer.toolbar.load_local')}
        </button>
        <button className="designer-toolbar-btn" onClick={handleLoadInPlayground} title={t('designer.toolbar.load_playground_title')}>
          <Upload size={14} /> {t('designer.toolbar.load_playground')}
        </button>
        <button className="designer-toolbar-btn" onClick={() => setShowDataSources(true)} title={t('header.datasources')}>
          <Database size={14} /> {t('header.datasources')}
        </button>
        <button className="designer-toolbar-btn submit" onClick={handleSubmitToCatalogue} title={t('designer.toolbar.submit_title')}>
          <Github size={14} /> {t('designer.toolbar.submit')}
        </button>
        <input
          ref={loadInputRef}
          type="file"
          accept=".zip,.rar"
          style={{ display: 'none' }}
          onChange={(event) => { void handleLoadLocalZip(event); }}
        />
      </div>
      {loadLocalError && <div className="designer-field-hint error" style={{ marginTop: 6 }}>{loadLocalError}</div>}
      {saveRemoteStatus === 'success' && (
        <div className="designer-field-hint" style={{ marginTop: 6, color: 'var(--ms-green, #16c60c)' }}>
          {t('designer.toolbar.update_catalogue_success')}
        </div>
      )}
      {saveRemoteStatus === 'error' && saveRemoteError && (
        <div className="designer-field-hint error" style={{ marginTop: 6 }}>{saveRemoteError}</div>
      )}

      {showDataSources && (
        <DataSourcesModal entityTypes={ontology.entityTypes} onClose={() => setShowDataSources(false)} />
      )}

      {showSubmitModal && (
        <SubmitCatalogueModal onClose={() => setShowSubmitModal(false)} />
      )}
    </>
  );
}

/**
 * Validation feedback — rendered in the sidebar.
 */
export function DesignerValidation() {
  const validationErrors = useDesignerStore((s) => s.validationErrors);
  const lastValidatedAt = useDesignerStore((s) => s._lastValidatedAt);
  const [showSuccess, setShowSuccess] = useState(false);
  const { t } = useI18n();

  // Show success banner for 3 seconds when validation runs with 0 errors
  useEffect(() => {
    if (lastValidatedAt > 0 && validationErrors.length === 0) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
    setShowSuccess(false);
  }, [lastValidatedAt, validationErrors.length]);

  if (validationErrors.length === 0) {
    if (!showSuccess) return null;
    return (
      <div className="designer-validation-success">
        <div className="designer-validation-header" style={{ color: 'var(--ms-green, #16c60c)' }}>
          <CheckCircle size={14} /> {t('designer.validation.no_issues')}
        </div>
      </div>
    );
  }

  return (
    <div className="designer-validation-errors">
      <div className="designer-validation-header">
        <AlertTriangle size={14} /> {t('designer.validation.issues_to_fix', { count: validationErrors.length })}
      </div>
      <ul>
        {validationErrors.map((err, i) => (
          <li key={i}>
            <ErrorItem error={err} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ErrorItem({ error }: { error: ValidationError }) {
  const selectEntity = useDesignerStore((s) => s.selectEntity);
  const selectRelationship = useDesignerStore((s) => s.selectRelationship);

  const handleClick = () => {
    if (error.entityId) {
      selectEntity(error.entityId);
    } else if (error.relationshipId) {
      selectRelationship(error.relationshipId);
    }
  };

  const isClickable = error.entityId || error.relationshipId;

  return (
    <span
      className={isClickable ? 'designer-error-link' : ''}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter') handleClick(); } : undefined}
    >
      {error.message}
    </span>
  );
}
