import './AboutHelp.css';

interface AboutHelpProps {
  onClose: () => void;
}

export function AboutHelp({ onClose }: AboutHelpProps) {
  return (
    <div className="about-help" role="dialog" aria-modal="true" aria-labelledby="about-help-title">
      <button className="about-help__backdrop" onClick={onClose} aria-label="Close help" />
      <section className="about-help__card" role="document">
        <header className="about-help__header">
          <h2 id="about-help-title">Help & About Homedock</h2>
          <button className="about-help__close" onClick={onClose} aria-label="Close help">
            ×
          </button>
        </header>

        <div className="about-help__content">
          <section className="about-help__section">
            <h3>About</h3>
            <p>
              Homedock is an open source dashboard developed by Fernando Escolar and hosted on GitHub.
            </p>
            <a
              className="about-help__link"
              href="https://github.com/fernandoescolar/homedock"
              target="_blank"
              rel="noreferrer"
            >
              Visit GitHub page
            </a>
          </section>

          <section className="about-help__section">
            <h3>Mini tutorial</h3>
            <ol>
              <li>Use Add Panel to create blocks in your dashboard.</li>
              <li>Drag panel headers to move them around the virtual grid.</li>
              <li>Resize panels by dragging their edges in edit mode.</li>
              <li>Open panel settings to switch widget type and style.</li>
              <li>Configure the global background from the Background button.</li>
              <li>Press Ctrl+K or Cmd+K to quickly find and open links.</li>
              <li>Use Export, Import, or Share URL to move your setup to another device.</li>
            </ol>
          </section>
        </div>
      </section>
    </div>
  );
}
