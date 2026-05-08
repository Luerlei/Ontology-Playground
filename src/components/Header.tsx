import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { useRoute } from '../hooks/useRoute';
import { routeToHash } from '../lib/router';
import { encodeSharePayload } from '../lib/shareCodec';
import { serializeToRDF } from '../lib/rdf/serializer';
import { useI18n } from '../i18n';
import { Moon, Sun, Database, Trophy, HelpCircle, FileJson, LayoutGrid, Sparkles, FileText, Share2, PenTool, BookOpen, Menu, X, Download, Info, Languages } from 'lucide-react';

interface HeaderProps {
  onAboutClick: () => void;
  onHelpClick: () => void;
  onDataSourcesClick: () => void;
  onImportExportClick: () => void;
  onGalleryClick: () => void;
  onDesignerClick: () => void;
  onLearnClick: () => void;
  onNLBuilderClick?: () => void;
  onSummaryClick: () => void;
}

export function Header({ onAboutClick, onHelpClick, onDataSourcesClick, onImportExportClick, onGalleryClick, onDesignerClick, onLearnClick, onNLBuilderClick, onSummaryClick }: HeaderProps) {
  const { darkMode, toggleDarkMode, totalPoints, earnedBadges, currentOntology, dataBindings } = useAppStore();
  const { t, lang, setLang } = useI18n();
  const route = useRoute();
  const [shareStatus, setShareStatus] = useState<'idle' | 'copying' | 'copied' | 'downloaded'>('idle');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const ontologyDisplayName = currentOntology.name || 'Untitled Ontology';

  const shareableId = route.page === 'catalogue' && route.ontologyId ? route.ontologyId : null;

  const handleShare = async () => {
    if (shareStatus === 'copying') return;

    if (shareableId) {
      // Catalogue ontology — use the short deep link
      const url = `${window.location.origin}${window.location.pathname}#/catalogue/${shareableId}`;
      await navigator.clipboard.writeText(url);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
      return;
    }

    // Custom ontology — compress and encode into a share URL
    setShareStatus('copying');
    const encoded = await encodeSharePayload(currentOntology, dataBindings);
    if (encoded) {
      const url = `${window.location.origin}${window.location.pathname}#/share/${encoded}`;
      await navigator.clipboard.writeText(url);
      history.replaceState(null, '', routeToHash({ page: 'share', data: encoded }));
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } else {
      // Too large for URL — download the RDF file instead
      const content = serializeToRDF(currentOntology, dataBindings);
      const blob = new Blob([content], { type: 'application/rdf+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentOntology.name.toLowerCase().replace(/\s+/g, '-')}-ontology.rdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setShareStatus('downloaded');
      setTimeout(() => setShareStatus('idle'), 3000);
    }
  };

  const shareLabel = shareStatus === 'copied' ? t('header.share.copied') : shareStatus === 'downloaded' ? t('header.share.downloaded') : shareStatus === 'copying' ? t('header.share.encoding') : t('header.share');

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const menuAction = (fn: () => void) => () => { setMenuOpen(false); fn(); };

  return (
    <header className="header">
      <div className="header-logo">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="4" fill="#0078D4"/>
          <path d="M8 8H15V15H8V8Z" fill="white"/>
          <path d="M17 8H24V15H17V8Z" fill="white" opacity="0.7"/>
          <path d="M8 17H15V24H8V17Z" fill="white" opacity="0.7"/>
          <path d="M17 17H24V24H17V17Z" fill="white" opacity="0.5"/>
        </svg>
        <div>
          <span className="header-title">
            {t('header.title')} <span className="header-title-preview">{t('header.preview')}</span>
          </span>
          <span className="header-context">{ontologyDisplayName}</span>
        </div>
      </div>

      <div className="header-stats">
        <div className="stat-item">
          <Trophy size={18} />
          <span className="stat-value">{totalPoints}</span>
          <span>{t('header.points')}</span>
        </div>
        <div className="stat-item">
          <span style={{ fontSize: 18 }}>🏆</span>
          <span className="stat-value">{earnedBadges.length}</span>
          <span>{t('header.badges')}</span>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="header-text-btn"
          onClick={handleShare}
          title={shareableId ? t('header.share.tooltip.catalogue') : t('header.share.tooltip.custom')}
          style={shareStatus === 'copied' ? { color: 'var(--ms-green, #107C10)' } : shareStatus === 'downloaded' ? { color: 'var(--ms-blue, #0078D4)' } : undefined}
        >
          {shareStatus === 'downloaded' ? <Download size={16} /> : <Share2 size={16} />}
          <span>{shareLabel}</span>
        </button>
        <button className="header-text-btn" onClick={onSummaryClick} title={t('header.summary.tooltip')}>
          <FileText size={16} />
          <span>{t('header.summary')}</span>
        </button>
        {onNLBuilderClick && (
          <button className="icon-btn" onClick={onNLBuilderClick} data-tooltip={t('header.aibuilder')} aria-label={t('header.aibuilder')}>
            <Sparkles size={20} />
          </button>
        )}
        <button className="icon-btn" onClick={onGalleryClick} data-tooltip={t('header.catalogue')} aria-label={t('header.catalogue')}>
          <LayoutGrid size={20} />
        </button>
        <button className="icon-btn" onClick={onDesignerClick} data-tooltip={t('header.designer')} aria-label={t('header.designer')}>
          <PenTool size={20} />
        </button>
        <button className="icon-btn" onClick={onLearnClick} data-tooltip={t('header.school')} aria-label={t('header.school')}>
          <BookOpen size={20} />
        </button>
        <button className="icon-btn" onClick={onImportExportClick} data-tooltip={t('header.importexport')} aria-label={t('header.importexport')}>
          <FileJson size={20} />
        </button>
        <button className="icon-btn" onClick={onHelpClick} data-tooltip={t('header.help')} aria-label={t('header.help')}>
          <HelpCircle size={20} />
        </button>
        <button className="icon-btn" onClick={onAboutClick} data-tooltip={t('header.about')} aria-label={t('header.about')}>
          <Info size={20} />
        </button>
        <button className="icon-btn" onClick={onDataSourcesClick} data-tooltip={t('header.datasources')} aria-label={t('header.datasources')}>
          <Database size={20} />
        </button>
        <button className="icon-btn" onClick={toggleDarkMode} data-tooltip={darkMode ? t('header.lightmode') : t('header.darkmode')} aria-label={darkMode ? t('header.lightmode') : t('header.darkmode')}>
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          className="icon-btn"
          onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          data-tooltip={t('header.language')}
          aria-label={t('header.language')}
        >
          <Languages size={20} />
        </button>
      </div>

      {/* Mobile hamburger menu */}
      <div className="header-mobile-menu" ref={menuRef}>
        <button className="icon-btn header-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label={t('header.menu')}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        {menuOpen && (
          <div className="mobile-menu-dropdown">
            <div className="mobile-menu-stats">
              <Trophy size={16} />
              <span className="stat-value">{totalPoints}</span>
              <span>{t('header.points')}</span>
              <span style={{ margin: '0 8px', color: 'var(--text-tertiary)' }}>·</span>
              <span>🏆</span>
              <span className="stat-value">{earnedBadges.length}</span>
              <span>{t('header.badges')}</span>
            </div>
            <button className="mobile-menu-item" onClick={menuAction(handleShare)}>
              <Share2 size={18} /> {shareLabel}
            </button>
            <button className="mobile-menu-item" onClick={menuAction(onSummaryClick)}>
              <FileText size={18} /> {t('header.summary')}
            </button>
            {onNLBuilderClick && (
              <button className="mobile-menu-item" onClick={menuAction(onNLBuilderClick)}>
                <Sparkles size={18} /> {t('header.aibuilder')}
              </button>
            )}
            <button className="mobile-menu-item" onClick={menuAction(onGalleryClick)}>
              <LayoutGrid size={18} /> {t('header.catalogue')}
            </button>
            <button className="mobile-menu-item" onClick={menuAction(onDesignerClick)}>
              <PenTool size={18} /> {t('header.designer')}
            </button>
            <button className="mobile-menu-item" onClick={menuAction(onLearnClick)}>
              <BookOpen size={18} /> {t('header.school')}
            </button>
            <button className="mobile-menu-item" onClick={menuAction(onImportExportClick)}>
              <FileJson size={18} /> {t('header.importexport')}
            </button>
            <button className="mobile-menu-item" onClick={menuAction(onHelpClick)}>
              <HelpCircle size={18} /> {t('header.help')}
            </button>
            <button className="mobile-menu-item" onClick={menuAction(onAboutClick)}>
              <Info size={18} /> {t('header.about')}
            </button>
            <button className="mobile-menu-item" onClick={menuAction(onDataSourcesClick)}>
              <Database size={18} /> {t('header.datasources')}
            </button>
            <button className="mobile-menu-item" onClick={menuAction(toggleDarkMode)}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              {darkMode ? t('header.lightmode') : t('header.darkmode')}
            </button>
            <button className="mobile-menu-item" onClick={() => { setMenuOpen(false); setLang(lang === 'zh' ? 'en' : 'zh'); }}>
              <Languages size={18} /> {t('header.language')}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
