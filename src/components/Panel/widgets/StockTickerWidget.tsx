import { useMemo } from 'react';
import type { Panel } from '../../../types';

interface StockTickerWidgetProps {
  panel: Panel;
}

function pseudoPrice(symbol: string): { price: number; change: number } {
  const hash = symbol
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const base = (hash % 400) + 20;
  const minute = new Date().getMinutes();
  const wave = Math.sin((minute / 60) * Math.PI * 2 + hash) * 2.8;
  const price = base + wave;
  const change = Number((wave / base * 100).toFixed(2));
  return { price: Number(price.toFixed(2)), change };
}

export function StockTickerWidget({ panel }: StockTickerWidgetProps) {
  const symbols = panel.widgetConfig.stock?.symbols ?? [];

  const rows = useMemo(
    () => symbols.map((symbol) => ({ symbol, ...pseudoPrice(symbol) })),
    [symbols]
  );

  return (
    <div className="widget widget--stock widget--fade-in widget--loaded">
      {rows.length === 0 ? (
        <p className="widget__meta">Add stock symbols in the editor (demo values).</p>
      ) : (
        <ul className="widget-stock__list">
          {rows.map((row) => (
            <li key={row.symbol} className="widget-stock__item">
              <span className="widget-stock__symbol">{row.symbol}</span>
              <span className="widget-stock__price">{row.price.toFixed(2)}</span>
              <span className={`widget-stock__change ${row.change >= 0 ? 'widget-stock__change--up' : 'widget-stock__change--down'}`}>
                {row.change >= 0 ? '+' : ''}
                {row.change.toFixed(2)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
