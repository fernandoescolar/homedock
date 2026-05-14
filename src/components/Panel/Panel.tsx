import { useCallback, useRef } from 'react';
import type { Panel as PanelType } from '../../types';
import type { Action } from '../../store/reducer';
import type { Dispatch } from 'react';
import { LinkItem } from '../LinkItem/LinkItem';
import { hexToRgba } from '../../utils/color';
import { WidgetContent } from './WidgetContent';
import './Panel.css';

interface PanelPlacementSnapshot {
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

type GestureKind = 'move' | 'resize';
export type PanelResizeEdge = 'left' | 'right' | 'top' | 'bottom';

interface ActiveGesture {
  pointerId: number;
  kind: GestureKind;
  edge?: PanelResizeEdge;
  startX: number;
  startY: number;
  start: PanelPlacementSnapshot;
}

interface PanelProps {
  panel: PanelType;
  isEdit: boolean;
  isSelected: boolean;
  onSelect: () => void;
  dispatch: Dispatch<Action>;
  openLinksInNewTab?: boolean;
  onMoveDrag: (id: string, start: PanelPlacementSnapshot, dx: number, dy: number) => void;
  onResizeDrag: (
    id: string,
    start: PanelPlacementSnapshot,
    edge: PanelResizeEdge,
    dx: number,
    dy: number
  ) => void;
}

export function Panel({
  panel,
  isEdit,
  isSelected,
  onSelect,
  dispatch,
  openLinksInNewTab,
  onMoveDrag,
  onResizeDrag,
}: PanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const activeGestureRef = useRef<ActiveGesture | null>(null);

  const showTitle = panel.showTitle ?? true;
  const showHeader = isEdit || showTitle;

  const start = {
    col: panel.col,
    row: panel.row,
    colSpan: panel.colSpan,
    rowSpan: panel.rowSpan,
  };

  const beginGesture = useCallback(
    (e: React.PointerEvent<HTMLElement>, kind: GestureKind, edge?: PanelResizeEdge) => {
      if (!isEdit) return;
      e.preventDefault();
      e.stopPropagation();

      const panelElement = panelRef.current;
      if (!panelElement) return;

      panelElement.setPointerCapture(e.pointerId);
      activeGestureRef.current = {
        pointerId: e.pointerId,
        kind,
        edge,
        startX: e.clientX,
        startY: e.clientY,
        start,
      };
      onSelect();
    },
    [isEdit, onSelect, start]
  );

  const endGesture = useCallback((pointerId: number) => {
    const panelElement = panelRef.current;
    if (panelElement?.hasPointerCapture(pointerId)) {
      panelElement.releasePointerCapture(pointerId);
    }
    activeGestureRef.current = null;
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const active = activeGestureRef.current;
      if (!active || active.pointerId !== e.pointerId) return;

      const dx = e.clientX - active.startX;
      const dy = e.clientY - active.startY;

      if (active.kind === 'move') {
        onMoveDrag(panel.id, active.start, dx, dy);
        return;
      }

      if (active.edge) {
        onResizeDrag(panel.id, active.start, active.edge, dx, dy);
      }
    },
    [onMoveDrag, onResizeDrag, panel.id]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const active = activeGestureRef.current;
      if (!active || active.pointerId !== e.pointerId) return;
      endGesture(e.pointerId);
    },
    [endGesture]
  );

  const panelStyle: React.CSSProperties = {
    gridColumn: `${panel.col} / span ${panel.colSpan}`,
    gridRow: `${panel.row} / span ${panel.rowSpan}`,
    background: hexToRgba('#ffffff', panel.style.bgOpacity),
    backdropFilter: `blur(${panel.style.blur}px)`,
    WebkitBackdropFilter: `blur(${panel.style.blur}px)`,
    borderRadius: panel.style.borderRadius,
    border: `1px solid ${hexToRgba(panel.style.borderColor, panel.style.borderOpacity)}`,
    color: panel.style.textColor,
  };

  return (
    <div
      ref={panelRef}
      className={[
        'panel',
        isEdit ? 'panel--edit' : '',
        isSelected ? 'panel--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={panelStyle}
      onClick={isEdit ? onSelect : undefined}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Title bar */}
      {showHeader && (
        <div
          className="panel__handle"
          onPointerDown={isEdit ? (e) => beginGesture(e, 'move') : undefined}
        >
          {showTitle && panel.title && (
            <span className="panel__title">{panel.title}</span>
          )}
          {isEdit && (
            <button
              className="panel__btn-delete"
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'DELETE_PANEL', payload: { id: panel.id } });
              }}
              title="Delete panel"
              aria-label="Delete panel"
            >
              ×
            </button>
          )}
        </div>
      )}

      {isEdit && (
        <>
          <div
            className="panel__resize panel__resize--left"
            onPointerDown={(e) => beginGesture(e, 'resize', 'left')}
            aria-hidden="true"
          />
          <div
            className="panel__resize panel__resize--right"
            onPointerDown={(e) => beginGesture(e, 'resize', 'right')}
            aria-hidden="true"
          />
          <div
            className="panel__resize panel__resize--top"
            onPointerDown={(e) => beginGesture(e, 'resize', 'top')}
            aria-hidden="true"
          />
          <div
            className="panel__resize panel__resize--bottom"
            onPointerDown={(e) => beginGesture(e, 'resize', 'bottom')}
            aria-hidden="true"
          />
        </>
      )}

      {/* Body */}
      {(panel.widgetType ?? 'links') === 'links' ? (
        <div className={`panel__links panel__links--${panel.linkDisplay ?? 'list'}`}>
          {panel.links.map((link) => (
            <LinkItem
              key={link.id}
              link={link}
              isEdit={isEdit}
              display={panel.linkDisplay ?? 'list'}
              openInNewTab={openLinksInNewTab ?? panel.openLinksInNewTab ?? true}
            />
          ))}
          {panel.links.length === 0 && isEdit && (
            <p className="panel__empty">No links · open editor to add</p>
          )}
        </div>
      ) : (
        <WidgetContent panel={panel} isEdit={isEdit} />
      )}
    </div>
  );
}

