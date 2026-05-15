import type { PanelStyle } from '../types';

export interface PanelStyleTemplate {
  id: string;
  name: string;
  style: PanelStyle;
}

export const PANEL_STYLE_TEMPLATES: PanelStyleTemplate[] = [
  {
    id: 'glass-light',
    name: 'Glass Light',
    style: {
      bgOpacity: 0.12,
      blur: 14,
      borderRadius: 18,
      textColor: '#f7fbff',
      borderColor: '#c8e1ff',
      borderOpacity: 0.34,
    },
  },
  {
    id: 'neon-outline',
    name: 'Neon Outline',
    style: {
      bgOpacity: 0.07,
      blur: 8,
      borderRadius: 12,
      textColor: '#e9fff6',
      borderColor: '#32ffd8',
      borderOpacity: 0.72,
    },
  },
  {
    id: 'paper-soft',
    name: 'Paper Soft',
    style: {
      bgOpacity: 0.3,
      blur: 0,
      borderRadius: 8,
      textColor: '#f6f8fc',
      borderColor: '#d6dbe6',
      borderOpacity: 0.28,
    },
  },
  {
    id: 'dense-contrast',
    name: 'Dense Contrast',
    style: {
      bgOpacity: 0.48,
      blur: 4,
      borderRadius: 16,
      textColor: '#ffffff',
      borderColor: '#ffffff',
      borderOpacity: 0.55,
    },
  },
];
