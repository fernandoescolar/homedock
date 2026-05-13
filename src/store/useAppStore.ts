import { useReducer, useEffect, useRef, type Dispatch } from 'react';
import { reducer, isHistoryAction, type Action } from './reducer';
import type { AppState } from '../types';
import { loadState, saveState } from '../utils/storage';
import { DEFAULT_BACKGROUND } from './reducer';

const DEFAULT_STATE: AppState = {
  schemaVersion: 1,
  panels: [],
  mode: 'view',
  background: DEFAULT_BACKGROUND,
};

const HISTORY_LIMIT = 100;

interface HistoryState {
  past: AppState[];
  present: AppState;
  future: AppState[];
}

function pushPast(past: AppState[], present: AppState): AppState[] {
  const next = [...past, present];
  if (next.length <= HISTORY_LIMIT) return next;
  return next.slice(next.length - HISTORY_LIMIT);
}

function historyReducer(state: HistoryState, action: Action): HistoryState {
  if (action.type === 'UNDO') {
    if (state.past.length === 0) return state;
    const previous = state.past[state.past.length - 1];
    return {
      past: state.past.slice(0, -1),
      present: previous,
      future: [state.present, ...state.future],
    };
  }

  if (action.type === 'REDO') {
    if (state.future.length === 0) return state;
    const next = state.future[0];
    return {
      past: pushPast(state.past, state.present),
      present: next,
      future: state.future.slice(1),
    };
  }

  const nextPresent = reducer(state.present, action);
  if (nextPresent === state.present) {
    return state;
  }

  if (!isHistoryAction(action)) {
    return {
      ...state,
      present: nextPresent,
    };
  }

  return {
    past: pushPast(state.past, state.present),
    present: nextPresent,
    future: [],
  };
}

export function useAppStore(): {
  state: AppState;
  canUndo: boolean;
  canRedo: boolean;
  dispatch: Dispatch<Action>;
} {
  const [history, dispatch] = useReducer(historyReducer, undefined, () => {
    const loaded = loadState() ?? DEFAULT_STATE;
    return {
      past: [],
      present: loaded,
      future: [],
    } satisfies HistoryState;
  });

  const state = history.present;

  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const timer = setTimeout(() => saveState(state), 300);
    return () => clearTimeout(timer);
  }, [state]);

  return {
    state,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    dispatch,
  };
}
