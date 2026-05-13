import type { ExportSchema, Panel, PanelStyle, Link } from '../types';
import { analyzePanelsForCollisions, GRID_COLS } from './grid';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && isFinite(v);
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}

function validateBackground(background: unknown): string[] {
  const errors: string[] = [];
  if (!background || typeof background !== 'object') {
    errors.push('background must be an object');
    return errors;
  }

  const bg = background as Record<string, unknown>;
  if (
    bg.mode !== 'daily' &&
    bg.mode !== 'solid' &&
    bg.mode !== 'gradient' &&
    bg.mode !== 'image'
  ) {
    errors.push("background.mode must be 'daily', 'solid', 'gradient', or 'image'");
  }
  if (bg.solidColor !== undefined && !isString(bg.solidColor)) {
    errors.push('background.solidColor must be a string');
  }
  if (bg.gradientFrom !== undefined && !isString(bg.gradientFrom)) {
    errors.push('background.gradientFrom must be a string');
  }
  if (bg.gradientTo !== undefined && !isString(bg.gradientTo)) {
    errors.push('background.gradientTo must be a string');
  }
  if (bg.gradientAngle !== undefined && !isNumber(bg.gradientAngle)) {
    errors.push('background.gradientAngle must be a number');
  }
  if (bg.imageUrl !== undefined && !isString(bg.imageUrl)) {
    errors.push('background.imageUrl must be a string');
  }

  return errors;
}

function validateStyle(s: unknown, prefix: string): string[] {
  const errors: string[] = [];
  if (!s || typeof s !== 'object') {
    errors.push(`${prefix}.style must be an object`);
    return errors;
  }
  const style = s as Record<string, unknown>;
  if (!isNumber(style.bgOpacity)) errors.push(`${prefix}.style.bgOpacity must be a number`);
  if (!isNumber(style.blur)) errors.push(`${prefix}.style.blur must be a number`);
  if (!isNumber(style.borderRadius)) errors.push(`${prefix}.style.borderRadius must be a number`);
  if (!isString(style.textColor)) errors.push(`${prefix}.style.textColor must be a string`);
  if (!isString(style.borderColor)) errors.push(`${prefix}.style.borderColor must be a string`);
  if (!isNumber(style.borderOpacity)) errors.push(`${prefix}.style.borderOpacity must be a number`);
  return errors;
}

function validateLink(l: unknown, prefix: string): string[] {
  const errors: string[] = [];
  if (!l || typeof l !== 'object') {
    errors.push(`${prefix} must be an object`);
    return errors;
  }
  const link = l as Record<string, unknown>;
  if (!isString(link.id)) errors.push(`${prefix}.id must be a string`);
  if (!isString(link.label)) errors.push(`${prefix}.label must be a string`);
  if (!isString(link.url)) errors.push(`${prefix}.url must be a string`);
  return errors;
}

function validateWidgetConfig(panel: Record<string, unknown>, prefix: string): string[] {
  const errors: string[] = [];
  const widgetType = panel.widgetType ?? 'links';

  if (
    widgetType !== 'links' &&
    widgetType !== 'clock' &&
    widgetType !== 'weather' &&
    widgetType !== 'rss'
  ) {
    errors.push(`${prefix}.widgetType must be 'links', 'clock', 'weather', or 'rss'`);
    return errors;
  }

  if (panel.widgetConfig !== undefined && (typeof panel.widgetConfig !== 'object' || panel.widgetConfig === null)) {
    errors.push(`${prefix}.widgetConfig must be an object`);
    return errors;
  }

  const cfg = (panel.widgetConfig as Record<string, unknown>) ?? {};

  if (widgetType === 'clock') {
    const clock = (cfg.clock as Record<string, unknown>) ?? {};
    if (
      clock.mode !== undefined &&
      clock.mode !== 'digital' &&
      clock.mode !== 'analog'
    ) {
      errors.push(`${prefix}.widgetConfig.clock.mode must be 'digital' or 'analog'`);
    }
    if (clock.timeZone !== undefined && !isString(clock.timeZone)) {
      errors.push(`${prefix}.widgetConfig.clock.timeZone must be a string`);
    }
  }

  if (widgetType === 'weather') {
    const weather = (cfg.weather as Record<string, unknown>) ?? {};
    if (weather.city !== undefined && !isString(weather.city)) {
      errors.push(`${prefix}.widgetConfig.weather.city must be a string`);
    }
    if (weather.latitude !== undefined && !isNumber(weather.latitude)) {
      errors.push(`${prefix}.widgetConfig.weather.latitude must be a number`);
    }
    if (weather.longitude !== undefined && !isNumber(weather.longitude)) {
      errors.push(`${prefix}.widgetConfig.weather.longitude must be a number`);
    }
  }

  if (widgetType === 'rss') {
    const rss = (cfg.rss as Record<string, unknown>) ?? {};
    if (rss.feedUrl !== undefined && !isString(rss.feedUrl)) {
      errors.push(`${prefix}.widgetConfig.rss.feedUrl must be a string`);
    }
    if (rss.maxItems !== undefined && !isNumber(rss.maxItems)) {
      errors.push(`${prefix}.widgetConfig.rss.maxItems must be a number`);
    }
  }

  return errors;
}

function validatePanel(p: unknown, index: number): string[] {
  const prefix = `panels[${index}]`;
  const errors: string[] = [];
  if (!p || typeof p !== 'object') {
    errors.push(`${prefix} must be an object`);
    return errors;
  }
  const panel = p as Record<string, unknown>;
  if (!isString(panel.id)) errors.push(`${prefix}.id must be a string`);
  if (!isString(panel.title)) errors.push(`${prefix}.title must be a string`);
  if (panel.showTitle !== undefined && !isBoolean(panel.showTitle)) {
    errors.push(`${prefix}.showTitle must be a boolean`);
  }
  if (!isNumber(panel.col)) errors.push(`${prefix}.col must be a number`);
  if (!isNumber(panel.row)) errors.push(`${prefix}.row must be a number`);
  if (!isNumber(panel.colSpan)) errors.push(`${prefix}.colSpan must be a number`);
  if (!isNumber(panel.rowSpan)) errors.push(`${prefix}.rowSpan must be a number`);
  if (isNumber(panel.col) && panel.col < 1) errors.push(`${prefix}.col must be >= 1`);
  if (isNumber(panel.row) && panel.row < 1) errors.push(`${prefix}.row must be >= 1`);
  if (isNumber(panel.colSpan) && panel.colSpan < 1) errors.push(`${prefix}.colSpan must be >= 1`);
  if (isNumber(panel.rowSpan) && panel.rowSpan < 1) errors.push(`${prefix}.rowSpan must be >= 1`);
  if (isNumber(panel.col) && panel.col > GRID_COLS) {
    errors.push(`${prefix}.col must be <= ${GRID_COLS}`);
  }
  if (
    isNumber(panel.col) &&
    isNumber(panel.colSpan) &&
    panel.col + panel.colSpan - 1 > GRID_COLS
  ) {
    errors.push(`${prefix} exceeds grid width (${GRID_COLS} columns)`);
  }
  if (
    panel.linkDisplay !== undefined &&
    panel.linkDisplay !== 'list' &&
    panel.linkDisplay !== 'grid'
  ) {
    errors.push(`${prefix}.linkDisplay must be 'list' or 'grid'`);
  }
  errors.push(...validateWidgetConfig(panel, prefix));
  errors.push(...validateStyle(panel.style, prefix));
  if (!Array.isArray(panel.links)) {
    errors.push(`${prefix}.links must be an array`);
  } else {
    panel.links.forEach((l: unknown, i: number) =>
      errors.push(...validateLink(l, `${prefix}.links[${i}]`))
    );
  }
  return errors;
}

export function validateExportSchema(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Root must be a JSON object'] };
  }

  const obj = data as Record<string, unknown>;

  if (obj.schemaVersion !== 1) {
    errors.push('schemaVersion must be 1');
  }

  if (!isString(obj.exportedAt)) {
    errors.push('exportedAt must be a string (ISO 8601 date)');
  }

  if (!Array.isArray(obj.panels)) {
    errors.push('panels must be an array');
  } else {
    obj.panels.forEach((panel: unknown, i: number) =>
      errors.push(...validatePanel(panel, i))
    );

    if (errors.length === 0) {
      const collisionErrors = analyzePanelsForCollisions(obj.panels as Panel[]);
      errors.push(...collisionErrors);
    }
  }

  if (obj.background !== undefined) {
    errors.push(...validateBackground(obj.background));
  }

  return { valid: errors.length === 0, errors };
}

// Re-export types for convenience
export type { ExportSchema, Panel, PanelStyle, Link };
