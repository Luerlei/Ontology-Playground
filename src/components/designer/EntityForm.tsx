import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical, Key, Database, Asterisk } from 'lucide-react';
import { useDesignerStore, ENTITY_COLORS, ENTITY_ICONS, fabricIQNameError } from '../../store/designerStore';
import type { Property } from '../../data/ontology';
import { useI18n } from '../../i18n';
import { DataSourcesModal } from '../DataSourcesModal';

const PROPERTY_TYPES: Property['type'][] = [
  'string', 'integer', 'decimal', 'double', 'date', 'datetime', 'boolean', 'enum',
];

// Separate component so it can have its own local state (prevents trailing-comma stripping)
function EnumValuesField({ values, onCommit, placeholder }: { values: string[]; onCommit: (v: string[]) => void; placeholder: string }) {
  const [raw, setRaw] = useState(values.join(', '));

  // Sync from outside only when the array reference actually changes (e.g. ZIP load)
  useEffect(() => {
    setRaw(values.join(', '));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.join(',')]);

  return (
    <input
      type="text"
      value={raw}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={() => {
        const parsed = raw.split(',').map((v) => v.trim()).filter(Boolean);
        onCommit(parsed);
        setRaw(parsed.join(', '));
      }}
      placeholder={placeholder}
    />
  );
}

export function EntityForm() {
  const {
    ontology,
    selectedEntityId,
    addEntity,
    updateEntity,
    removeEntity,
    addProperty,
    updateProperty,
    removeProperty,
    moveProperty,
  } = useDesignerStore();

  const [expandedEntityId, setExpandedEntityId] = useState<string | null>(null);
  const [bindingEntityId, setBindingEntityId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const { t } = useI18n();

  // When an entity is selected externally (e.g. graph click), expand it and scroll to it
  useEffect(() => {
    if (selectedEntityId) {
      setExpandedEntityId(selectedEntityId);
      // Delay scroll slightly so the card expands first
      requestAnimationFrame(() => {
        cardRefs.current.get(selectedEntityId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    } else {
      setExpandedEntityId(null);
    }
  }, [selectedEntityId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddEntity = () => {
    addEntity();
    // Auto-expand the new entity (prepended at index 0)
    const latest = useDesignerStore.getState().ontology.entityTypes;
    if (latest.length > 0) {
      const newId = latest[0].id;
      setExpandedEntityId(newId);
    }
  };

  return (
    <div className="designer-entity-list">
      <div className="designer-section-header">
        <h3>{t('designer.entity.title', { count: ontology.entityTypes.length })}</h3>
        <button className="designer-add-btn" onClick={handleAddEntity} title={t('designer.entity.add_title')}>
          <Plus size={14} /> {t('designer.common.add')}
        </button>
      </div>

      {ontology.entityTypes.length === 0 && (
        <div className="designer-empty">{t('designer.entity.empty')}</div>
      )}

      {ontology.entityTypes.map((entity) => {
        const isExpanded = expandedEntityId === entity.id;
        const isSelected = selectedEntityId === entity.id;

        return (
          <div
            key={entity.id}
            ref={(el) => { if (el) cardRefs.current.set(entity.id, el); else cardRefs.current.delete(entity.id); }}
            className={`designer-entity-card ${isSelected ? 'selected' : ''}`}
          >
            {/* Header row */}
            <div
              className="designer-entity-header"
              onClick={() => {
                setExpandedEntityId(isExpanded ? null : entity.id);
              }}
            >
              <button className="designer-expand-btn" aria-label={isExpanded ? t('designer.common.collapse') : t('designer.common.expand')}>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              <span
                className="designer-entity-icon"
                style={{ backgroundColor: entity.color + '30', color: entity.color }}
              >
                {entity.icon}
              </span>
              <span className="designer-entity-name">{entity.name || t('designer.entity.unnamed')}</span>
              <span className="designer-entity-badge">{t('designer.entity.props_badge', { count: entity.properties.length })}</span>
              <button
                className="designer-delete-btn"
                onClick={(e) => { e.stopPropagation(); setBindingEntityId(entity.id); }}
                title={t('designer.entity.bind_data')}
              >
                <Database size={14} />
              </button>
              <button
                className="designer-delete-btn"
                onClick={(e) => { e.stopPropagation(); removeEntity(entity.id); }}
                title={t('designer.entity.delete')}
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Expanded editor */}
            {isExpanded && (
              <div className="designer-entity-body">
                {/* Name */}
                <label className="designer-field">
                  <span>{t('designer.common.name')}</span>
                  <input
                    type="text"
                    value={entity.name}
                    onChange={(e) => updateEntity(entity.id, { name: e.target.value })}
                    placeholder={t('designer.entity.name_placeholder')}
                  />
                  {entity.name && fabricIQNameError('Entity type', entity.name) && (
                    <span className="designer-field-hint error">{fabricIQNameError('Entity type', entity.name)}</span>
                  )}
                </label>

                {/* Description */}
                <label className="designer-field">
                  <span>{t('designer.common.description')}</span>
                  <textarea
                    rows={2}
                    value={entity.description}
                    onChange={(e) => updateEntity(entity.id, { description: e.target.value })}
                    placeholder={t('designer.entity.description_placeholder')}
                  />
                </label>

                {/* Icon picker */}
                <div className="designer-field">
                  <span>{t('designer.entity.icon')}</span>
                  <div className="designer-icon-grid">
                    {ENTITY_ICONS.map((icon) => (
                      <button
                        key={icon}
                        className={`designer-icon-btn ${entity.icon === icon ? 'active' : ''}`}
                        onClick={() => updateEntity(entity.id, { icon })}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color picker */}
                <div className="designer-field">
                  <span>{t('designer.entity.color')}</span>
                  <div className="designer-color-grid">
                    {ENTITY_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`designer-color-btn ${entity.color === color ? 'active' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => updateEntity(entity.id, { color })}
                        aria-label={t('designer.entity.color_aria', { color })}
                      />
                    ))}
                  </div>
                </div>

                {/* Properties */}
                <div className="designer-field">
                  <div className="designer-section-header">
                    <span>{t('designer.entity.properties_title', { count: entity.properties.length })}</span>
                    <button
                      className="designer-add-btn small"
                      onClick={() => addProperty(entity.id)}
                    >
                      <Plus size={12} /> {t('designer.common.add')}
                    </button>
                  </div>

                  <div className="designer-property-list">
                    {entity.properties.map((prop, idx) => {
                      const propNameErr = prop.name ? fabricIQNameError('Property', prop.name) : null;
                      const idTypeErr = prop.isIdentifier && prop.type !== 'string' && prop.type !== 'integer'
                        ? `Identifier must be string or integer (currently ${prop.type}).`
                        : null;
                      return (
                      <div key={idx}>
                      <div className="designer-property-row">
                        <span
                          className="designer-grip"
                          title={t('designer.entity.drag_to_reorder')}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', String(idx));
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                            if (!isNaN(fromIdx) && fromIdx !== idx) {
                              moveProperty(entity.id, fromIdx, idx);
                            }
                          }}
                        >
                          <GripVertical size={12} />
                        </span>
                        <input
                          className="designer-prop-name"
                          type="text"
                          value={prop.name}
                          onChange={(e) => updateProperty(entity.id, idx, { name: e.target.value })}
                          placeholder={t('designer.entity.property_name_placeholder')}
                        />
                        <select
                          className="designer-prop-type"
                          value={prop.type}
                          onChange={(e) =>
                            updateProperty(entity.id, idx, { type: e.target.value as Property['type'] })
                          }
                        >
                          {PROPERTY_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <button
                          className={`designer-id-btn ${prop.isIdentifier ? 'active' : ''} ${idTypeErr ? 'warning' : ''}`}
                          onClick={() => updateProperty(entity.id, idx, { isIdentifier: !prop.isIdentifier })}
                          title={idTypeErr || (prop.isIdentifier ? t('designer.entity.identifier_remove') : t('designer.entity.identifier_mark'))}
                        >
                          <Key size={12} />
                        </button>
                        <button
                          className={`designer-required-btn ${prop.isRequired ? 'active' : ''}`}
                          onClick={() => updateProperty(entity.id, idx, { isRequired: !prop.isRequired })}
                          title={prop.isRequired ? t('designer.entity.required_unmark') : t('designer.entity.required_mark')}
                        >
                          <Asterisk size={12} />
                        </button>
                        <button
                          className="designer-delete-btn small"
                          onClick={() => removeProperty(entity.id, idx)}
                          title={t('designer.entity.property_remove')}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      {(propNameErr || idTypeErr) && (
                        <span className="designer-field-hint error">{propNameErr || idTypeErr}</span>
                      )}
                      {prop.type === 'enum' && (
                        <label className="designer-field designer-enum-values-field">
                          <span>{t('designer.entity.enum_values')}</span>
                          <EnumValuesField
                            values={prop.values ?? []}
                            onCommit={(values) => updateProperty(entity.id, idx, { values })}
                            placeholder={t('designer.entity.enum_values_placeholder')}
                          />
                        </label>
                      )}
                      </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {bindingEntityId && (
        <DataSourcesModal
          initialEntityTypeId={bindingEntityId}
          entityTypes={ontology.entityTypes}
          onClose={() => setBindingEntityId(null)}
        />
      )}
    </div>
  );
}
