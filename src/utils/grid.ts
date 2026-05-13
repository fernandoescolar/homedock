import type { Panel } from '../types';

export const GRID_COLS = 12;

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function normalizePanelPlacement(panel: Pick<Panel, 'col' | 'row' | 'colSpan' | 'rowSpan'>): Pick<Panel, 'col' | 'row' | 'colSpan' | 'rowSpan'> {
  const col = clamp(Math.floor(panel.col), 1, GRID_COLS);
  const row = Math.max(1, Math.floor(panel.row));
  const colSpan = clamp(Math.floor(panel.colSpan), 1, GRID_COLS);
  const rowSpan = Math.max(1, Math.floor(panel.rowSpan));
  const safeColSpan = Math.min(colSpan, GRID_COLS - col + 1);

  return {
    col,
    row,
    colSpan: safeColSpan,
    rowSpan,
  };
}

function panelToRect(panel: Pick<Panel, 'col' | 'row' | 'colSpan' | 'rowSpan'>): Rect {
  const n = normalizePanelPlacement(panel);
  return {
    left: n.col,
    top: n.row,
    right: n.col + n.colSpan - 1,
    bottom: n.row + n.rowSpan - 1,
  };
}

function overlaps(a: Rect, b: Rect): boolean {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

export function panelHasCollision(candidate: Panel, panels: Panel[], excludeId?: string): boolean {
  const candidateRect = panelToRect(candidate);
  return panels.some((panel) => {
    if (excludeId && panel.id === excludeId) return false;
    return overlaps(candidateRect, panelToRect(panel));
  });
}

export function findFirstFreeSlot(
  panels: Panel[],
  colSpan: number,
  rowSpan: number,
  maxRows = 300
): { col: number; row: number } {
  const nColSpan = clamp(Math.floor(colSpan), 1, GRID_COLS);
  const nRowSpan = Math.max(1, Math.floor(rowSpan));

  for (let row = 1; row <= maxRows; row += 1) {
    for (let col = 1; col <= GRID_COLS - nColSpan + 1; col += 1) {
      const candidate = {
        id: '__candidate__',
        title: '',
        showTitle: true,
        col,
        row,
        colSpan: nColSpan,
        rowSpan: nRowSpan,
        links: [],
        style: panels[0]?.style ?? {
          bgOpacity: 0.15,
          blur: 10,
          borderRadius: 16,
          textColor: '#ffffff',
          borderColor: '#ffffff',
          borderOpacity: 0.3,
        },
        linkDisplay: 'list' as const,
        widgetType: 'links' as const,
        widgetConfig: {},
      } satisfies Panel;

      if (!panelHasCollision(candidate, panels)) {
        return { col, row };
      }
    }
  }

  const maxBottom = panels.reduce((acc, p) => Math.max(acc, p.row + p.rowSpan - 1), 0);
  return { col: 1, row: maxBottom + 1 };
}

export function analyzePanelsForCollisions(panels: Panel[]): string[] {
  const errors: string[] = [];
  for (let i = 0; i < panels.length; i += 1) {
    for (let j = i + 1; j < panels.length; j += 1) {
      if (panelHasCollision(panels[i], [panels[j]])) {
        errors.push(
          `Panel "${panels[i].title || panels[i].id}" overlaps with panel "${panels[j].title || panels[j].id}"`
        );
      }
    }
  }
  return errors;
}
