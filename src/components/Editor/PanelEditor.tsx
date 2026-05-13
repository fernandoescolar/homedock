import type { Dispatch } from 'react';
import { useCallback, useMemo, useState } from 'react';
import type { Panel, WidgetType, ClockWidgetConfig, WeatherWidgetConfig } from '../../types';
import type { Action } from '../../store/reducer';
import { getFaviconUrl } from '../../utils/favicon';
import { GridPicker, GRID_COLS } from './GridPicker';
import { normalizePanelPlacement, panelHasCollision } from '../../utils/grid';
import './PanelEditor.css';

interface PanelEditorProps {
  panel: Panel;
  panels: Panel[];
  dispatch: Dispatch<Action>;
  onClose: () => void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pe-field">
      <label className="pe-field__label">{label}</label>
      {children}
    </div>
  );
}

export function PanelEditor({ panel, panels, dispatch, onClose }: PanelEditorProps) {
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const [weatherLocationStatus, setWeatherLocationStatus] = useState<string | null>(null);
  const [isResolvingWeatherLocation, setIsResolvingWeatherLocation] = useState(false);

  const otherPanels = useMemo(
    () => panels.filter((p) => p.id !== panel.id),
    [panels, panel.id]
  );

  function updatePanel(partial: Partial<Omit<Panel, 'id'>>) {
    const placementPatch =
      partial.col !== undefined ||
      partial.row !== undefined ||
      partial.colSpan !== undefined ||
      partial.rowSpan !== undefined;

    if (placementPatch) {
      const candidate = {
        ...panel,
        ...partial,
      };
      const normalized = normalizePanelPlacement(candidate);
      const next = { ...candidate, ...normalized };

      if (panelHasCollision(next, otherPanels)) {
        setLayoutError('That position overlaps another panel. Choose another area.');
        return;
      }
    }

    setLayoutError(null);
    dispatch({ type: 'UPDATE_PANEL', payload: { id: panel.id, ...partial } });
  }

  function updateStyle(partial: Partial<Panel['style']>) {
    updatePanel({ style: { ...panel.style, ...partial } });
  }

  function updateWidgetType(nextType: WidgetType) {
    const nextConfig = { ...panel.widgetConfig };
    if (nextType === 'clock' && !nextConfig.clock) {
      nextConfig.clock = { mode: 'digital', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    }
    if (nextType === 'weather' && !nextConfig.weather) {
      nextConfig.weather = { city: 'Madrid', latitude: 40.4168, longitude: -3.7038 };
    }
    if (nextType === 'rss' && !nextConfig.rss) {
      nextConfig.rss = { feedUrl: 'https://hnrss.org/frontpage', maxItems: 5 };
    }
    updatePanel({ widgetType: nextType, widgetConfig: nextConfig });
  }

  const handleGridChange = useCallback(
    (col: number, row: number, colSpan: number, rowSpan: number) => {
      updatePanel({ col, row, colSpan, rowSpan });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [panel.id]
  );

  function handleDeletePanel() {
    if (window.confirm(`Delete panel "${panel.title || 'this panel'}"?`)) {
      dispatch({ type: 'DELETE_PANEL', payload: { id: panel.id } });
      onClose();
    }
  }

  function handleSetFixedWeatherLocation() {
    if (!navigator.geolocation) {
      setWeatherLocationStatus('Geolocation is not available in this browser.');
      return;
    }

    setIsResolvingWeatherLocation(true);
    setWeatherLocationStatus(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude.toFixed(4));
        const longitude = Number(position.coords.longitude.toFixed(4));

        updatePanel({
          widgetConfig: {
            ...panel.widgetConfig,
            weather: {
              city: panel.widgetConfig.weather?.city || 'Current Location',
              latitude,
              longitude,
              useGeolocation: false,
            },
          },
        });

        setWeatherLocationStatus(`Fixed coordinates set: ${latitude}, ${longitude}`);
        setIsResolvingWeatherLocation(false);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setWeatherLocationStatus('Location permission denied.');
        } else if (error.code === error.TIMEOUT) {
          setWeatherLocationStatus('Could not get location in time. Try again.');
        } else {
          setWeatherLocationStatus('Unable to get current location.');
        }
        setIsResolvingWeatherLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  function updateClockConfig(partial: Partial<ClockWidgetConfig>) {
    updatePanel({
      widgetConfig: {
        ...panel.widgetConfig,
        clock: {
          mode: 'digital',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...panel.widgetConfig.clock,
          ...partial,
        },
      },
    });
  }

  function updateWeatherConfig(partial: Partial<WeatherWidgetConfig>) {
    updatePanel({
      widgetConfig: {
        ...panel.widgetConfig,
        weather: {
          city: '',
          latitude: 40.4168,
          longitude: -3.7038,
          ...panel.widgetConfig.weather,
          ...partial,
        },
      },
    });
  }

  return (
    <aside className="panel-editor" aria-label="Panel editor">
      {/* Header */}
      <div className="pe-header">
        <h2 className="pe-header__title">Edit Panel</h2>
        <button
          className="pe-header__close"
          onClick={onClose}
          aria-label="Close editor"
        >
          ×
        </button>
      </div>

      <div className="pe-body">
        {/* ── Basic properties ─────────────────────────────────── */}
        <section className="pe-section">
          <Field label="Title">
            <input
              className="pe-input"
              type="text"
              value={panel.title}
              onChange={(e) => updatePanel({ title: e.target.value })}
              placeholder="Panel title"
            />
          </Field>

          <label className="pe-check">
            <input
              type="checkbox"
              checked={panel.showTitle ?? true}
              onChange={(e) => updatePanel({ showTitle: e.target.checked })}
            />
            <span>Show panel title in view mode</span>
          </label>

          <Field label="Widget type">
            <select
              className="pe-input"
              value={panel.widgetType ?? 'links'}
              onChange={(e) => updateWidgetType(e.target.value as WidgetType)}
            >
              <option value="links">Links</option>
              <option value="clock">Clock</option>
              <option value="weather">Weather</option>
              <option value="rss">RSS</option>
            </select>
          </Field>

          {/* ── Grid picker ───────────────────────────────── */}
          <h3 className="pe-section__title" style={{ marginBottom: 4 }}>Position &amp; size</h3>
          <GridPicker
            col={panel.col}
            row={panel.row}
            colSpan={panel.colSpan}
            rowSpan={panel.rowSpan}
            onChange={handleGridChange}
          />
          {layoutError && (
            <p className="pe-layout-error" aria-live="polite">{layoutError}</p>
          )}

          {/* Precise numeric controls */}
          <div className="pe-row">
            <Field label="Col start">
              <input
                className="pe-input pe-input--number"
                type="number"
                value={panel.col}
                min={1}
                max={GRID_COLS}
                onChange={(e) =>
                  updatePanel({ col: Math.max(1, Math.min(GRID_COLS, Number(e.target.value))) })
                }
              />
            </Field>
            <Field label="Row start">
              <input
                className="pe-input pe-input--number"
                type="number"
                value={panel.row}
                min={1}
                onChange={(e) =>
                  updatePanel({ row: Math.max(1, Number(e.target.value)) })
                }
              />
            </Field>
          </div>

          <div className="pe-row">
            <Field label="Col span">
              <input
                className="pe-input pe-input--number"
                type="number"
                value={panel.colSpan}
                min={1}
                max={GRID_COLS - panel.col + 1}
                onChange={(e) =>
                  updatePanel({
                    colSpan: Math.max(1, Math.min(GRID_COLS - panel.col + 1, Number(e.target.value))),
                  })
                }
              />
            </Field>
            <Field label="Row span">
              <input
                className="pe-input pe-input--number"
                type="number"
                value={panel.rowSpan}
                min={1}
                onChange={(e) =>
                  updatePanel({ rowSpan: Math.max(1, Number(e.target.value)) })
                }
              />
            </Field>
          </div>

          {(panel.widgetType ?? 'links') === 'links' && (
            <Field label="Link display">
              <div className="pe-segment" role="group" aria-label="Link display mode">
                <button
                  type="button"
                  className={`pe-segment__btn${(panel.linkDisplay ?? 'list') === 'list' ? ' pe-segment__btn--active' : ''}`}
                  onClick={() => updatePanel({ linkDisplay: 'list' })}
                  title="List — small icon + label in a row"
                >
                  ☰ List
                </button>
                <button
                  type="button"
                  className={`pe-segment__btn${(panel.linkDisplay ?? 'list') === 'grid' ? ' pe-segment__btn--active' : ''}`}
                  onClick={() => updatePanel({ linkDisplay: 'grid' })}
                  title="Grid — big icon with label below"
                >
                  ⊞ Grid
                </button>
              </div>
            </Field>
          )}
        </section>

        {(panel.widgetType ?? 'links') === 'clock' && (
          <section className="pe-section">
            <h3 className="pe-section__title">Clock</h3>
            <Field label="Mode">
              <div className="pe-segment" role="group" aria-label="Clock mode">
                <button
                  type="button"
                  className={`pe-segment__btn${(panel.widgetConfig.clock?.mode ?? 'digital') === 'digital' ? ' pe-segment__btn--active' : ''}`}
                  onClick={() => updateClockConfig({ mode: 'digital' })}
                >
                  Digital
                </button>
                <button
                  type="button"
                  className={`pe-segment__btn${(panel.widgetConfig.clock?.mode ?? 'digital') === 'analog' ? ' pe-segment__btn--active' : ''}`}
                  onClick={() => updateClockConfig({ mode: 'analog' })}
                >
                  Analog
                </button>
              </div>
            </Field>

            <Field label="Time zone">
              <input
                className="pe-input"
                type="text"
                value={panel.widgetConfig.clock?.timeZone ?? ''}
                placeholder="Europe/Madrid"
                onChange={(e) => updateClockConfig({ timeZone: e.target.value })}
              />
            </Field>

            <label className="pe-check">
              <input
                type="checkbox"
                checked={panel.widgetConfig.clock?.showTimeZone ?? true}
                onChange={(e) => updateClockConfig({ showTimeZone: e.target.checked })}
              />
              <span>Show time zone in widget</span>
            </label>

            {(panel.widgetConfig.clock?.mode ?? 'digital') === 'digital' && (
              <Field label={`Font size · ${panel.widgetConfig.clock?.fontSize ?? 3}rem`}>
                <input
                  className="pe-range"
                  type="range"
                  min={1}
                  max={8}
                  step={0.25}
                  value={panel.widgetConfig.clock?.fontSize ?? 3}
                  onChange={(e) => updateClockConfig({ fontSize: Number(e.target.value) })}
                />
              </Field>
            )}

            <div className="pe-row">
              <Field label="Text color">
                <input
                  type="color"
                  className="pe-color"
                  value={panel.widgetConfig.clock?.textColor || '#ffffff'}
                  onChange={(e) => updateClockConfig({ textColor: e.target.value })}
                />
              </Field>
              <Field label="Border color">
                <input
                  type="color"
                  className="pe-color"
                  value={panel.widgetConfig.clock?.textBorderColor || '#000000'}
                  onChange={(e) => updateClockConfig({ textBorderColor: e.target.value })}
                />
              </Field>
            </div>
          </section>
        )}

        {(panel.widgetType ?? 'links') === 'weather' && (
          <section className="pe-section">
            <h3 className="pe-section__title">Weather</h3>
            <Field label="City">
              <input
                className="pe-input"
                type="text"
                value={panel.widgetConfig.weather?.city ?? ''}
                onChange={(e) => updateWeatherConfig({ city: e.target.value })}
              />
            </Field>
            <div className="pe-row">
              <Field label="Latitude">
                <input
                  className="pe-input pe-input--number"
                  type="number"
                  step={0.0001}
                  value={panel.widgetConfig.weather?.latitude ?? 0}
                  onChange={(e) => updateWeatherConfig({ latitude: Number(e.target.value) })}
                />
              </Field>
              <Field label="Longitude">
                <input
                  className="pe-input pe-input--number"
                  type="number"
                  step={0.0001}
                  value={panel.widgetConfig.weather?.longitude ?? 0}
                  onChange={(e) => updateWeatherConfig({ longitude: Number(e.target.value) })}
                />
              </Field>
            </div>

            <label className="pe-check">
              <input
                type="checkbox"
                checked={panel.widgetConfig.weather?.useGeolocation ?? false}
                onChange={(e) => updateWeatherConfig({ useGeolocation: e.target.checked })}
              />
              <span>Use live device geolocation for weather</span>
            </label>

            <button
              type="button"
              className="pe-btn"
              onClick={handleSetFixedWeatherLocation}
              disabled={isResolvingWeatherLocation}
            >
              {isResolvingWeatherLocation ? 'Getting current location…' : 'Set current location as fixed coordinates'}
            </button>

            {weatherLocationStatus && (
              <p className="pe-note" aria-live="polite">{weatherLocationStatus}</p>
            )}

            <div className="pe-row">
              <Field label="Text color">
                <input
                  type="color"
                  className="pe-color"
                  value={panel.widgetConfig.weather?.textColor || '#ffffff'}
                  onChange={(e) => updateWeatherConfig({ textColor: e.target.value })}
                />
              </Field>
              <Field label="Border color">
                <input
                  type="color"
                  className="pe-color"
                  value={panel.widgetConfig.weather?.textBorderColor || '#000000'}
                  onChange={(e) => updateWeatherConfig({ textBorderColor: e.target.value })}
                />
              </Field>
            </div>
          </section>
        )}

        {(panel.widgetType ?? 'links') === 'rss' && (
          <section className="pe-section">
            <h3 className="pe-section__title">RSS</h3>
            <Field label="Feed URL">
              <input
                className="pe-input"
                type="url"
                value={panel.widgetConfig.rss?.feedUrl ?? ''}
                placeholder="https://example.com/feed.xml"
                onChange={(e) =>
                  updatePanel({
                    widgetConfig: {
                      ...panel.widgetConfig,
                      rss: {
                        feedUrl: e.target.value,
                        maxItems: panel.widgetConfig.rss?.maxItems ?? 5,
                      },
                    },
                  })
                }
              />
            </Field>
            <Field label="Max items">
              <input
                className="pe-input pe-input--number"
                type="number"
                min={1}
                max={15}
                value={panel.widgetConfig.rss?.maxItems ?? 5}
                onChange={(e) =>
                  updatePanel({
                    widgetConfig: {
                      ...panel.widgetConfig,
                      rss: {
                        feedUrl: panel.widgetConfig.rss?.feedUrl ?? '',
                        maxItems: Math.max(1, Math.min(15, Number(e.target.value))),
                      },
                    },
                  })
                }
              />
            </Field>
          </section>
        )}

        {/* ── Appearance ───────────────────────────────────────── */}
        <section className="pe-section">
          <h3 className="pe-section__title">Appearance</h3>

          <Field label={`Background opacity · ${Math.round(panel.style.bgOpacity * 100)}%`}>
            <input
              className="pe-range"
              type="range"
              min={0.03}
              max={0.9}
              step={0.01}
              value={panel.style.bgOpacity}
              onChange={(e) => updateStyle({ bgOpacity: Number(e.target.value) })}
            />
          </Field>

          <Field label={`Blur · ${panel.style.blur}px`}>
            <input
              className="pe-range"
              type="range"
              min={0}
              max={20}
              step={1}
              value={panel.style.blur}
              onChange={(e) => updateStyle({ blur: Number(e.target.value) })}
            />
          </Field>

          <Field label={`Border radius · ${panel.style.borderRadius}px`}>
            <input
              className="pe-range"
              type="range"
              min={0}
              max={40}
              step={1}
              value={panel.style.borderRadius}
              onChange={(e) =>
                updateStyle({ borderRadius: Number(e.target.value) })
              }
            />
          </Field>

          <div className="pe-row">
            <Field label="Text color">
              <input
                className="pe-color"
                type="color"
                value={panel.style.textColor}
                onChange={(e) => updateStyle({ textColor: e.target.value })}
              />
            </Field>
            <Field label="Border color">
              <input
                className="pe-color"
                type="color"
                value={panel.style.borderColor}
                onChange={(e) => updateStyle({ borderColor: e.target.value })}
              />
            </Field>
          </div>

          <Field label={`Border opacity · ${Math.round(panel.style.borderOpacity * 100)}%`}>
            <input
              className="pe-range"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={panel.style.borderOpacity}
              onChange={(e) =>
                updateStyle({ borderOpacity: Number(e.target.value) })
              }
            />
          </Field>
        </section>

        {/* ── Links ────────────────────────────────────────────── */}
        {(panel.widgetType ?? 'links') === 'links' && (
        <section className="pe-section">
          <h3 className="pe-section__title">Links</h3>

          <div className="pe-links">
            {panel.links.map((link) => (
              <div key={link.id} className="pe-link">
                <div className="pe-link__preview">
                  {link.url && getFaviconUrl(link.url) ? (
                    <img
                      src={getFaviconUrl(link.url)}
                      width={14}
                      height={14}
                      alt=""
                      className="pe-link__favicon"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="pe-link__favicon-fb">🔗</span>
                  )}
                </div>
                <div className="pe-link__inputs">
                  <input
                    className="pe-input pe-input--sm"
                    type="text"
                    placeholder="Label"
                    value={link.label}
                    onChange={(e) =>
                      dispatch({
                        type: 'UPDATE_LINK',
                        payload: {
                          panelId: panel.id,
                          link: { ...link, label: e.target.value },
                        },
                      })
                    }
                  />
                  <input
                    className="pe-input pe-input--sm"
                    type="url"
                    placeholder="https://…"
                    value={link.url}
                    onChange={(e) =>
                      dispatch({
                        type: 'UPDATE_LINK',
                        payload: {
                          panelId: panel.id,
                          link: { ...link, url: e.target.value },
                        },
                      })
                    }
                  />
                </div>
                <button
                  className="pe-link__delete"
                  onClick={() =>
                    dispatch({
                      type: 'DELETE_LINK',
                      payload: { panelId: panel.id, linkId: link.id },
                    })
                  }
                  title="Delete link"
                  aria-label="Delete link"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            className="pe-btn pe-btn--add"
            onClick={() =>
              dispatch({ type: 'ADD_LINK', payload: { panelId: panel.id } })
            }
          >
            + Add Link
          </button>
        </section>
        )}

        {/* ── Danger zone ──────────────────────────────────────── */}
        <section className="pe-section pe-section--danger">
          <button className="pe-btn pe-btn--danger" onClick={handleDeletePanel}>
            🗑 Delete Panel
          </button>
        </section>
      </div>
    </aside>
  );
}
