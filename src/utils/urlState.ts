import type { AppState, ExportSchema } from '../types';
import { DEFAULT_BACKGROUND } from '../store/reducer';
import { validateExportSchema } from './validation';

interface ParsedUrlState {
  configState: ExportSchema | null;
  importUrl: string | null;
}

function toUrlSafeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const encoded = btoa(binary);
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromUrlSafeBase64(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLength);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function createShareUrl(state: AppState): string {
  const payload: ExportSchema = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    panels: state.panels,
    background: state.background,
  };
  const encoded = toUrlSafeBase64(JSON.stringify(payload));
  const current = new URL(window.location.href);
  current.searchParams.set('config', encoded);
  current.searchParams.delete('import');
  return current.toString();
}

export function parseUrlState(search: string): ParsedUrlState {
  const params = new URLSearchParams(search);
  const configParam = params.get('config');
  const importParam = params.get('import');

  let configState: ExportSchema | null = null;

  if (configParam) {
    try {
      const decoded = fromUrlSafeBase64(configParam);
      const parsed = JSON.parse(decoded);
      const validation = validateExportSchema(parsed);
      if (validation.valid) {
        configState = {
          ...(parsed as ExportSchema),
          background: {
            ...DEFAULT_BACKGROUND,
            ...((parsed as ExportSchema).background ?? {}),
          },
        };
      }
    } catch {
      configState = null;
    }
  }

  const importUrl = importParam && /^https:\/\//i.test(importParam) ? importParam : null;

  return {
    configState,
    importUrl,
  };
}
