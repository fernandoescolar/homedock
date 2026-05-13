import type { Panel as PanelType } from '../../types';
import type { Action } from '../../store/reducer';
import type { Dispatch } from 'react';
import { LinkItem } from '../LinkItem/LinkItem';
import { hexToRgba } from '../../utils/color';
import { WidgetContent } from './WidgetContent';
import './Panel.css';

interface PanelProps {
  panel: PanelType;
  isEdit: boolean;
  isSelected: boolean;
  onSelect: () => void;
  dispatch: Dispatch<Action>;
}

export function Panel({
  panel,
  isEdit,
  isSelected,
  onSelect,
  dispatch,
}: PanelProps) {
  const showTitle = panel.showTitle ?? true;
  const showHeader = isEdit || showTitle;

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
      className={[
        'panel',
        isEdit ? 'panel--edit' : '',
        isSelected ? 'panel--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={panelStyle}
      onClick={isEdit ? onSelect : undefined}
    >
      {/* Title bar */}
      {showHeader && (
        <div className="panel__handle">
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

      {/* Body */}
      {(panel.widgetType ?? 'links') === 'links' ? (
        <div className={`panel__links panel__links--${panel.linkDisplay ?? 'list'}`}>
          {panel.links.map((link) => (
            <LinkItem key={link.id} link={link} isEdit={isEdit} display={panel.linkDisplay ?? 'list'} />
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

