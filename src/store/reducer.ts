import type { AppState, Panel, Link, AppMode, BackgroundConfig } from '../types';
import {
  findFirstFreeSlot,
  normalizePanelPlacement,
  panelHasCollision,
} from '../utils/grid';

function uid(): string {
  return crypto.randomUUID();
}

const DEFAULT_STYLE: Panel['style'] = {
  bgOpacity: 0.15,
  blur: 10,
  borderRadius: 16,
  textColor: '#ffffff',
  borderColor: '#ffffff',
  borderOpacity: 0.3,
};

export const DEFAULT_BACKGROUND: BackgroundConfig = {
  mode: 'daily',
  solidColor: '#0f172a',
  gradientFrom: '#0f172a',
  gradientTo: '#1d4ed8',
  gradientAngle: 135,
  imageUrl: '',
};

export type Action =
  | { type: 'ADD_PANEL' }
  | { type: 'UPDATE_PANEL'; payload: Partial<Omit<Panel, 'id'>> & { id: string } }
  | { type: 'DELETE_PANEL'; payload: { id: string } }
  | { type: 'ADD_LINK'; payload: { panelId: string } }
  | { type: 'UPDATE_LINK'; payload: { panelId: string; link: Link } }
  | { type: 'DELETE_LINK'; payload: { panelId: string; linkId: string } }
  | { type: 'SET_MODE'; payload: AppMode }
  | { type: 'SET_BACKGROUND'; payload: Partial<BackgroundConfig> }
  | { type: 'IMPORT_PANELS'; payload: Panel[] }
  | { type: 'UNDO' }
  | { type: 'REDO' };

export function isHistoryAction(action: Action): boolean {
  return (
    action.type === 'ADD_PANEL' ||
    action.type === 'UPDATE_PANEL' ||
    action.type === 'DELETE_PANEL' ||
    action.type === 'ADD_LINK' ||
    action.type === 'UPDATE_LINK' ||
    action.type === 'DELETE_LINK' ||
    action.type === 'SET_BACKGROUND' ||
    action.type === 'IMPORT_PANELS'
  );
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_PANEL': {
      const slot = findFirstFreeSlot(state.panels, 4, 3);
      return {
        ...state,
        panels: [
          ...state.panels,
          {
            id: uid(),
            title: 'New Panel',
            showTitle: true,
            col: slot.col,
            row: slot.row,
            colSpan: 4,
            rowSpan: 3,
            links: [],
            style: { ...DEFAULT_STYLE },
            linkDisplay: 'list' as const,
            widgetType: 'links',
            widgetConfig: {},
          },
        ],
      };
    }

    case 'UPDATE_PANEL': {
      const current = state.panels.find((p) => p.id === action.payload.id);
      if (!current) return state;

      const nextRaw = { ...current, ...action.payload };
      const nextPlacement = normalizePanelPlacement(nextRaw);
      const next = { ...nextRaw, ...nextPlacement };

      if (panelHasCollision(next, state.panels, current.id)) {
        return state;
      }

      return {
        ...state,
        panels: state.panels.map((p) => (p.id === next.id ? next : p)),
      };
    }

    case 'DELETE_PANEL':
      return {
        ...state,
        panels: state.panels.filter((p) => p.id !== action.payload.id),
      };

    case 'ADD_LINK':
      return {
        ...state,
        panels: state.panels.map((p) =>
          p.id === action.payload.panelId
            ? {
                ...p,
                links: [
                  ...p.links,
                  { id: uid(), label: '', url: 'https://' },
                ],
              }
            : p
        ),
      };

    case 'UPDATE_LINK':
      return {
        ...state,
        panels: state.panels.map((p) =>
          p.id === action.payload.panelId
            ? {
                ...p,
                links: p.links.map((l) =>
                  l.id === action.payload.link.id ? action.payload.link : l
                ),
              }
            : p
        ),
      };

    case 'DELETE_LINK':
      return {
        ...state,
        panels: state.panels.map((p) =>
          p.id === action.payload.panelId
            ? {
                ...p,
                links: p.links.filter((l) => l.id !== action.payload.linkId),
              }
            : p
        ),
      };

    case 'SET_MODE':
      return { ...state, mode: action.payload };

    case 'SET_BACKGROUND': {
      const next = {
        ...state.background,
        ...action.payload,
      };
      return { ...state, background: next };
    }

    case 'IMPORT_PANELS':
      return { ...state, panels: action.payload };

    case 'UNDO':
    case 'REDO':
      return state;
  }
}
