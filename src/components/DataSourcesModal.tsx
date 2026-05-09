import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Database, Table, BarChart3, Cloud } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useI18n } from '../i18n';
import type { DataBinding, EntityType } from '../data/ontology';

interface DataSourcesModalProps {
  onClose: () => void;
  initialEntityTypeId?: string;
  entityTypes?: EntityType[];
}

export function DataSourcesModal({ onClose, initialEntityTypeId, entityTypes }: DataSourcesModalProps) {
  const { currentOntology, dataBindings, upsertDataBinding, removeDataBinding } = useAppStore();
  const { t } = useI18n();
  const activeEntityTypes = entityTypes ?? currentOntology.entityTypes;
  const [entityTypeId, setEntityTypeId] = useState('');
  const [source, setSource] = useState('OneLake');
  const [table, setTable] = useState('');
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});

  const selectedEntity = useMemo(
    () => activeEntityTypes.find((e) => e.id === entityTypeId) ?? null,
    [activeEntityTypes, entityTypeId],
  );

  useEffect(() => {
    if (!activeEntityTypes.length) return;
    if (!entityTypeId && initialEntityTypeId && activeEntityTypes.some((e) => e.id === initialEntityTypeId)) {
      setEntityTypeId(initialEntityTypeId);
      return;
    }
    if (!entityTypeId) {
      setEntityTypeId(activeEntityTypes[0].id);
    }
  }, [activeEntityTypes, entityTypeId, initialEntityTypeId]);

  useEffect(() => {
    if (!selectedEntity) return;
    const existing = dataBindings.find((b) => b.entityTypeId === selectedEntity.id);
    if (existing) {
      setSource(existing.source);
      setTable(existing.table);
      setColumnMappings(existing.columnMappings);
      return;
    }
    setSource('MySQL');
    setTable(`mysql.${selectedEntity.id}`);
    const defaults: Record<string, string> = {};
    for (const prop of selectedEntity.properties) defaults[prop.name] = prop.name;
    setColumnMappings(defaults);
  }, [selectedEntity, dataBindings]);

  const handleSaveBinding = () => {
    if (!selectedEntity) return;
    const cleanedMappings: Record<string, string> = {};
    for (const [prop, col] of Object.entries(columnMappings)) {
      if (col.trim()) cleanedMappings[prop] = col.trim();
    }
    const nextBinding: DataBinding = {
      entityTypeId: selectedEntity.id,
      source: source.trim() || 'MySQL',
      table: table.trim() || `mysql.${selectedEntity.id}`,
      columnMappings: cleanedMappings,
    };
    upsertDataBinding(nextBinding);
  };

  const handleRemoveBinding = () => {
    if (!selectedEntity) return;
    removeDataBinding(selectedEntity.id);
  };
  
  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 750, maxHeight: '85vh', overflow: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 600 }}>{t('datasources.title')}</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
              {t('datasources.subtitle')}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* OneLake Overview */}
        <div style={{ 
          padding: 20, 
          background: 'linear-gradient(135deg, rgba(0, 120, 212, 0.1), rgba(92, 45, 145, 0.1))',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ 
            width: 56, 
            height: 56, 
            background: 'var(--ms-blue)', 
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Cloud size={28} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{t('datasources.onelake')}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {t('datasources.onelake_desc')}
            </div>
          </div>
        </div>

        {/* Bindings Grid */}
        <div style={{
          padding: 16,
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            {t('datasources.mapping_editor_title')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              {t('datasources.entity_type')}
              <select
                value={entityTypeId}
                onChange={(e) => setEntityTypeId(e.target.value)}
                style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}
              >
                {activeEntityTypes.map((entity) => (
                  <option key={entity.id} value={entity.id}>{entity.icon} {entity.name}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              {t('datasources.source_type')}
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}
              >
                <option value="OneLake">OneLake</option>
                <option value="PowerBI">Power BI</option>
                <option value="MySQL">MySQL</option>
              </select>
            </label>
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
            {t('datasources.source_table')}
            <input
              value={table}
              onChange={(e) => setTable(e.target.value)}
              placeholder="mysql.database.table"
              style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}
            />
          </label>
          {selectedEntity && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              {selectedEntity.properties.map((prop) => (
                <div key={prop.name} style={{ display: 'contents' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', alignSelf: 'center' }}>{prop.name}</div>
                  <input
                    value={columnMappings[prop.name] ?? ''}
                    onChange={(e) => setColumnMappings((prev) => ({ ...prev, [prop.name]: e.target.value }))}
                    placeholder={prop.name}
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  />
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleSaveBinding}>{t('datasources.save_mapping')}</button>
            <button className="btn btn-secondary" onClick={handleRemoveBinding}>{t('datasources.remove_mapping')}</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {dataBindings.map((binding) => {
            const entity = activeEntityTypes.find(e => e.id === binding.entityTypeId);
            if (!entity) return null;

            const isLakehouse = binding.source === 'OneLake';
            const isPowerBI = binding.source === 'PowerBI';
            const isMySQL = binding.source === 'MySQL';

            return (
              <div key={binding.entityTypeId} className="binding-card" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 44, 
                      height: 44, 
                      background: entity.color + '20',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22
                    }}>
                      {entity.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{entity.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {t('datasources.properties_mapped', { count: entity.properties.length })}
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6,
                    padding: '4px 10px',
                    background: isLakehouse ? 'rgba(0, 120, 212, 0.15)' : isMySQL ? 'rgba(16, 124, 16, 0.15)' : 'rgba(255, 185, 0, 0.15)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: isLakehouse ? 'var(--ms-blue)' : isMySQL ? 'var(--ms-green)' : 'var(--ms-yellow)'
                  }}>
                    {isLakehouse ? <Table size={14} /> : isMySQL ? <Database size={14} /> : <BarChart3 size={14} />}
                    {isMySQL ? t('datasources.source_mysql') : isPowerBI ? t('datasources.source_powerbi') : t('datasources.source_lakehouse')}
                  </div>
                </div>

                <div style={{ 
                  padding: 12, 
                  background: 'var(--bg-primary)', 
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Database size={14} color="var(--text-tertiary)" />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('datasources.source_table')}</span>
                  </div>
                  <code style={{ 
                    fontSize: 13, 
                    color: 'var(--ms-cyan)', 
                    fontFamily: 'var(--font-mono)',
                    wordBreak: 'break-all'
                  }}>
                    {binding.table}
                  </code>
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>
                  {t('datasources.column_mappings')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px 12px', fontSize: 13 }}>
                  <div style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>{t('datasources.property')}</div>
                  <div></div>
                  <div style={{ color: 'var(--text-tertiary)', fontWeight: 600, textAlign: 'right' }}>{t('datasources.column')}</div>
                  {Object.entries(binding.columnMappings).map(([prop, column]) => (
                    <>
                      <div key={`${prop}-prop`} style={{ color: 'var(--text-primary)' }}>{prop}</div>
                      <div key={`${prop}-arrow`} style={{ color: 'var(--text-tertiary)' }}>→</div>
                      <div key={`${prop}-col`} style={{ color: 'var(--ms-cyan)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{column}</div>
                    </>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Unbound entities notice */}
          <div style={{ 
            padding: 16, 
            background: 'var(--bg-tertiary)', 
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
              <strong>{t('datasources.other_entities_label')}</strong> {t('datasources.other_entities_value')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              {t('datasources.demo_note')}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button className="btn btn-primary" onClick={onClose}>
            {t('datasources.close')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
