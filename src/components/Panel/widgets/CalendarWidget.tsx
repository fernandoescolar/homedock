import { useMemo, useState } from 'react';
import type { Panel } from '../../../types';

interface CalendarWidgetProps {
  panel: Panel;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function CalendarWidget({ panel }: CalendarWidgetProps) {
  const cfg = panel.widgetConfig.calendar;
  const weekStartsOnMonday = cfg?.weekStartsOnMonday ?? true;
  const locale = cfg?.locale || navigator.language;

  const [anchor, setAnchor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const monthName = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(anchor),
    [anchor, locale]
  );

  const labels = useMemo(() => {
    const base = weekStartsOnMonday
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return base;
  }, [weekStartsOnMonday]);

  const cells = useMemo(() => {
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const count = daysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay();
    const offset = weekStartsOnMonday ? (firstDay === 0 ? 6 : firstDay - 1) : firstDay;

    const arr: Array<{ day: number | null; isToday: boolean }> = [];
    for (let i = 0; i < offset; i += 1) arr.push({ day: null, isToday: false });

    const today = new Date();
    for (let day = 1; day <= count; day += 1) {
      const isToday =
        year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
      arr.push({ day, isToday });
    }

    while (arr.length % 7 !== 0) arr.push({ day: null, isToday: false });
    return arr;
  }, [anchor, weekStartsOnMonday]);

  return (
    <div className="widget widget--calendar widget--fade-in widget--loaded">
      <div className="widget-calendar__header">
        <button type="button" className="widget-calendar__nav" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))}>
          ‹
        </button>
        <div className="widget-calendar__title">{monthName}</div>
        <button type="button" className="widget-calendar__nav" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))}>
          ›
        </button>
      </div>

      <div className="widget-calendar__grid">
        {labels.map((label) => (
          <div key={label} className="widget-calendar__label">{label}</div>
        ))}
        {cells.map((cell, index) => (
          <div
            key={`${cell.day ?? 'x'}-${index}`}
            className={`widget-calendar__cell ${cell.isToday ? 'widget-calendar__cell--today' : ''} ${cell.day ? '' : 'widget-calendar__cell--empty'}`}
          >
            {cell.day ?? ''}
          </div>
        ))}
      </div>
    </div>
  );
}
