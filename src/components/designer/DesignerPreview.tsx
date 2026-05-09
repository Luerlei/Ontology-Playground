import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import type { Core } from 'cytoscape';
import { Download } from 'lucide-react';
import { useDesignerStore } from '../../store/designerStore';
import { useAppStore } from '../../store/appStore';
import { serializeToRDF } from '../../lib/rdf/serializer';
import { parseRDF } from '../../lib/rdf/parser';
import {
  highlightJson,
  highlightRdf,
  JSON_HIGHLIGHT_DARK,
  JSON_HIGHLIGHT_LIGHT,
  RDF_HIGHLIGHT_DARK,
  RDF_HIGHLIGHT_LIGHT,
} from '../../lib/rdf/highlighter';
import type { Ontology } from '../../data/ontology';
import { useI18n } from '../../i18n';

cytoscape.use(fcose);

export function DesignerPreview() {
  const [activeTab, setActiveTab] = useState<'graph' | 'rdf' | 'json'>('graph');
  const { ontology, selectedEntityId, selectedRelationshipId, selectEntity, selectRelationship } = useDesignerStore();
  const darkMode = useAppStore((s) => s.darkMode);
  const { t } = useI18n();

  return (
    <div className="designer-preview">
      <div className="designer-preview-tabs">
        <button
          className={`designer-tab ${activeTab === 'graph' ? 'active' : ''}`}
          onClick={() => setActiveTab('graph')}
        >
          {t('designer.preview.tab_graph')}
        </button>
        <button
          className={`designer-tab ${activeTab === 'rdf' ? 'active' : ''}`}
          onClick={() => setActiveTab('rdf')}
        >
          {t('designer.preview.tab_rdf')}
        </button>
        <button
          className={`designer-tab ${activeTab === 'json' ? 'active' : ''}`}
          onClick={() => setActiveTab('json')}
        >
          {t('designer.preview.tab_json')}
        </button>
      </div>

      {activeTab === 'graph' ? (
        <GraphPreview
          ontology={ontology}
          darkMode={darkMode}
          selectedEntityId={selectedEntityId}
          selectedRelationshipId={selectedRelationshipId}
          onSelectEntity={selectEntity}
          onSelectRelationship={selectRelationship}
        />
      ) : activeTab === 'rdf' ? (
        <RdfPreview ontology={ontology} onImported={() => setActiveTab('graph')} />
      ) : (
        <JsonPreview ontology={ontology} />
      )}
    </div>
  );
}

// ─── Graph tab ───────────────────────────────────────────────────────────────

interface GraphPreviewProps {
  ontology: { entityTypes: { id: string; name: string; icon: string; color: string }[]; relationships: { id: string; name: string; from: string; to: string; cardinality: string }[] };
  darkMode: boolean;
  selectedEntityId: string | null;
  selectedRelationshipId: string | null;
  onSelectEntity: (id: string | null) => void;
  onSelectRelationship: (id: string | null) => void;
}

function GraphPreview({ ontology, darkMode, selectedEntityId, selectedRelationshipId, onSelectEntity, onSelectRelationship }: GraphPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const selectedEntityIdRef = useRef<string | null>(null);
  const selectedRelationshipIdRef = useRef<string | null>(null);

  const themeColors = useMemo(
    () =>
      darkMode
        ? { nodeText: '#B3B3B3', edgeColor: '#505050', edgeText: '#808080' }
        : { nodeText: '#2A2A2A', edgeColor: '#888888', edgeText: '#555555' },
    [darkMode],
  );

  const buildElements = useCallback(() => {
    const nodes = ontology.entityTypes.map((e) => ({
      data: { id: e.id, label: `${e.icon} ${e.name}`, color: e.color },
    }));
    const edges = ontology.relationships.map((r) => ({
      data: { id: r.id, source: r.from, target: r.to, label: r.name },
    }));
    return [...nodes, ...edges];
  }, [ontology]);

  // Create graph once; update elements incrementally
  useEffect(() => {
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements: buildElements(),
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'font-size': '13px',
            'font-family': 'Segoe UI, sans-serif',
            'font-weight': 600,
            color: themeColors.nodeText,
            'text-margin-y': 8,
            width: 60,
            height: 60,
            'background-color': 'data(color)',
            'border-width': 2,
            'border-color': 'data(color)',
            'border-opacity': 0.5,
          },
        },
        {
          selector: 'edge',
          style: {
            label: 'data(label)',
            'font-size': '11px',
            'font-family': 'Segoe UI, sans-serif',
            color: themeColors.edgeText,
            'text-rotation': 'autorotate',
            'text-margin-y': -8,
            width: 2,
            'line-color': themeColors.edgeColor,
            'target-arrow-color': themeColors.edgeColor,
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
      ],
      layout: {
        name: ontology.entityTypes.length > 0 ? 'fcose' : 'grid',
        animate: false,
        fit: true,
        padding: 40,
        nodeDimensionsIncludeLabels: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      minZoom: 0.3,
      maxZoom: 3,
    });

    cy.on('tap', 'node', (evt) => {
      const nodeId = evt.target.id();
      onSelectEntity(selectedEntityIdRef.current === nodeId ? null : nodeId);
    });
    cy.on('tap', 'edge', (evt) => {
      const edgeId = evt.target.id();
      onSelectRelationship(selectedRelationshipIdRef.current === edgeId ? null : edgeId);
    });
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        onSelectEntity(null);
        onSelectRelationship(null);
      }
    });

    cyRef.current = cy;
    return () => { cy.destroy(); cyRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeColors]); // Only recreate on theme change

  // Keep refs in sync with current selection state
  useEffect(() => {
    selectedEntityIdRef.current = selectedEntityId;
  }, [selectedEntityId]);

  useEffect(() => {
    selectedRelationshipIdRef.current = selectedRelationshipId;
  }, [selectedRelationshipId]);

  // Incrementally sync nodes & edges without full relayout
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const currentNodeIds = new Set(cy.nodes().map((n) => n.id()));
    const currentEdgeIds = new Set(cy.edges().map((e) => e.id()));
    const desiredNodeIds = new Set(ontology.entityTypes.map((e) => e.id));
    const desiredEdgeIds = new Set(ontology.relationships.map((r) => r.id));

    // Remove deleted elements
    const toRemove = cy.elements().filter((ele) => {
      const id = ele.id();
      return ele.isNode() ? !desiredNodeIds.has(id) : !desiredEdgeIds.has(id);
    });
    if (toRemove.length) toRemove.remove();

    // Add new nodes
    const newNodes: { data: Record<string, string> }[] = [];
    for (const entity of ontology.entityTypes) {
      if (!currentNodeIds.has(entity.id)) {
        newNodes.push({ data: { id: entity.id, label: `${entity.icon} ${entity.name}`, color: entity.color } });
      }
    }

    // Add new edges
    const newEdges: { data: Record<string, string> }[] = [];
    for (const rel of ontology.relationships) {
      if (!currentEdgeIds.has(rel.id)) {
        newEdges.push({ data: { id: rel.id, source: rel.from, target: rel.to, label: rel.name } });
      }
    }

    if (newNodes.length || newEdges.length) {
      cy.add([...newNodes, ...newEdges]);
      // Run a full layout when nodes are added so they don't all stack at the center
      if (newNodes.length) {
        cy.layout({
          name: 'fcose',
          animate: false,
          fit: true,
          padding: 40,
          nodeDimensionsIncludeLabels: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any).run();
      } else {
        cy.fit(undefined, 40);
      }
    }

    // Update cosmetic data on existing elements
    for (const entity of ontology.entityTypes) {
      const node = cy.getElementById(entity.id);
      if (node.length) {
        node.data('label', `${entity.icon} ${entity.name}`);
        node.data('color', entity.color);
      }
    }
    for (const rel of ontology.relationships) {
      const edge = cy.getElementById(rel.id);
      if (edge.length) {
        edge.data('label', rel.name);
      }
    }
  }, [ontology]);

  return <div ref={containerRef} className="designer-graph-container" />;
}

// ─── RDF tab ─────────────────────────────────────────────────────────────────

interface RdfPreviewProps {
  ontology: GraphPreviewProps['ontology'] & { name: string; description: string };
  onImported: () => void;
}

function RdfPreview({ ontology, onImported }: RdfPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [importMode, setImportMode] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const importHighlightRef = useRef<HTMLPreElement>(null);
  const loadDraft = useDesignerStore((s) => s.loadDraft);
  const { t } = useI18n();

  let rdfOutput: string;
  try {
    rdfOutput = serializeToRDF(ontology as Parameters<typeof serializeToRDF>[0], []);
  } catch {
    rdfOutput = '<!-- Ontology is incomplete or invalid; fix errors to see RDF output -->';
  }

  const darkMode = useAppStore((s) => s.darkMode);
  const hlTheme = darkMode ? RDF_HIGHLIGHT_DARK : RDF_HIGHLIGHT_LIGHT;
  const highlightedRdf = useMemo(() => highlightRdf(rdfOutput, hlTheme), [rdfOutput, hlTheme]);
  const highlightedImportRdf = useMemo(() => highlightRdf(importText || ' ', hlTheme), [importText, hlTheme]);

  const handleCopy = () => {
    navigator.clipboard.writeText(rdfOutput).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExportRdf = () => {
    try {
      const blob = new Blob([rdfOutput], { type: 'application/rdf+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ontology.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'ontology'}.rdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore export failures
    }
  };

  const handleImport = () => {
    const trimmed = importText.trim();
    if (!trimmed) {
      setImportError(t('designer.preview.rdf.error_empty'));
      return;
    }
    try {
      const { ontology: parsed } = parseRDF(trimmed);
      loadDraft(parsed);
      setImportMode(false);
      setImportText('');
      setImportError(null);
      onImported();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : t('designer.preview.rdf.error_parse'));
    }
  };

  const handleCancel = () => {
    setImportMode(false);
    setImportText('');
    setImportError(null);
  };

  return (
    <div className="designer-rdf-container">
      <div className="designer-rdf-toolbar">
        {importMode ? (
          <>
            <button className="designer-add-btn small" onClick={handleImport}>
              {t('designer.preview.rdf.load')}
            </button>
            <button className="designer-add-btn small secondary" onClick={handleCancel}>
              {t('designer.preview.cancel')}
            </button>
          </>
        ) : (
          <>
            <button className="designer-add-btn small" onClick={handleExportRdf} title={t('designer.toolbar.export_rdf_title')}>
              <Download size={12} /> {t('designer.toolbar.export_rdf')}
            </button>
            <button className="designer-add-btn small" onClick={() => { setImportMode(true); setImportText(rdfOutput); }}>
              {t('designer.preview.rdf.edit')}
            </button>
            <button className="designer-add-btn small" onClick={handleCopy}>
              {copied ? t('designer.preview.copied') : t('designer.preview.rdf.copy')}
            </button>
          </>
        )}
      </div>
      {importError && (
        <div className="designer-import-error">{importError}</div>
      )}
      {importMode ? (
        <div className="designer-code-edit-wrap">
          <pre ref={importHighlightRef} className="designer-rdf-source designer-code-highlight-layer">{highlightedImportRdf}</pre>
          <textarea
            className="designer-rdf-source designer-rdf-textarea designer-code-input-overlay"
            value={importText}
            onChange={(e) => { setImportText(e.target.value); setImportError(null); }}
            onScroll={(e) => {
              if (importHighlightRef.current) {
                importHighlightRef.current.scrollTop = e.currentTarget.scrollTop;
                importHighlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
              }
            }}
            placeholder={t('designer.preview.rdf.placeholder')}
            autoFocus
            spellCheck={false}
          />
        </div>
      ) : (
        <pre className="designer-rdf-source">{highlightedRdf}</pre>
      )}
    </div>
  );
}

// ─── JSON tab ───────────────────────────────────────────────────────────────

interface JsonPreviewProps {
  ontology: Ontology;
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function JsonFoldTree({
  value,
  collapsed,
  onToggle,
  expandLabel,
  collapseLabel,
}: {
  value: JsonValue;
  collapsed: Set<string>;
  onToggle: (path: string) => void;
  expandLabel: string;
  collapseLabel: string;
}) {
  const renderValue = (v: JsonValue): string => {
    if (typeof v === 'string') return `"${v}"`;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (v === null) return 'null';
    return Array.isArray(v) ? '[...]' : '{...}';
  };

  const isCollapsible = (v: JsonValue): v is JsonValue[] | { [key: string]: JsonValue } =>
    typeof v === 'object' && v !== null;

  const renderNode = (
    v: JsonValue,
    path: string,
    depth: number,
    keyName?: string,
    isLast = true,
  ): import('react').ReactElement => {
    const indent = { paddingLeft: `${depth * 16}px` };
    const comma = isLast ? '' : ',';

    if (!isCollapsible(v)) {
      return (
        <div className="designer-json-line" style={indent}>
          {keyName !== undefined && <><span className="designer-json-key">"{keyName}"</span><span>: </span></>}
          <span className={`designer-json-value ${v === null ? 'null' : typeof v}`}>
            {renderValue(v)}
          </span>
          {comma}
        </div>
      );
    }

    const entries = Array.isArray(v)
      ? v.map((item, index) => [String(index), item] as const)
      : Object.entries(v);

    const isCollapsed = collapsed.has(path);
    const open = Array.isArray(v) ? '[' : '{';
    const close = Array.isArray(v) ? ']' : '}';

    if (entries.length === 0) {
      return (
        <div className="designer-json-line" style={indent}>
          {keyName !== undefined && <><span className="designer-json-key">"{keyName}"</span><span>: </span></>}
          <span className="designer-json-brace">{open}{close}</span>
          {comma}
        </div>
      );
    }

    return (
      <>
        <div className="designer-json-line" style={indent}>
          <button
            type="button"
            className="designer-json-fold-btn"
            onClick={() => onToggle(path)}
            aria-label={isCollapsed ? expandLabel : collapseLabel}
            title={isCollapsed ? expandLabel : collapseLabel}
          >
            {isCollapsed ? '▶' : '▼'}
          </button>
          {keyName !== undefined && <><span className="designer-json-key">"{keyName}"</span><span>: </span></>}
          <span className="designer-json-brace">{open}</span>
          {isCollapsed && (
            <>
              <span className="designer-json-collapsed-summary">{Array.isArray(v) ? `${entries.length} items` : `${entries.length} keys`}</span>
              <span className="designer-json-brace">{close}</span>
              {comma}
            </>
          )}
        </div>
        {!isCollapsed && entries.map(([k, child], index) =>
          renderNode(child, `${path}.${k}`, depth + 1, Array.isArray(v) ? undefined : k, index === entries.length - 1)
        )}
        {!isCollapsed && (
          <div className="designer-json-line" style={indent}>
            <span className="designer-json-brace">{close}</span>
            {comma}
          </div>
        )}
      </>
    );
  };

  return <div className="designer-json-fold-view">{renderNode(value, 'root', 0, undefined, true)}</div>;
}

function parseOntologyFromJson(jsonText: string): Ontology {
  const parsed: unknown = JSON.parse(jsonText);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JSON root object');
  }

  const maybeWithOntology = parsed as { ontology?: unknown };
  const candidate = typeof maybeWithOntology.ontology === 'object' && maybeWithOntology.ontology
    ? maybeWithOntology.ontology
    : parsed;

  if (!candidate || typeof candidate !== 'object') {
    throw new Error('Invalid ontology JSON object');
  }

  const ontology = candidate as Partial<Ontology>;
  if (!Array.isArray(ontology.entityTypes) || !Array.isArray(ontology.relationships)) {
    throw new Error('Invalid ontology structure. Required arrays: entityTypes, relationships');
  }

  return {
    name: ontology.name ?? 'Imported Ontology',
    description: ontology.description ?? '',
    entityTypes: ontology.entityTypes,
    relationships: ontology.relationships,
  };
}

function JsonPreview({ ontology }: JsonPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const jsonHighlightRef = useRef<HTMLPreElement>(null);
  const loadDraft = useDesignerStore((s) => s.loadDraft);
  const { t } = useI18n();
  const darkMode = useAppStore((s) => s.darkMode);

  const jsonOutput = useMemo(() => JSON.stringify(ontology, null, 2), [ontology]);
  const jsonValue = useMemo(() => JSON.parse(jsonOutput) as JsonValue, [jsonOutput]);
  const jsonTheme = darkMode ? JSON_HIGHLIGHT_DARK : JSON_HIGHLIGHT_LIGHT;
  const highlightedEditJson = useMemo(() => highlightJson(jsonText || ' ', jsonTheme), [jsonText, jsonTheme]);

  const toggleNode = useCallback((path: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleCollapseAll = () => {
    setCollapsedNodes(new Set(['root.entityTypes', 'root.relationships']));
  };

  const handleExpandAll = () => {
    setCollapsedNodes(new Set());
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonOutput).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExportJson = () => {
    try {
      const json = JSON.stringify(ontology, null, 2) + '\n';
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ontology.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'ontology'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore export failures
    }
  };

  const handleSave = () => {
    const trimmed = jsonText.trim();
    if (!trimmed) {
      setJsonError(t('designer.preview.json.error_empty'));
      return;
    }
    try {
      const parsedOntology = parseOntologyFromJson(trimmed);
      loadDraft(parsedOntology);
      setEditMode(false);
      setJsonText('');
      setJsonError(null);
    } catch {
      setJsonError(t('designer.preview.json.error_parse'));
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setJsonText('');
    setJsonError(null);
  };

  return (
    <div className="designer-rdf-container">
      <div className="designer-rdf-toolbar">
        {editMode ? (
          <>
            <button className="designer-add-btn small" onClick={handleSave}>
              {t('designer.preview.json.save')}
            </button>
            <button className="designer-add-btn small secondary" onClick={handleCancel}>
              {t('designer.preview.cancel')}
            </button>
          </>
        ) : (
          <>
            <button className="designer-add-btn small" onClick={handleExportJson} title={t('designer.toolbar.export_json_title')}>
              <Download size={12} /> {t('designer.toolbar.export_json')}
            </button>
            <button className="designer-add-btn small" onClick={() => { setEditMode(true); setJsonText(jsonOutput); }}>
              {t('designer.preview.json.edit')}
            </button>
            <button className="designer-add-btn small secondary" onClick={handleCollapseAll}>
              {t('designer.preview.json.collapse_all')}
            </button>
            <button className="designer-add-btn small secondary" onClick={handleExpandAll}>
              {t('designer.preview.json.expand_all')}
            </button>
            <button className="designer-add-btn small" onClick={handleCopy}>
              {copied ? t('designer.preview.copied') : t('designer.preview.json.copy')}
            </button>
          </>
        )}
      </div>
      {jsonError && (
        <div className="designer-import-error">{jsonError}</div>
      )}
      {editMode ? (
        <div className="designer-code-edit-wrap">
          <pre ref={jsonHighlightRef} className="designer-rdf-source designer-code-highlight-layer">{highlightedEditJson}</pre>
          <textarea
            className="designer-rdf-source designer-rdf-textarea designer-code-input-overlay"
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setJsonError(null); }}
            onScroll={(e) => {
              if (jsonHighlightRef.current) {
                jsonHighlightRef.current.scrollTop = e.currentTarget.scrollTop;
                jsonHighlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
              }
            }}
            placeholder={t('designer.preview.json.placeholder')}
            autoFocus
            spellCheck={false}
          />
        </div>
      ) : (
        <div className="designer-rdf-source">
          <JsonFoldTree
            value={jsonValue}
            collapsed={collapsedNodes}
            onToggle={toggleNode}
            expandLabel={t('designer.common.expand')}
            collapseLabel={t('designer.common.collapse')}
          />
        </div>
      )}
    </div>
  );
}
