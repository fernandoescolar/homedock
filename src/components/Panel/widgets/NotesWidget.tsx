import type { Panel } from '../../../types';

interface NotesWidgetProps {
  panel: Panel;
  isEdit: boolean;
}

export function NotesWidget({ panel, isEdit }: NotesWidgetProps) {
  const cfg = panel.widgetConfig.notes;
  const text = cfg?.text?.trim() || '';
  const fontSize = cfg?.fontSize ?? 1;

  if (!text) {
    return (
      <div className="widget widget--notes widget--fade-in widget--loaded">
        <p className="widget__meta">
          {isEdit ? 'Add note text in the editor.' : 'No note content yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="widget widget--notes widget--fade-in widget--loaded">
      <p className="widget-notes__text" style={{ fontSize: `${fontSize}rem` }}>
        {text}
      </p>
    </div>
  );
}
