import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useAppStore } from './store/useAppStore';
import type { ExportSchema, Panel as PanelType } from './types';
import { validateExportSchema } from './utils/validation';
import {
  analyzePanelsForCollisions,
  GRID_COLS,
  normalizePanelPlacement,
  panelHasCollision,
} from './utils/grid';
import { Background } from './components/Background/Background';
import { Toolbar } from './components/Toolbar/Toolbar';
import { Panel, type PanelResizeEdge } from './components/Panel/Panel';
import { PanelEditor } from './components/Editor/PanelEditor';
import { BackgroundEditor } from './components/Editor/BackgroundEditor';
import { LinkSearchOverlay } from './components/LinkSearchOverlay/LinkSearchOverlay';
import { AboutHelp } from './components/Help/AboutHelp';
import { collectSearchableLinks } from './utils/search';
import { createShareUrl, parseUrlState } from './utils/urlState';
import { DEFAULT_BACKGROUND } from './store/reducer';
import './App.css';

const GRID_ROW_HEIGHT = 152;

interface PanelPlacementSnapshot {
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

interface ImportPreviewState {
  fileName: string;
  panels: PanelType[];
  background: ExportSchema['background'];
  errors: string[];
  collisions: string[];
}

export function App() {
  const { state, canUndo, canRedo, dispatch } = useAppStore();
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [isBackgroundEditorOpen, setIsBackgroundEditorOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [globalNotice, setGlobalNotice] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreviewState | null>(null);
  const [isImportSourceOpen, setIsImportSourceOpen] = useState(false);
  const [importUrlValue, setImportUrlValue] = useState('');
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const initializedUrlLoadRef = useRef(false);
  const importDialogRef = useRef<HTMLDivElement>(null);
  const importSourceDialogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLElement>(null);

  const isEdit = state.mode === 'edit';
  const selectedPanel =
    state.panels.find((p) => p.id === selectedPanelId) ?? null;

  // Sort panels by row then col so mobile stacking matches desktop visual order
  const sortedPanels = useMemo(() => {
    return state.panels
      .map((panel, index) => ({ panel, index }))
      .sort((a, b) => {
        if (a.panel.row !== b.panel.row) return a.panel.row - b.panel.row;
        if (a.panel.col !== b.panel.col) return a.panel.col - b.panel.col;
        return a.index - b.index;
      })
      .map((item) => item.panel);
  }, [state.panels]);

  const searchableLinks = useMemo(
    () => collectSearchableLinks(state.panels),
    [state.panels]
  );

  function isTextEditingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    return (
      tag === 'input' ||
      tag === 'textarea' ||
      target.isContentEditable ||
      target.closest('[contenteditable="true"]') !== null
    );
  }

  // ── Mode ───────────────────────────────────────────────────
  function handleToggleMode() {
    const next = isEdit ? 'view' : 'edit';
    dispatch({ type: 'SET_MODE', payload: next });
    if (next === 'view') {
      setSelectedPanelId(null);
      setIsBackgroundEditorOpen(false);
      setIsHelpOpen(false);
      setIsImportSourceOpen(false);
      setImportUrlValue('');
    }
  }

  // ── Export ─────────────────────────────────────────────────
  function handleExport() {
    const data: ExportSchema = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      panels: state.panels,
      background: state.background,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homedock-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleShareUrl() {
    const shareUrl = createShareUrl(state);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setGlobalNotice('Share URL copied to clipboard.');
    } catch {
      window.prompt('Copy this URL', shareUrl);
      setGlobalNotice('Share URL ready to copy.');
    }
  }

  // ── Import ─────────────────────────────────────────────────
  function handleImportClick() {
    setIsImportSourceOpen(true);
  }

  function openFileImportPicker() {
    setIsImportSourceOpen(false);
    fileInputRef.current?.click();
  }

  function buildImportPreview(data: unknown, sourceName: string): ImportPreviewState {
    const result = validateExportSchema(data);

    const panels = result.valid ? (data as ExportSchema).panels : [];
    const nextBackground =
      result.valid &&
      typeof (data as Record<string, unknown>).background === 'object' &&
      (data as Record<string, unknown>).background
        ? {
            ...DEFAULT_BACKGROUND,
            ...((data as ExportSchema).background ?? {}),
          }
        : DEFAULT_BACKGROUND;
    const collisions = result.valid
      ? analyzePanelsForCollisions(panels)
      : [];

    return {
      fileName: sourceName,
      panels,
      background: nextBackground,
      errors: result.errors,
      collisions,
    };
  }

  async function handleImportFromUrl() {
    const trimmedUrl = importUrlValue.trim();
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      setGlobalNotice('Import URL must start with http:// or https://.');
      return;
    }

    setIsImportingUrl(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(trimmedUrl, { signal: controller.signal });
      if (!response.ok) throw new Error('Request failed');

      const raw = await response.json();
      setImportPreview(buildImportPreview(raw, trimmedUrl));
      setIsImportSourceOpen(false);
      setImportUrlValue('');
    } catch {
      setGlobalNotice('Could not import from URL.');
    } finally {
      window.clearTimeout(timeout);
      setIsImportingUrl(false);
    }
  }

  function closeImportPreview() {
    setImportPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function confirmImportPreview() {
    if (!importPreview || importPreview.errors.length > 0 || importPreview.collisions.length > 0) {
      return;
    }
    dispatch({
      type: 'IMPORT_PANELS',
      payload: importPreview.panels,
    });
    dispatch({
      type: 'SET_BACKGROUND',
      payload: importPreview.background,
    });
    closeImportPreview();
  }

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const raw = ev.target?.result;
          if (typeof raw !== 'string') return;
          const data: unknown = JSON.parse(raw);
          setImportPreview(buildImportPreview(data, file.name));
        } catch {
          setImportPreview({
            fileName: file.name,
            panels: [],
            background: DEFAULT_BACKGROUND,
            errors: ['Failed to read the file. Make sure it is a valid JSON file.'],
            collisions: [],
          });
        } finally {
          if (e.target) {
            e.target.value = '';
          }
        }
      };
      reader.readAsText(file);
    },
    []
  );

  useEffect(() => {
    if (initializedUrlLoadRef.current) return;
    initializedUrlLoadRef.current = true;

    const { configState, importUrl } = parseUrlState(window.location.search);

    if (configState) {
      dispatch({ type: 'IMPORT_PANELS', payload: configState.panels });
      dispatch({ type: 'SET_BACKGROUND', payload: configState.background });
      setGlobalNotice('Dashboard loaded from URL configuration.');
      return;
    }

    if (!importUrl) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    fetch(importUrl, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then((raw) => {
        const validation = validateExportSchema(raw);
        if (!validation.valid) {
          setGlobalNotice('Import URL is invalid. Falling back to local dashboard.');
          return;
        }

        const data = raw as ExportSchema;
        dispatch({ type: 'IMPORT_PANELS', payload: data.panels });
        dispatch({ type: 'SET_BACKGROUND', payload: data.background });
        setGlobalNotice('Dashboard imported from remote URL.');
      })
      .catch(() => {
        setGlobalNotice('Could not load import URL. Using local dashboard.');
      })
      .finally(() => {
        window.clearTimeout(timeout);
      });
  }, [dispatch]);

  useEffect(() => {
    if (!globalNotice) return;
    const timer = window.setTimeout(() => setGlobalNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [globalNotice]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (state.mode !== 'edit') return;

      const isMeta = e.metaKey || e.ctrlKey;
      if (!isMeta) return;

      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
        return;
      }

      if (key === 'z' && e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
        return;
      }

      if (key === 'y') {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dispatch, state.mode]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey;
      if (!isMeta || e.key.toLowerCase() !== 'k') return;
      if (isTextEditingTarget(e.target)) return;
      e.preventDefault();
      setIsQuickSearchOpen(true);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!isImportSourceOpen) return;

    const dialog = importSourceDialogRef.current;
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsImportSourceOpen(false);
        return;
      }

      if (e.key === 'Tab' && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [isImportSourceOpen]);

  useEffect(() => {
    if (!importPreview) return;

    const dialog = importDialogRef.current;
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeImportPreview();
        return;
      }

      if (e.key === 'Tab' && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [importPreview]);

  // ── Panel canvas click (deselect) ──────────────────────────
  function handleCanvasClick(e: React.MouseEvent<HTMLElement>) {
    if ((e.target as HTMLElement).classList.contains('canvas')) {
      setSelectedPanelId(null);
    }
  }

  function getCanvasSnapUnits() {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const bounds = canvas.getBoundingClientRect();
    const style = window.getComputedStyle(canvas);
    const colGap = Number.parseFloat(style.columnGap || style.gap || '0') || 0;
    const rowGap = Number.parseFloat(style.rowGap || style.gap || '0') || 0;

    const totalColGap = colGap * (GRID_COLS - 1);
    const safeWidth = Math.max(1, bounds.width - totalColGap);
    const colWidth = safeWidth / GRID_COLS;

    return {
      colUnit: colWidth + colGap,
      rowUnit: GRID_ROW_HEIGHT + rowGap,
    };
  }

  const updatePanelPlacement = useCallback(
    (panelId: string, partial: Partial<PanelPlacementSnapshot>) => {
      const current = state.panels.find((p) => p.id === panelId);
      if (!current) return;

      const candidateRaw = {
        ...current,
        ...partial,
      };
      const normalized = normalizePanelPlacement(candidateRaw);
      const candidate = { ...candidateRaw, ...normalized };

      if (
        candidate.col === current.col &&
        candidate.row === current.row &&
        candidate.colSpan === current.colSpan &&
        candidate.rowSpan === current.rowSpan
      ) {
        return;
      }

      if (panelHasCollision(candidate, state.panels, current.id)) {
        return;
      }

      dispatch({
        type: 'UPDATE_PANEL',
        payload: {
          id: panelId,
          col: candidate.col,
          row: candidate.row,
          colSpan: candidate.colSpan,
          rowSpan: candidate.rowSpan,
        },
      });
    },
    [dispatch, state.panels]
  );

  const handlePanelMoveDrag = useCallback(
    (panelId: string, start: PanelPlacementSnapshot, dx: number, dy: number) => {
      const units = getCanvasSnapUnits();
      if (!units) return;

      const deltaCol = Math.round(dx / units.colUnit);
      const deltaRow = Math.round(dy / units.rowUnit);

      const nextCol = clamp(start.col + deltaCol, 1, GRID_COLS - start.colSpan + 1);
      const nextRow = Math.max(1, start.row + deltaRow);

      updatePanelPlacement(panelId, {
        col: nextCol,
        row: nextRow,
        colSpan: start.colSpan,
        rowSpan: start.rowSpan,
      });
    },
    [updatePanelPlacement]
  );

  const handlePanelResizeDrag = useCallback(
    (
      panelId: string,
      start: PanelPlacementSnapshot,
      edge: PanelResizeEdge,
      dx: number,
      dy: number
    ) => {
      const units = getCanvasSnapUnits();
      if (!units) return;

      const deltaCol = Math.round(dx / units.colUnit);
      const deltaRow = Math.round(dy / units.rowUnit);

      const startRight = start.col + start.colSpan - 1;
      const startBottom = start.row + start.rowSpan - 1;

      let nextCol = start.col;
      let nextRow = start.row;
      let nextColSpan = start.colSpan;
      let nextRowSpan = start.rowSpan;

      if (edge === 'right') {
        const nextRight = clamp(startRight + deltaCol, start.col, GRID_COLS);
        nextColSpan = nextRight - start.col + 1;
      } else if (edge === 'left') {
        const nextLeft = clamp(start.col + deltaCol, 1, startRight);
        nextCol = nextLeft;
        nextColSpan = startRight - nextLeft + 1;
      } else if (edge === 'bottom') {
        const nextBottom = Math.max(start.row, startBottom + deltaRow);
        nextRowSpan = nextBottom - start.row + 1;
      } else if (edge === 'top') {
        const nextTop = clamp(start.row + deltaRow, 1, startBottom);
        nextRow = nextTop;
        nextRowSpan = startBottom - nextTop + 1;
      }

      updatePanelPlacement(panelId, {
        col: nextCol,
        row: nextRow,
        colSpan: nextColSpan,
        rowSpan: nextRowSpan,
      });
    },
    [updatePanelPlacement]
  );

  return (
    <div className={`app ${isEdit ? 'app--edit' : 'app--view'}`}>
      <a href="#canvas-main" className="app__skip-link">
        Skip to dashboard content
      </a>
      <Background config={state.background} />

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Toolbar — visible only in edit mode */}
      {isEdit && (
        <Toolbar
          mode={state.mode}
          canUndo={canUndo}
          canRedo={canRedo}
          onToggleMode={handleToggleMode}
          onAddPanel={() => dispatch({ type: 'ADD_PANEL' })}
          onExport={handleExport}
          onImportClick={handleImportClick}
          onOpenBackgroundSettings={() => {
            setSelectedPanelId(null);
            setIsBackgroundEditorOpen(true);
          }}
          onUndo={() => dispatch({ type: 'UNDO' })}
          onRedo={() => dispatch({ type: 'REDO' })}
          onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
          onShareUrl={handleShareUrl}
          onOpenHelp={() => setIsHelpOpen(true)}
        />
      )}

      {globalNotice && (
        <div className="app__notice" aria-live="polite">
          {globalNotice}
        </div>
      )}

      {/* Canvas — panels live here as grid items */}
      <main
        id="canvas-main"
        ref={canvasRef}
        className={[
          'canvas',
          isEdit ? 'canvas--edit' : '',
          isEdit && (selectedPanel || isBackgroundEditorOpen) ? 'canvas--sidebar-open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={handleCanvasClick}
        aria-label="Homedock canvas"
      >
        {sortedPanels.map((panel) => (
          <Panel
            key={panel.id}
            panel={panel}
            isEdit={isEdit}
            isSelected={selectedPanelId === panel.id}
            onSelect={() => {
              setIsBackgroundEditorOpen(false);
              setSelectedPanelId(panel.id);
            }}
            dispatch={dispatch}
            onMoveDrag={handlePanelMoveDrag}
            onResizeDrag={handlePanelResizeDrag}
          />
        ))}

        {state.panels.length === 0 && !isEdit && (
          <div className="canvas__empty">
            <p>No panels yet.</p>
          </div>
        )}
      </main>

      {isQuickSearchOpen && (
        <LinkSearchOverlay links={searchableLinks} onClose={() => setIsQuickSearchOpen(false)} />
      )}

      {isEdit && isHelpOpen && <AboutHelp onClose={() => setIsHelpOpen(false)} />}

      {!isEdit && (
        <button
          className="app__floating-edit"
          onClick={handleToggleMode}
          aria-label="Switch to edit mode"
          title="Edit dashboard"
        >
          ⚙
        </button>
      )}

      {/* Panel editor sidebar */}
      {isEdit && selectedPanel && !isBackgroundEditorOpen && (
        <PanelEditor
          panel={selectedPanel}
          panels={state.panels}
          dispatch={dispatch}
          onClose={() => setSelectedPanelId(null)}
        />
      )}

      {isEdit && isBackgroundEditorOpen && (
        <BackgroundEditor
          background={state.background}
          onUpdate={(partial) => dispatch({ type: 'SET_BACKGROUND', payload: partial })}
          onClose={() => setIsBackgroundEditorOpen(false)}
        />
      )}

      {isImportSourceOpen && (
        <div
          className="import-source"
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-source-title"
        >
          <button
            type="button"
            className="import-source__backdrop"
            onClick={() => setIsImportSourceOpen(false)}
            aria-label="Close import source selector"
          />
          <div className="import-source__card" ref={importSourceDialogRef}>
            <h2 id="import-source-title" className="import-source__title">Import dashboard</h2>
            <p className="import-source__meta">
              Choose whether to import your Homedock configuration from a JSON file or a direct URL.
            </p>

            <div className="import-source__actions">
              <button
                type="button"
                className="toolbar__btn toolbar__btn--primary"
                onClick={openFileImportPicker}
              >
                Choose file
              </button>

              <div className="import-source__url-row">
                <input
                  type="url"
                  className="import-source__url-input"
                  value={importUrlValue}
                  onChange={(e) => setImportUrlValue(e.target.value)}
                  placeholder="https://example.com/homedock.json"
                  aria-label="Import URL"
                />
                <button
                  type="button"
                  className="toolbar__btn"
                  onClick={handleImportFromUrl}
                  disabled={isImportingUrl || importUrlValue.trim().length === 0}
                >
                  {isImportingUrl ? 'Importing…' : 'Import URL'}
                </button>
              </div>

              <button
                type="button"
                className="toolbar__btn"
                onClick={() => {
                  setIsImportSourceOpen(false);
                  setImportUrlValue('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {importPreview && (
        <div
          className="import-preview"
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-preview-title"
        >
          <div className="import-preview__backdrop" onClick={closeImportPreview} />
          <div className="import-preview__card" ref={importDialogRef}>
            <h2 id="import-preview-title" className="import-preview__title">Import preview</h2>
            <p className="import-preview__meta">File: {importPreview.fileName}</p>
            <p className="import-preview__meta">
              Current panels: {state.panels.length} · Imported panels: {importPreview.panels.length}
            </p>

            {importPreview.errors.length > 0 && (
              <div className="import-preview__section" aria-live="polite">
                <h3>Validation errors</h3>
                <ul>
                  {importPreview.errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {importPreview.collisions.length > 0 && (
              <div className="import-preview__section" aria-live="polite">
                <h3>Collisions detected</h3>
                <ul>
                  {importPreview.collisions.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {importPreview.errors.length === 0 && importPreview.collisions.length === 0 && (
              <div className="import-preview__section import-preview__section--ok" aria-live="polite">
                Configuration is valid and ready to import.
              </div>
            )}

            <div className="import-preview__actions">
              <button className="toolbar__btn" onClick={closeImportPreview}>Cancel</button>
              <button
                className="toolbar__btn toolbar__btn--primary"
                onClick={confirmImportPreview}
                disabled={importPreview.errors.length > 0 || importPreview.collisions.length > 0}
              >
                Confirm import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
