import { useState, useEffect } from 'react';
import { useDesignerStore } from '../../store/designerStore';
import { useI18n } from '../../i18n';

const CATEGORIES = [
  'retail',
  'healthcare',
  'finance',
  'manufacturing',
  'education',
  'food',
  'media',
  'events',
  'general',
  'iq-lab',
  'school',
  'fibo',
] as const;

export function MetadataForm() {
  const metadata = useDesignerStore((s) => s.metadata);
  const updateMetadata = useDesignerStore((s) => s.updateMetadata);
  const { t } = useI18n();

  // Local raw-text state so trailing commas aren't stripped while the user types
  const [tagsText, setTagsText] = useState(() => metadata.tags.join(', '));
  const [dictionaryText, setDictionaryText] = useState(() => metadata.relationshipNameDictionary.join(', '));

  // Sync from store when changed externally (e.g. after ZIP load)
  useEffect(() => {
    setTagsText(metadata.tags.join(', '));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata.tags.join(',')]);

  useEffect(() => {
    setDictionaryText(metadata.relationshipNameDictionary.join(', '));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata.relationshipNameDictionary.join(',')]);

  return (
    <div className="designer-relationship-list" style={{ marginBottom: 12 }}>
      <div className="designer-section-header">
        <h3>{t('designer.metadata.title')}</h3>
      </div>

      <div className="designer-rel-card" style={{ cursor: 'default' }}>
        <div className="designer-rel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label className="designer-field">
            <span>{t('designer.metadata.icon')}</span>
            <input
              type="text"
              value={metadata.icon}
              onChange={(e) => updateMetadata({ icon: e.target.value })}
              placeholder={t('designer.metadata.icon_placeholder')}
            />
          </label>

          <label className="designer-field">
            <span>{t('designer.metadata.category')}</span>
            <select
              value={metadata.category}
              onChange={(e) => updateMetadata({ category: e.target.value })}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>

          <label className="designer-field">
            <span>{t('designer.metadata.tags')}</span>
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              onBlur={() => {
                const tags = tagsText.split(',').map((v) => v.trim()).filter(Boolean);
                updateMetadata({ tags });
                setTagsText(tags.join(', '));
              }}
              placeholder={t('designer.metadata.tags_placeholder')}
            />
          </label>

          <label className="designer-field">
            <span>{t('designer.metadata.author')}</span>
            <input
              type="text"
              value={metadata.author}
              onChange={(e) => updateMetadata({ author: e.target.value })}
              placeholder={t('designer.metadata.author_placeholder')}
            />
          </label>

          <label className="designer-field">
            <span>{t('designer.metadata.relationship_dictionary')}</span>
            <input
              type="text"
              value={dictionaryText}
              onChange={(e) => setDictionaryText(e.target.value)}
              onBlur={() => {
                const relationshipNameDictionary = dictionaryText.split(',').map((v) => v.trim()).filter(Boolean);
                updateMetadata({ relationshipNameDictionary });
                setDictionaryText(relationshipNameDictionary.join(', '));
              }}
              placeholder={t('designer.metadata.relationship_dictionary_placeholder')}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
