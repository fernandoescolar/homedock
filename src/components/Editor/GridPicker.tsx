import { useState, useEffect, useCallback, type KeyboardEvent } from 'react';
import './GridPicker.css';

export const GRID_COLS = 12;
const PICKER_ROWS = 8;
const BUFFER_ROWS = 3; // Blank rows to show above current row when scrolling

interface GridPickerProps {
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  onChange: (col: number, row: number, colSpan: number, rowSpan: number) => void;
}

export function GridPicker({ col, row, colSpan, rowSpan, onChange }: GridPickerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [start, setStart] = useState<{ c: number; r: number } | null>(null);
  const [curr, setCurr] = useState<{ c: number; r: number } | null>(null);
  // rowOffset lets users navigate to rows beyond PICKER_ROWS
  // Try to always show row 1 (offset=0), but if current row is off-screen, leave BUFFER_ROWS blank above
  const [rowOffset, setRowOffset] = useState(() => {
    if (row <= PICKER_ROWS) {
      return 0; // Show row 1 at top
    } else {
      return Math.max(0, row - PICKER_ROWS + BUFFER_ROWS);
    }
  });

  // When the panel's row changes externally, adjust picker position
  useEffect(() => {
    if (row <= PICKER_ROWS) {
      setRowOffset(0); // Show row 1 at top
    } else {
      setRowOffset(Math.max(0, row - PICKER_ROWS + BUFFER_ROWS));
    }
  }, [row]);

  // While dragging show live preview, otherwise show committed values
  const preview =
    isDragging && start && curr
      ? {
          col: Math.min(start.c, curr.c),
          row: Math.min(start.r, curr.r),
          colSpan: Math.abs(start.c - curr.c) + 1,
          rowSpan: Math.abs(start.r - curr.r) + 1,
        }
      : { col, row, colSpan, rowSpan };

  const commitDrag = useCallback(() => {
    if (isDragging && start && curr) {
      onChange(
        Math.min(start.c, curr.c),
        Math.min(start.r, curr.r),
        Math.abs(start.c - curr.c) + 1,
        Math.abs(start.r - curr.r) + 1
      );
    }
    setIsDragging(false);
    setStart(null);
    setCurr(null);
  }, [isDragging, start, curr, onChange]);

  // Global pointer-up so release outside the grid still commits
  useEffect(() => {
    window.addEventListener('pointerup', commitDrag);
    return () => window.removeEventListener('pointerup', commitDrag);
  }, [commitDrag]);

  function isSelected(c: number, r: number) {
    return (
      c >= preview.col &&
      c < preview.col + preview.colSpan &&
      r >= preview.row &&
      r < preview.row + preview.rowSpan
    );
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    let nextCol = col;
    let nextRow = row;
    let nextColSpan = colSpan;
    let nextRowSpan = rowSpan;

    if (e.shiftKey) {
      if (e.key === 'ArrowLeft') nextColSpan = Math.max(1, colSpan - 1);
      if (e.key === 'ArrowRight') nextColSpan = Math.min(GRID_COLS - col + 1, colSpan + 1);
      if (e.key === 'ArrowUp') nextRowSpan = Math.max(1, rowSpan - 1);
      if (e.key === 'ArrowDown') nextRowSpan = rowSpan + 1;
    } else {
      if (e.key === 'ArrowLeft') nextCol = Math.max(1, col - 1);
      if (e.key === 'ArrowRight') nextCol = Math.min(GRID_COLS - colSpan + 1, col + 1);
      if (e.key === 'ArrowUp') nextRow = Math.max(1, row - 1);
      if (e.key === 'ArrowDown') nextRow = row + 1;
    }

    if (
      nextCol !== col ||
      nextRow !== row ||
      nextColSpan !== colSpan ||
      nextRowSpan !== rowSpan
    ) {
      e.preventDefault();
      onChange(nextCol, nextRow, nextColSpan, nextRowSpan);
    }
  }

  return (
    <div
      className="grid-picker"
      aria-label="Grid placement picker"
      role="group"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Column labels */}
      <div className="gp-col-labels" aria-hidden="true">
        {Array.from({ length: GRID_COLS }, (_, i) => (
          <span key={i} className="gp-col-label">
            {i + 1}
          </span>
        ))}
      </div>

      {/* Cells: 12 cols × PICKER_ROWS rows */}
      <div
        className="gp-cells"
        role="grid"
        aria-label="Placement grid"
        onPointerLeave={() => {
          if (isDragging && start) setCurr(start);
        }}
      >
        {Array.from({ length: PICKER_ROWS * GRID_COLS }, (_, i) => {
          const c = (i % GRID_COLS) + 1;
          const r = Math.floor(i / GRID_COLS) + 1 + rowOffset;
          const sel = isSelected(c, r);
          const isAnchor =
            c === preview.col && r === preview.row;
          return (
            <div
              key={i}
              className={[
                'gp-cell',
                sel ? 'gp-cell--sel' : '',
                isAnchor ? 'gp-cell--anchor' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              title={`Col ${c}, Row ${r}`}
              onPointerDown={(e) => {
                e.preventDefault();
                setIsDragging(true);
                setStart({ c, r });
                setCurr({ c, r });
              }}
              onPointerEnter={() => {
                if (isDragging) setCurr({ c, r });
              }}
            />
          );
        })}
      </div>

      {/* Row range navigation */}
      <div className="gp-nav">
        <button
          className="gp-nav__btn"
          disabled={rowOffset === 0}
          onClick={() => setRowOffset((o) => Math.max(0, o - PICKER_ROWS))}
          aria-label="Previous rows"
        >
          ↑
        </button>
        <span className="gp-nav__label">
          rows {rowOffset + 1}–{rowOffset + PICKER_ROWS}
        </span>
        <button
          className="gp-nav__btn"
          onClick={() => setRowOffset((o) => o + PICKER_ROWS)}
          aria-label="Next rows"
        >
          ↓
        </button>
      </div>

      {/* Info line */}
      <div className="gp-info">
        <span>
          Col <b>{preview.col}</b>–<b>{preview.col + preview.colSpan - 1}</b>
        </span>
        <span aria-hidden="true">·</span>
        <span>
          Row <b>{preview.row}</b>–<b>{preview.row + preview.rowSpan - 1}</b>
        </span>
        <span aria-hidden="true">·</span>
        <span>
          {preview.colSpan}×{preview.rowSpan} cells
        </span>
      </div>
    </div>
  );
}
