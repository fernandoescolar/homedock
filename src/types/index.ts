export interface Link {
  id: string;
  label: string;
  url: string;
}

export interface PanelStyle {
  /** Background white-alpha opacity 0.05–0.9 */
  bgOpacity: number;
  /** Backdrop blur in px, 0–20 */
  blur: number;
  /** Border radius in px, 0–40 */
  borderRadius: number;
  /** Text color as hex, e.g. #ffffff */
  textColor: string;
  /** Border/accent color as hex, e.g. #ffffff */
  borderColor: string;
  /** Border opacity 0–1 */
  borderOpacity: number;
}

export type LinkDisplay = 'list' | 'grid';

export type WidgetType = 'links' | 'clock' | 'weather' | 'rss';

export interface ClockWidgetConfig {
  mode: 'digital' | 'analog';
  timeZone: string;
  showTimeZone?: boolean;
  /** Font size in rem for digital mode, default ~3 */
  fontSize?: number;
  /** Text color as CSS color string, e.g. '#ffffff' */
  textColor?: string;
  /** Text border/stroke color as CSS color string; empty = no border */
  textBorderColor?: string;
}

export interface WeatherWidgetConfig {
  city: string;
  latitude: number;
  longitude: number;
  useGeolocation?: boolean;
  /** Text color as CSS color string, e.g. '#ffffff' */
  textColor?: string;
  /** Text border/stroke color as CSS color string; empty = no border */
  textBorderColor?: string;
}

export interface RssWidgetConfig {
  feedUrl: string;
  maxItems: number;
}

export interface WidgetConfig {
  clock?: ClockWidgetConfig;
  weather?: WeatherWidgetConfig;
  rss?: RssWidgetConfig;
}

export interface Panel {
  id: string;
  title: string;
  /** Whether title bar text is shown in view mode */
  showTitle: boolean;
  /** Grid column start, 1-based (1–12) */
  col: number;
  /** Grid row start, 1-based */
  row: number;
  /** Columns to span (1–12) */
  colSpan: number;
  /** Rows to span (1–N) */
  rowSpan: number;
  links: Link[];
  style: PanelStyle;
  /** How links are displayed inside the panel */
  linkDisplay: LinkDisplay;
  /** Render behavior for the panel body */
  widgetType: WidgetType;
  widgetConfig: WidgetConfig;
}

export type AppMode = 'view' | 'edit';

export type BackgroundMode = 'daily' | 'solid' | 'gradient' | 'image';

export interface BackgroundConfig {
  mode: BackgroundMode;
  solidColor: string;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  imageUrl: string;
}

export interface AppState {
  schemaVersion: 1;
  panels: Panel[];
  mode: AppMode;
  background: BackgroundConfig;
}

export interface ExportSchema {
  schemaVersion: 1;
  exportedAt: string;
  panels: Panel[];
  background: BackgroundConfig;
}
