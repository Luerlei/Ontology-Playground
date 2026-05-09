import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Layers, Plus, Search } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../types/catalogue';
import type { CatalogueEntry } from '../types/catalogue';
import { useI18n } from '../i18n';
import { fetchCatalogueDynamic } from '../lib/catalogueApi';

interface ModelCataloguePanelProps {
  onCreateModel?: () => void;
}

export function ModelCataloguePanel({ onCreateModel }: ModelCataloguePanelProps) {
  const loadOntology = useAppStore((s) => s.loadOntology);
  const { t } = useI18n();
  const [entries, setEntries] = useState<CatalogueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  // Removed manual refresh state
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<CatalogueEntry['source'], boolean>>({
    official: false,
    community: false,
    external: false,
  });

  const sourceLabels: Record<CatalogueEntry['source'], string> = {
    official: t('left.model.source.official'),
    community: t('left.model.source.community'),
    external: t('left.model.source.external'),
  };

  useEffect(() => {
    let disposed = false;

    const loadCatalogue = async (isInitial: boolean) => {
      try {
        if (isInitial) {
          setLoading(true);
        }
        if (!disposed) {
          setError(null);
        }
        const data = await fetchCatalogueDynamic();
        if (disposed) return;
        setEntries(data.entries);
      } catch (e) {
        if (disposed) return;
        setError(e instanceof Error ? e.message : t('left.model.load_failed_generic'));
      } finally {
        if (!disposed && isInitial) setLoading(false);
      }
    };

    void loadCatalogue(true);

    const timer = window.setInterval(() => {
      void loadCatalogue(false);
    }, 8000);

    const onFocus = () => {
      void loadCatalogue(false);
    };
    window.addEventListener('focus', onFocus);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) => {
      const haystack = `${entry.name} ${entry.description} ${entry.author} ${entry.tags.join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [entries, query]);

  const grouped = useMemo(() => {
    const base: Record<CatalogueEntry['source'], CatalogueEntry[]> = {
      official: [],
      community: [],
      external: [],
    };
    for (const entry of filtered) {
      base[entry.source].push(entry);
    }
    return base;
  }, [filtered]);

  // Removed manual refresh handler

  return (
    <div className="model-catalogue-panel">
      <div className="model-catalogue-controls-row">
        <div className="model-catalogue-search-wrap">
          <Search size={14} className="model-catalogue-search-icon" />
          <input
            className="model-catalogue-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('left.model.search_placeholder')}
          />
        </div>
        <button
          className="model-catalogue-create-btn"
          onClick={() => onCreateModel?.()}
          title={t('left.model.create_new')}
          aria-label={t('left.model.create_new')}
        >
          <Plus size={14} />
        </button>
        {/* Removed manual refresh button */}
      </div>

      {loading && <div className="model-catalogue-empty">{t('left.model.loading')}</div>}
      {error && <div className="model-catalogue-empty error">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="model-catalogue-empty">{t('left.model.no_match')}</div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="model-catalogue-list">
          {(Object.keys(grouped) as CatalogueEntry['source'][]).map((source) => {
            const items = grouped[source];
            if (items.length === 0) return null;
            const collapsed = collapsedGroups[source];

            return (
              <div key={source} className="model-group">
                <button
                  className="model-group-header"
                  onClick={() => setCollapsedGroups((prev) => ({ ...prev, [source]: !prev[source] }))}
                  aria-expanded={!collapsed}
                >
                  <span className="model-group-title-wrap">
                    {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                    <span className="model-group-title">{sourceLabels[source]}</span>
                  </span>
                  <span className="model-group-count">{t('left.model.group_count', { count: items.length })}</span>
                </button>

                {!collapsed && (
                  <div className="model-group-list">
                    {items.map((entry) => {
                      const isActive = activeId === entry.id;
                      return (
                        <button
                          key={entry.id}
                          className={`model-card ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            loadOntology(entry.ontology, entry.bindings);
                            setActiveId(entry.id);
                          }}
                          title={t('left.model.load_model', { name: entry.name })}
                        >
                          <div className="model-card-header">
                            <div className="model-card-title-wrap">
                              <span className="model-card-icon">{entry.icon ?? '📦'}</span>
                              <span className="model-card-title">{entry.name}</span>
                            </div>
                          </div>

                          <div className="model-card-badges">
                            <span
                              className="model-card-type"
                              style={{ color: CATEGORY_COLORS[entry.category] ?? '#6B7280' }}
                            >
                              {t('left.model.type')}: {CATEGORY_LABELS[entry.category] ?? entry.category}
                            </span>
                          </div>

                          {entry.tags.length > 0 ? (
                            <div className="model-card-tags">
                              {entry.tags.map((tag) => (
                                <span key={`${entry.id}-${tag}`} className="model-card-tag">{tag}</span>
                              ))}
                            </div>
                          ) : (
                            <div className="model-card-no-tags">{t('left.model.no_tags')}</div>
                          )}

                          {entry.notes?.trim() && (
                            <div className="model-card-notes" title={entry.notes}>
                              <span className="model-card-notes-label">{t('left.model.notes')}:</span>
                              <span className="model-card-notes-text">{entry.notes}</span>
                            </div>
                          )}

                          <div className="model-card-meta">
                            <span><Layers size={12} /> {entry.ontology.entityTypes.length}</span>
                            <span>↔ {entry.ontology.relationships.length}</span>
                            <span>{t('left.model.by_author', { author: entry.author || t('left.model.unknown_author') })}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
