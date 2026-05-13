import React, { useEffect, useMemo, useState } from 'react';
import type { Panel } from '../../types';

type WidgetProps = {
  panel: Panel;
  isEdit: boolean;
};

type WeatherData = {
  temperature: number;
  windSpeed: number;
  weatherCode: number;
};

type RssItem = {
  title: string;
  link: string;
};

type Rss2JsonResponse = {
  status?: string;
  items?: Array<{
    title?: string;
    link?: string;
  }>;
};

function getClockParts(date: Date, timeZone: string): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone,
  }).formatToParts(date);

  const getNum = (type: string): number => {
    const value = parts.find((p) => p.type === type)?.value ?? '0';
    return Number(value);
  };

  return {
    hours: getNum('hour'),
    minutes: getNum('minute'),
    seconds: getNum('second'),
  };
}

function makeTextStyle(
  textColor: string | undefined,
  textBorderColor: string | undefined
): React.CSSProperties {
  const style: React.CSSProperties = {};
  if (textColor) style.color = textColor;
  if (textBorderColor) {
    const c = textBorderColor;
    style.textShadow = `-1px -1px 0 ${c}, 1px -1px 0 ${c}, -1px 1px 0 ${c}, 1px 1px 0 ${c}`;
  }
  return style;
}

function getWeatherCodePresentation(weatherCode: number): { icon: string; label: string } {
  const code = Math.round(weatherCode);

  if (code === 0) return { icon: '☀️', label: 'Clear sky' };
  if (code === 1) return { icon: '🌤️', label: 'Mainly clear' };
  if (code === 2) return { icon: '⛅', label: 'Partly cloudy' };
  if (code === 3) return { icon: '☁️', label: 'Overcast' };
  if (code === 45) return { icon: '🌫️', label: 'Fog' };
  if (code === 48) return { icon: '🌫️', label: 'Depositing rime fog' };
  if (code === 51) return { icon: '🌦️', label: 'Light drizzle' };
  if (code === 53) return { icon: '🌦️', label: 'Moderate drizzle' };
  if (code === 55) return { icon: '🌧️', label: 'Dense drizzle' };
  if (code === 56) return { icon: '🌧️', label: 'Light freezing drizzle' };
  if (code === 57) return { icon: '🌧️', label: 'Dense freezing drizzle' };
  if (code === 61) return { icon: '🌧️', label: 'Slight rain' };
  if (code === 63) return { icon: '🌧️', label: 'Moderate rain' };
  if (code === 65) return { icon: '🌧️', label: 'Heavy rain' };
  if (code === 66) return { icon: '🌧️', label: 'Light freezing rain' };
  if (code === 67) return { icon: '🌧️', label: 'Heavy freezing rain' };
  if (code === 71) return { icon: '🌨️', label: 'Slight snowfall' };
  if (code === 73) return { icon: '🌨️', label: 'Moderate snowfall' };
  if (code === 75) return { icon: '❄️', label: 'Heavy snowfall' };
  if (code === 77) return { icon: '❄️', label: 'Snow grains' };
  if (code === 80) return { icon: '🌦️', label: 'Slight rain showers' };
  if (code === 81) return { icon: '🌦️', label: 'Moderate rain showers' };
  if (code === 82) return { icon: '⛈️', label: 'Violent rain showers' };
  if (code === 85) return { icon: '🌨️', label: 'Slight snow showers' };
  if (code === 86) return { icon: '❄️', label: 'Heavy snow showers' };
  if (code === 95) return { icon: '⛈️', label: 'Thunderstorm' };
  if (code === 96) return { icon: '⛈️', label: 'Thunderstorm with slight hail' };
  if (code === 99) return { icon: '⛈️', label: 'Thunderstorm with heavy hail' };

  return { icon: '🌡️', label: 'Unknown weather' };
}

function ClockWidget({ panel }: WidgetProps) {
  const [now, setNow] = useState(() => new Date());
  const cfg = panel.widgetConfig.clock;
  const mode = cfg?.mode ?? 'digital';
  const timeZone = cfg?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const textStyle = makeTextStyle(cfg?.textColor, cfg?.textBorderColor);
  const digitalStyle: React.CSSProperties = {
    ...textStyle,
    ...(cfg?.fontSize ? { fontSize: `${cfg.fontSize}rem` } : {}),
  };

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const formatted = useMemo(
    () =>
      new Intl.DateTimeFormat([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone,
      }).format(now),
    [now, timeZone]
  );

  const clockParts = useMemo(() => getClockParts(now, timeZone), [now, timeZone]);
  const secondAngle = clockParts.seconds * 6;
  const minuteAngle = clockParts.minutes * 6 + clockParts.seconds * 0.1;
  const hourAngle = (clockParts.hours % 12) * 30 + clockParts.minutes * 0.5 + clockParts.seconds / 120;

  return (
    <div className="widget widget--clock">
      {mode === 'analog' ? (
        <div className="widget-clock-analog" aria-label={`Analog clock ${formatted}`}>
          <svg viewBox="0 0 120 120" className="widget-clock-analog__svg" role="img">
            <circle cx="60" cy="60" r="56" className="widget-clock-analog__rim" />
            {Array.from({ length: 12 }, (_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const x1 = 60 + Math.sin(angle) * 45;
              const y1 = 60 - Math.cos(angle) * 45;
              const x2 = 60 + Math.sin(angle) * 52;
              const y2 = 60 - Math.cos(angle) * 52;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  className="widget-clock-analog__tick"
                />
              );
            })}

            <line
              x1="60"
              y1="60"
              x2="60"
              y2="34"
              className="widget-clock-analog__hand widget-clock-analog__hand--hour"
              transform={`rotate(${hourAngle} 60 60)`}
            />
            <line
              x1="60"
              y1="60"
              x2="60"
              y2="24"
              className="widget-clock-analog__hand widget-clock-analog__hand--minute"
              transform={`rotate(${minuteAngle} 60 60)`}
            />
            <line
              x1="60"
              y1="64"
              x2="60"
              y2="18"
              className="widget-clock-analog__hand widget-clock-analog__hand--second"
              transform={`rotate(${secondAngle} 60 60)`}
            />
            <circle cx="60" cy="60" r="3.5" className="widget-clock-analog__center" />
          </svg>
        </div>
      ) : (
        <div className="widget__value" style={digitalStyle}>{formatted}</div>
      )}
      {cfg?.showTimeZone !== false && <div className="widget__meta" style={textStyle}>{timeZone}</div>}
    </div>
  );
}

function WeatherWidget({ panel, isEdit }: WidgetProps) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const cfg = panel.widgetConfig.weather;

  const textStyle = makeTextStyle(cfg?.textColor, cfg?.textBorderColor);
  const weatherPresentation = data
    ? getWeatherCodePresentation(data.weatherCode)
    : null;

  // Try to get device geolocation on mount if enabled
  useEffect(() => {
    if (!cfg?.useGeolocation || isEdit) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        () => {
          // Silently fail and use fallback coordinates
        }
      );
    }
  }, [cfg?.useGeolocation, isEdit]);

  // Determine which coordinates to use
  const latitude = coords?.lat ?? cfg?.latitude;
  const longitude = coords?.lon ?? cfg?.longitude;

  useEffect(() => {
    async function run() {
      if (!latitude || !longitude) {
        setData(null);
        setError(isEdit ? 'Set latitude and longitude in editor or enable geolocation.' : 'Weather is not configured yet.');
        return;
      }
      try {
        setError(null);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Weather request failed');
        const json = (await res.json()) as {
          current?: { temperature_2m?: number; wind_speed_10m?: number; weather_code?: number };
        };
        setData({
          temperature: json.current?.temperature_2m ?? 0,
          windSpeed: json.current?.wind_speed_10m ?? 0,
          weatherCode: json.current?.weather_code ?? 0,
        });
      } catch {
        setError('Failed to load weather data.');
      }
    }

    run();
  }, [latitude, longitude, isEdit]);

  return (
    <div className="widget widget--weather">
      <div className="widget__title" style={textStyle}>{cfg?.city ? cfg.city : ''}</div>
      {error ? (
        <p className="widget__error">{error}</p>
      ) : data ? (
        <>
          <div className="widget-weather__main" style={textStyle}>
            <span className="widget-weather__icon" role="img" aria-label={weatherPresentation?.label ?? 'Weather'}>
              {weatherPresentation?.icon}
            </span>
            <span className="widget__value">{Math.round(data.temperature)} C</span>
          </div>
          <div className="widget__meta" style={textStyle}>{weatherPresentation?.label}</div>
          <div className="widget__meta" style={textStyle}>Wind {Math.round(data.windSpeed)} km/h</div>
        </>
      ) : (
        <p className="widget__meta" style={textStyle}>Loading...</p>
      )}
    </div>
  );
}

function timeoutSignal(ms: number): AbortSignal {
  return AbortSignal.timeout(ms);
}

function parseFeedXml(xml: string, maxItems: number): RssItem[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML');
  }

  const rssItems = Array.from(doc.querySelectorAll('item'));
  if (rssItems.length > 0) {
    return rssItems
      .slice(0, maxItems)
      .map((item) => ({
        title: item.querySelector('title')?.textContent?.trim() ?? 'Untitled',
        link: item.querySelector('link')?.textContent?.trim() ?? '#',
      }))
      .filter((item) => item.link && item.link !== '#');
  }

  const atomEntries = Array.from(doc.querySelectorAll('entry'));
  return atomEntries
    .slice(0, maxItems)
    .map((entry) => {
      const linkEl = entry.querySelector('link[rel="alternate"]') ?? entry.querySelector('link');
      const href = linkEl?.getAttribute('href')?.trim() ?? '#';
      const textLink = linkEl?.textContent?.trim() ?? '';
      return {
        title: entry.querySelector('title')?.textContent?.trim() ?? 'Untitled',
        link: href !== '#' ? href : textLink || '#',
      };
    })
    .filter((item) => item.link && item.link !== '#');
}

async function fetchXmlViaFallbacks(url: string): Promise<string> {
  const sources = [
    url,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
    `https://thingproxy.freeboard.io/fetch/${url}`,
  ];

  for (const source of sources) {
    try {
      const res = await fetch(source, { signal: timeoutSignal(10000) });
      if (!res.ok) continue;
      const text = await res.text();
      if (!text || text.trim().length < 20) continue;
      return text;
    } catch {
      // Try next fallback source
    }
  }

  throw new Error('No RSS source available');
}

async function fetchViaRss2Json(url: string, maxItems: number): Promise<RssItem[]> {
  const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
  const res = await fetch(endpoint, { signal: timeoutSignal(10000) });
  if (!res.ok) {
    throw new Error('rss2json unavailable');
  }

  const data = (await res.json()) as Rss2JsonResponse;
  if (data.status !== 'ok' || !Array.isArray(data.items)) {
    throw new Error('rss2json invalid response');
  }

  return data.items
    .slice(0, maxItems)
    .map((item) => ({
      title: item.title?.trim() || 'Untitled',
      link: item.link?.trim() || '#',
    }))
    .filter((item) => item.link !== '#');
}

function RssWidget({ panel, isEdit }: WidgetProps) {
  const [items, setItems] = useState<RssItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const cfg = panel.widgetConfig.rss;

  useEffect(() => {
    async function run() {
      const url = cfg?.feedUrl?.trim();
      const maxItems = cfg?.maxItems ?? 5;

      if (!url) {
        setItems([]);
        setError(isEdit ? 'Set feed URL in editor.' : 'RSS feed is not configured yet.');
        return;
      }

      try {
        setError(null);
        const xml = await fetchXmlViaFallbacks(url);
        const parsed = parseFeedXml(xml, maxItems);

        if (parsed.length > 0) {
          setItems(parsed);
          return;
        }

        const jsonFallback = await fetchViaRss2Json(url, maxItems);
        setItems(jsonFallback);
      } catch {
        setError('Failed to load RSS feed. Try another feed URL or check availability.');
      }
    }

    run();
  }, [cfg?.feedUrl, cfg?.maxItems, isEdit]);

  return (
    <div className="widget widget--rss">
      {error ? (
        <p className="widget__error">{error}</p>
      ) : (
        <ul className="widget__list">
          {items.map((item) => (
            <li key={`${item.link}-${item.title}`}>
              <a href={item.link} target="_blank" rel="noreferrer noopener">
                {item.title}
              </a>
            </li>
          ))}
          {items.length === 0 && <li className="widget__meta">No items yet.</li>}
        </ul>
      )}
    </div>
  );
}

export function WidgetContent(props: WidgetProps) {
  const type = props.panel.widgetType ?? 'links';
  if (type === 'clock') return <ClockWidget {...props} />;
  if (type === 'weather') return <WeatherWidget {...props} />;
  if (type === 'rss') return <RssWidget {...props} />;
  return null;
}
