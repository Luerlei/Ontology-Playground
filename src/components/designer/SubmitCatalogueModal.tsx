import { useState } from 'react';
import { X, Github, ExternalLink, Download, Check } from 'lucide-react';
import JSZip from 'jszip';
import { useDesignerStore } from '../../store/designerStore';
import { serializeToRDF } from '../../lib/rdf/serializer';
import { useI18n } from '../../i18n';

interface SubmitCatalogueModalProps {
  onClose: () => void;
}

const REPO_URL = 'https://github.com/microsoft/Ontology-Playground';

export function SubmitCatalogueModal({ onClose }: SubmitCatalogueModalProps) {
  const { ontology, metadata } = useDesignerStore((s) => ({ ontology: s.ontology, metadata: s.metadata }));
  const [downloaded, setDownloaded] = useState(false);
  const [zipDownloaded, setZipDownloaded] = useState(false);
  const { t } = useI18n();
  const slug = ontology.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ontology';

  const handleDownloadRdf = () => {
    const rdf = serializeToRDF(ontology, []);
    const blob = new Blob([rdf], { type: 'application/rdf+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.rdf`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify({ ontology, bindings: [] }, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMetadata = () => {
    const metadataPayload = {
      name: ontology.name,
      description: ontology.description,
      icon: metadata.icon || '📦',
      category: metadata.category || 'general',
      tags: metadata.tags ?? [],
      author: metadata.author || '',
      relationshipNameDictionary: metadata.relationshipNameDictionary ?? [],
    };
    const blob = new Blob([JSON.stringify(metadataPayload, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'metadata.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    const rdf = serializeToRDF(ontology, []);
    const jsonContent = JSON.stringify({ ontology, bindings: [] }, null, 2) + '\n';
    const metadataPayload = {
      name: ontology.name,
      description: ontology.description,
      icon: metadata.icon || '📦',
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-catalogue-package.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setZipDownloaded(true);
    setTimeout(() => setZipDownloaded(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content submit-catalogue-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        <h2 className="modal-title">
          <Github size={20} /> {t('designer.submit.title')}
        </h2>

        <div className="submit-step">
          <p className="submit-description">
            {t('designer.submit.description_prefix')}{' '}
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              {t('designer.submit.repo_link')} <ExternalLink size={12} />
            </a>.
          </p>

          <div className="submit-instructions">
            <h3>{t('designer.submit.how_to')}</h3>
            <ol>
              <li>{t('designer.submit.step1')}</li>
              <li>
                <a href={`${REPO_URL}/fork`} target="_blank" rel="noopener noreferrer">
                  {t('designer.submit.step2_link')} <ExternalLink size={12} />
                </a>
              </li>
              <li>
                {t('designer.submit.step3_prefix')}{' '}
                <code>catalogue/community/your-username/</code>
              </li>
              <li>{t('designer.submit.step4')}</li>
              <li>{t('designer.submit.step5')}</li>
            </ol>
          </div>

          <div className="submit-download-actions">
            <button className="designer-action-btn primary" onClick={handleDownloadRdf}>
              <Download size={14} /> {t('designer.submit.download_rdf')}
              {downloaded && <Check size={14} style={{ marginLeft: 4 }} />}
            </button>
            <button className="designer-action-btn secondary" onClick={handleDownloadJson}>
              <Download size={14} /> {t('designer.submit.download_json')}
            </button>
            <button className="designer-action-btn secondary" onClick={handleDownloadMetadata}>
              <Download size={14} /> {t('designer.submit.download_metadata')}
            </button>
            <button className="designer-action-btn secondary" onClick={() => { void handleDownloadZip(); }}>
              <Download size={14} /> {t('designer.submit.download_zip')}
              {zipDownloaded && <Check size={14} style={{ marginLeft: 4 }} />}
            </button>
          </div>

          <div className="submit-form-actions">
            <button className="designer-action-btn secondary" onClick={onClose}>{t('designer.common.close')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
