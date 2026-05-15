import { useState } from 'react';
import type { Dispatch } from 'react';
import type { Panel } from '../../../types';
import type { Action } from '../../../store/reducer';

interface TodoWidgetProps {
  panel: Panel;
  dispatch: Dispatch<Action>;
  isEdit: boolean;
}

function uid(): string {
  return crypto.randomUUID();
}

export function TodoWidget({ panel, dispatch, isEdit }: TodoWidgetProps) {
  const cfg = panel.widgetConfig.todo;
  const items = cfg?.items ?? [];
  const showCompleted = cfg?.showCompleted ?? true;
  const [draft, setDraft] = useState('');

  const visible = showCompleted ? items : items.filter((item) => !item.completed);

  function updateItems(nextItems: typeof items) {
    dispatch({
      type: 'UPDATE_PANEL',
      payload: {
        id: panel.id,
        widgetConfig: {
          ...panel.widgetConfig,
          todo: {
            items: nextItems,
            showCompleted,
          },
        },
      },
    });
  }

  function addItem() {
    const text = draft.trim();
    if (!text) return;
    updateItems([...items, { id: uid(), text, completed: false }]);
    setDraft('');
  }

  return (
    <div className="widget widget--todo widget--fade-in widget--loaded">
      <div className="widget-todo__composer">
        <input
          className="widget-todo__input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add task"
          onKeyDown={(e) => {
            if (e.key === 'Enter') addItem();
          }}
        />
        <button type="button" className="widget-todo__add" onClick={addItem}>
          +
        </button>
      </div>

      <ul className="widget-todo__list">
        {visible.map((item) => (
          <li key={item.id} className={`widget-todo__item ${item.completed ? 'widget-todo__item--done' : ''}`}>
            <label>
              <input
                type="checkbox"
                checked={item.completed}
                onChange={(e) => {
                  updateItems(
                    items.map((candidate) =>
                      candidate.id === item.id
                        ? { ...candidate, completed: e.target.checked }
                        : candidate
                    )
                  );
                }}
              />
              <span>{item.text}</span>
            </label>
            {isEdit && (
              <button
                type="button"
                className="widget-todo__delete"
                onClick={() => updateItems(items.filter((candidate) => candidate.id !== item.id))}
              >
                ×
              </button>
            )}
          </li>
        ))}
        {visible.length === 0 && <li className="widget__meta">No tasks yet.</li>}
      </ul>
    </div>
  );
}
