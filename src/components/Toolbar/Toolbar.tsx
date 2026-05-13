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
}: ToolbarProps) {
  const isEdit = mode === 'edit';

  return (
    <header
      className={`toolbar ${isEdit ? 'toolbar--edit' : 'toolbar--view'}`}
      role="toolbar"
      aria-label="Editor toolbar"
    >
      <div className="toolbar__left">
        <span className="toolbar__brand">Homedock</span>
      </div>

      <div className="toolbar__center">
        {isEdit && (
          <button
            className="toolbar__btn toolbar__btn--primary"
            onClick={onAddPanel}
            title="Add a new panel"
            aria-label="Add panel"
          >
            <span className="toolbar__icon" aria-hidden="true">＋</span>
            <span className="toolbar__label">Add Panel</span>
          </button>
        )}
      </div>

      <div className="toolbar__right">
        {isEdit && (
          <>
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
              onClick={onOpenBackgroundSettings}
              title="Background settings"
              aria-label="Background settings"
            >
              <span className="toolbar__icon" aria-hidden="true">🖼</span>
              <span className="toolbar__label">Background</span>
            </button>
          </>
        )}

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
