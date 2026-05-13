import type { AppState, Panel } from '../types';
import { DEFAULT_BACKGROUND } from '../store/reducer';

const STORAGE_KEY = 'homedock_v1';

const FALLBACK_STYLE: Panel['style'] = {
  bgOpacity: 0.15,
  blur: 10,
  borderRadius: 16,
  textColor: '#ffffff',
  borderColor: '#ffffff',
  borderOpacity: 0.3,
};

/**
 * Migrates a raw panel object from the old pixel-based format
 * (x, y, width) to the new grid-based format (col, row, colSpan, rowSpan).
 * If the panel already has grid fields it is returned as-is (with linkDisplay
 * defaulted to 'list' when missing).
 */
function migratePanel(raw: Record<string, unknown>, index: number): Panel {
  if (typeof raw.col === 'number' && typeof raw.row === 'number') {
    // Already new format — just ensure linkDisplay is present
    return {
      ...raw,
      showTitle: raw.showTitle ?? true,
      openLinksInNewTab: raw.openLinksInNewTab ?? true,
      linkDisplay: raw.linkDisplay ?? 'list',
      widgetType: raw.widgetType ?? 'links',
      widgetConfig: typeof raw.widgetConfig === 'object' && raw.widgetConfig ? raw.widgetConfig : {},
    } as Panel;
  }

  // Old pixel format: auto-arrange in a 3-column flow
  const colIndex = index % 3;
  const rowIndex = Math.floor(index / 3);
  return {
    id: (raw.id as string) ?? crypto.randomUUID(),
    title: (raw.title as string) ?? '',
    showTitle: true,
    col: 1 + colIndex * 4,
    row: 1 + rowIndex * 4,
    colSpan: 4,
    rowSpan: 3,
    links: Array.isArray(raw.links) ? raw.links : [],
    openLinksInNewTab: true,
    style: (raw.style as Panel['style']) ?? FALLBACK_STYLE,
    linkDisplay: (raw.linkDisplay as Panel['linkDisplay']) ?? 'list',
    widgetType: 'links',
    widgetConfig: {},
  };
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      (parsed as Record<string, unknown>).schemaVersion !== 1
    ) {
      return null;
    }
    const obj = parsed as Record<string, unknown>;
    const panels = Array.isArray(obj.panels)
      ? (obj.panels as Record<string, unknown>[]).map(migratePanel)
      : [];
    return {
      ...(obj as unknown as AppState),
      panels,
      background:
        typeof obj.background === 'object' && obj.background
          ? { ...DEFAULT_BACKGROUND, ...(obj.background as AppState['background']) }
          : DEFAULT_BACKGROUND,
    };
  } catch {
    return null;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[homedock] Failed to persist state:', err);
  }
}
