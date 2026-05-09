import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { useDesignerStore } from '../../store/designerStore';
import type { Relationship } from '../../data/ontology';
import { useI18n } from '../../i18n';

const CARDINALITY_OPTIONS: Relationship['cardinality'][] = [
  'one-to-one', 'one-to-many', 'many-to-one', 'many-to-many',
];

const CARDINALITY_LABELS: Record<Relationship['cardinality'], string> = {
  'one-to-one': '1 : 1',
  'one-to-many': '1 : N',
  'many-to-one': 'N : 1',
  'many-to-many': 'N : N',
};

export function RelationshipForm() {
  const {
    ontology,
    metadata,
    selectedRelationshipId,
    addRelationship,
    updateRelationship,
    removeRelationship,
    selectRelationship,
    addRelationshipAttribute,
    updateRelationshipAttribute,
    removeRelationshipAttribute,
  } = useDesignerStore();

  const entities = ontology.entityTypes;
  const { t } = useI18n();

  const relationshipNameOptions = useMemo(() => {
    const options = metadata.relationshipNameDictionary.length > 0
      ? metadata.relationshipNameDictionary
      : ['relates_to'];
    return Array.from(new Set(options));
  }, [metadata.relationshipNameDictionary]);

  const handleAdd = () => {
    if (entities.length < 2) return;
    addRelationship(entities[0].id, entities[1].id);
  };

  return (
    <div className="designer-relationship-list">
      <div className="designer-section-header">
        <h3>{t('designer.relationship.title', { count: ontology.relationships.length })}</h3>
        <button
          className="designer-add-btn"
          onClick={handleAdd}
          disabled={entities.length < 2}
          title={entities.length < 2 ? t('designer.relationship.need_two_entities') : t('designer.relationship.add_title')}
        >
          <Plus size={14} /> {t('designer.common.add')}
        </button>
      </div>

      {ontology.relationships.length === 0 && (
        <div className="designer-empty">
          {entities.length < 2
            ? t('designer.relationship.empty_need_two_entities')
            : t('designer.relationship.empty')}
        </div>
      )}

      {ontology.relationships.map((rel) => {
        const isSelected = selectedRelationshipId === rel.id;
        const fromEntity = entities.find((e) => e.id === rel.from);
        const toEntity = entities.find((e) => e.id === rel.to);

        return (
          <div
            key={rel.id}
            className={`designer-rel-card ${isSelected ? 'selected' : ''}`}
          >
            <div className="designer-rel-header" onClick={() => selectRelationship(isSelected ? null : rel.id)}>
              <button className="designer-expand-btn" aria-label={isSelected ? t('designer.common.collapse') : t('designer.common.expand')}>
                {isSelected ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              <span className="designer-rel-flow">
                {fromEntity?.icon ?? '?'} {fromEntity?.name ?? '???'}
                <span className="designer-rel-arrow"> → </span>
                {toEntity?.icon ?? '?'} {toEntity?.name ?? '???'}
              </span>
              <button
                className="designer-delete-btn"
                onClick={(e) => { e.stopPropagation(); removeRelationship(rel.id); }}
                title={t('designer.relationship.delete')}
              >
                <Trash2 size={14} />
              </button>
            </div>

            {isSelected && (
              <div className="designer-rel-body">
                {rel.from === rel.to && (
                  <div className="designer-field-hint error" style={{ marginBottom: 8 }}>
                    {t('designer.relationship.self_reference_warning')}
                  </div>
                )}
                {/* Name */}
                <label className="designer-field">
                  <span>{t('designer.common.name')}</span>
                  <select
                    value={rel.name}
                    onChange={(e) => updateRelationship(rel.id, { name: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!relationshipNameOptions.includes(rel.name) && (
                      <option value={rel.name}>{rel.name}</option>
                    )}
                    {relationshipNameOptions.map((nameOption) => (
                      <option key={nameOption} value={nameOption}>{nameOption}</option>
                    ))}
                  </select>
                </label>

                {/* Source / Target */}
                <div className="designer-field-row">
                  <label className="designer-field">
                    <span>{t('designer.relationship.from')}</span>
                    <select
                      value={rel.from}
                      onChange={(e) => updateRelationship(rel.id, { from: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {entities.map((e) => (
                        <option key={e.id} value={e.id}>{e.icon} {e.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="designer-field">
                    <span>{t('designer.relationship.to')}</span>
                    <select
                      value={rel.to}
                      onChange={(e) => updateRelationship(rel.id, { to: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {entities.map((e) => (
                        <option key={e.id} value={e.id}>{e.icon} {e.name}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Cardinality */}
                <label className="designer-field">
                  <span>{t('designer.relationship.cardinality')}</span>
                  <select
                    value={rel.cardinality}
                    onChange={(e) =>
                      updateRelationship(rel.id, { cardinality: e.target.value as Relationship['cardinality'] })
                    }
                    onClick={(e) => e.stopPropagation()}
                  >
                    {CARDINALITY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{CARDINALITY_LABELS[c]}</option>
                    ))}
                  </select>
                </label>

                {/* Description */}
                <label className="designer-field">
                  <span>{t('designer.common.description')}</span>
                  <textarea
                    rows={2}
                    value={rel.description ?? ''}
                    onChange={(e) => updateRelationship(rel.id, { description: e.target.value })}
                    placeholder={t('designer.relationship.description_placeholder')}
                  />
                </label>

                {/* Attributes */}
                <div className="designer-field">
                  <div className="designer-section-header">
                    <span>{t('designer.relationship.attributes_title', { count: rel.attributes?.length ?? 0 })}</span>
                    <button
                      className="designer-add-btn small"
                      onClick={() => addRelationshipAttribute(rel.id)}
                    >
                      <Plus size={12} /> {t('designer.common.add')}
                    </button>
                  </div>
                  {(rel.attributes ?? []).map((attr, idx) => (
                    <div key={idx} className="designer-property-row">
                      <input
                        className="designer-prop-name"
                        type="text"
                        value={attr.name}
                        onChange={(e) =>
                          updateRelationshipAttribute(rel.id, idx, { name: e.target.value })
                        }
                        placeholder={t('designer.relationship.attribute_name_placeholder')}
                      />
                      <input
                        className="designer-prop-type"
                        type="text"
                        value={attr.type}
                        onChange={(e) =>
                          updateRelationshipAttribute(rel.id, idx, { type: e.target.value })
                        }
                        placeholder={t('designer.relationship.attribute_type_placeholder')}
                      />
                      <button
                        className="designer-delete-btn small"
                        onClick={() => removeRelationshipAttribute(rel.id, idx)}
                        title={t('designer.relationship.attribute_remove')}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
