import { useCallback, useRef } from 'react';
import type React from 'react';

interface DragStart {
  active: boolean;
  mouseX: number;
  mouseY: number;
  panelX: number;
  panelY: number;
}

/**
 * Provides pointer-capture-based drag handlers for a draggable element.
 * The caller is responsible for attaching the returned handlers to the
 * drag handle element.
 */
export function useDraggable(
  id: string,
  currentX: number,
  currentY: number,
  onMove: (id: string, x: number, y: number) => void
) {
  const drag = useRef<DragStart>({
    active: false,
    mouseX: 0,
    mouseY: 0,
    panelX: 0,
    panelY: 0,
  });

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = {
        active: true,
        mouseX: e.clientX,
        mouseY: e.clientY,
        panelX: currentX,
        panelY: currentY,
      };
    },
    [currentX, currentY]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.mouseX;
      const dy = e.clientY - drag.current.mouseY;
      onMove(
        id,
        Math.max(0, drag.current.panelX + dx),
        Math.max(0, drag.current.panelY + dy)
      );
    },
    [id, onMove]
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    drag.current.active = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}
