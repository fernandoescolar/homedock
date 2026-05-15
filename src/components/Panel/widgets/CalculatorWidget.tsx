import { useMemo, useState } from 'react';
import type { Panel } from '../../../types';

interface CalculatorWidgetProps {
  panel: Panel;
}

const KEYS: ReadonlyArray<string> = [
  '7',
  '8',
  '9',
  '/',
  '4',
  '5',
  '6',
  '*',
  '1',
  '2',
  '3',
  '-',
  '0',
  '.',
  '=',
  '+',
  'C',
  '⌫',
];

function evaluateExpression(expression: string, precision: number): string {
  const safe = expression.replace(/\s+/g, '');
  if (!/^[0-9+\-*/().]+$/.test(safe)) {
    throw new Error('Invalid expression');
  }

  const result = Function(`"use strict"; return (${safe});`)();
  if (typeof result !== 'number' || !Number.isFinite(result)) {
    throw new Error('Invalid result');
  }

  return String(Number(result.toFixed(precision)));
}

export function CalculatorWidget({ panel }: CalculatorWidgetProps) {
  const precision = panel.widgetConfig.calculator?.precision ?? 4;
  const [expression, setExpression] = useState('');
  const [error, setError] = useState<string | null>(null);

  const display = useMemo(() => {
    if (error) return error;
    return expression || '0';
  }, [error, expression]);

  function push(value: string) {
    setError(null);
    setExpression((prev) => prev + value);
  }

  function backspace() {
    setError(null);
    setExpression((prev) => prev.slice(0, -1));
  }

  function clear() {
    setError(null);
    setExpression('');
  }

  function solve() {
    if (!expression.trim()) return;
    try {
      const result = evaluateExpression(expression, precision);
      setExpression(result);
      setError(null);
    } catch {
      setError('Error');
    }
  }

  return (
    <div className="widget widget--calculator widget--fade-in widget--loaded">
      <div className={`widget-calculator__display ${error ? 'widget-calculator__display--error' : ''}`}>
        {display}
      </div>
      <div className="widget-calculator__keys">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={`widget-calculator__key ${key === '=' ? 'widget-calculator__key--solve' : ''}`}
            onClick={() => {
              if (key === 'C') return clear();
              if (key === '⌫') return backspace();
              if (key === '=') return solve();
              return push(key);
            }}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
