import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppMode } from '../../types';
import './Toolbar.css';

interface ToolbarProps {
  mode: AppMode;
  canUndo: boolean;
  canRedo: boolean;
  onToggleMode: () => void;
  onAddPanel: () => void;
  onExport: () => void;
  onImportClick: () => void;
  onOpenBackgroundSettings: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenQuickSearch: () => void;
  onShareUrl: () => void;
  onOpenHelp: () => void;
}

export function Toolbar({
  mode,
  canUndo,
  canRedo,
  onToggleMode,
  onAddPanel,
  onExport,
  onImportClick,
  onOpenBackgroundSettings,
  onUndo,
  onRedo,
  onOpenQuickSearch,
  onShareUrl,
  onOpenHelp,
}: ToolbarProps) {
  const isEdit = mode === 'edit';
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const isCompact = windowWidth <= 1100;
  const isTight = windowWidth <= 760;

  const overflowActions = useMemo(
    () => [
      {
        id: 'undo',
        label: 'Undo',
        icon: '↶',
        title: 'Undo last edit',
        onClick: onUndo,
        disabled: !canUndo,
        hidden: isTight,
      },
      {
        id: 'redo',
        label: 'Redo',
        icon: '↷',
        title: 'Redo last edit',
        onClick: onRedo,
        disabled: !canRedo,
        hidden: isTight,
      },
      {
        id: 'export',
        label: 'Export',
        icon: '⬇',
        title: 'Export configuration as JSON',
        onClick: onExport,
        hidden: isCompact,
      },
      {
        id: 'import',
        label: 'Import',
        icon: '⬆',
        title: 'Import configuration',
        onClick: onImportClick,
        hidden: isCompact,
      },
      {
        id: 'share',
        label: 'Share',
        icon: '🔗',
        title: 'Copy a shareable URL',
        onClick: onShareUrl,
        hidden: isCompact,
      },
      {
        id: 'background',
        label: 'Background',
        icon: '🖼',
        title: 'Background settings',
        onClick: onOpenBackgroundSettings,
        hidden: isCompact,
      },
      {
        id: 'help',
        label: 'Help',
        icon: 'ⓘ',
        title: 'Help and about',
        onClick: onOpenHelp,
        hidden: isCompact,
      },
    ],
    [
      canRedo,
      canUndo,
      isCompact,
      isTight,
      onExport,
      onImportClick,
      onOpenBackgroundSettings,
      onOpenHelp,
      onRedo,
      onShareUrl,
      onUndo,
    ]
  );

  const visibleOverflowActions = overflowActions.filter((item) => item.hidden);

  useEffect(() => {
    if (visibleOverflowActions.length === 0 && isMoreOpen) {
      setIsMoreOpen(false);
    }
  }, [isMoreOpen, visibleOverflowActions.length]);

  useEffect(() => {
    function onResize() {
      setWindowWidth(window.innerWidth);
    }

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isMoreOpen) return;

    function onClickOutside(e: MouseEvent) {
      if (!moreRef.current) return;
      if (!moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsMoreOpen(false);
      }
    }

    window.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isMoreOpen]);

  return (
    <header
      className={`toolbar ${isEdit ? 'toolbar--edit' : 'toolbar--view'}`}
      role="toolbar"
      aria-label="Editor toolbar"
    >
      <div className="toolbar__left" aria-label="Homedock brand">
        <span className="toolbar__brand">Homedock</span>
      </div>

      {isEdit && (
        <div className="toolbar__groups" aria-label="Edit actions">
          <div className="toolbar__group" aria-label="Content actions">
            <button
              className="toolbar__btn toolbar__btn--primary"
              onClick={onAddPanel}
              title="Add a new panel"
              aria-label="Add panel"
            >
              <span className="toolbar__icon" aria-hidden="true">＋</span>
              <span className="toolbar__label">Add</span>
            </button>
            <button
              className="toolbar__btn"
              onClick={onOpenQuickSearch}
              title="Quick search (Ctrl/Cmd + K)"
              aria-label="Quick search"
            >
              <span className="toolbar__icon" aria-hidden="true">⌕</span>
              <span className="toolbar__label">Search</span>
            </button>
          </div>

          {!isTight && (
            <div className="toolbar__group" aria-label="History actions">
              <button
                className="toolbar__btn"
                onClick={onUndo}
                title="Undo last edit"
                aria-label="Undo"
                disabled={!canUndo}
              >
                <span className="toolbar__icon" aria-hidden="true">↶</span>
                <span className="toolbar__label">Undo</span>
              </button>
              <button
                className="toolbar__btn"
                onClick={onRedo}
                title="Redo last edit"
                aria-label="Redo"
                disabled={!canRedo}
              >
                <span className="toolbar__icon" aria-hidden="true">↷</span>
                <span className="toolbar__label">Redo</span>
              </button>
            </div>
          )}

          {!isCompact && (
            <>
              <div className="toolbar__group" aria-label="Data actions">
                <button
                  className="toolbar__btn"
                  onClick={onExport}
                  title="Export configuration as JSON"
                  aria-label="Export"
                >
                  <span className="toolbar__icon" aria-hidden="true">⬇</span>
                  <span className="toolbar__label">Export</span>
                </button>
                <button
                  className="toolbar__btn"
                  onClick={onImportClick}
                  title="Import configuration from JSON"
                  aria-label="Import"
                >
                  <span className="toolbar__icon" aria-hidden="true">⬆</span>
                  <span className="toolbar__label">Import</span>
                </button>
                <button
                  className="toolbar__btn"
                  onClick={onShareUrl}
                  title="Copy a shareable URL"
                  aria-label="Share URL"
                >
                  <span className="toolbar__icon" aria-hidden="true">🔗</span>
                  <span className="toolbar__label">Share</span>
                </button>
              </div>

              <div className="toolbar__group" aria-label="Appearance and help actions">
                <button
                  className="toolbar__btn"
                  onClick={onOpenBackgroundSettings}
                  title="Background settings"
                  aria-label="Background settings"
                >
                  <span className="toolbar__icon" aria-hidden="true">🖼</span>
                  <span className="toolbar__label">Background</span>
                </button>
                <button
                  className="toolbar__btn"
                  onClick={onOpenHelp}
                  title="Help and about"
                  aria-label="Help and about"
                >
                  <span className="toolbar__icon" aria-hidden="true">ⓘ</span>
                  <span className="toolbar__label">Help</span>
                </button>
              </div>
            </>
          )}

          {visibleOverflowActions.length > 0 && (
            <div className="toolbar__group toolbar__group--more" ref={moreRef}>
              <button
                className={`toolbar__btn ${isMoreOpen ? 'toolbar__btn--active' : ''}`}
                type="button"
                onClick={() => setIsMoreOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={isMoreOpen}
                aria-label="More actions"
                title="More actions"
              >
                <span className="toolbar__icon" aria-hidden="true">⋯</span>
                <span className="toolbar__label">More</span>
              </button>
              {isMoreOpen && (
                <div className="toolbar__menu" role="menu" aria-label="More toolbar actions">
                  {visibleOverflowActions.map((item) => (
                    <button
                      key={item.id}
                      className="toolbar__menu-item"
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsMoreOpen(false);
                        item.onClick();
                      }}
                      title={item.title}
                      disabled={item.disabled}
                    >
                      <span className="toolbar__icon" aria-hidden="true">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="toolbar__right">
        <button
          className={`toolbar__btn toolbar__btn--mode ${isEdit ? 'toolbar__btn--active' : ''}`}
          onClick={onToggleMode}
          title={isEdit ? 'Switch to view mode' : 'Switch to edit mode'}
          aria-label={isEdit ? 'Switch to view mode' : 'Switch to edit mode'}
          aria-pressed={isEdit}
        >
          <span className="toolbar__icon" aria-hidden="true">{isEdit ? '👁' : '✏️'}</span>
          <span className="toolbar__label">{isEdit ? 'View' : 'Edit'}</span>
        </button>
      </div>
    </header>
  );
}
