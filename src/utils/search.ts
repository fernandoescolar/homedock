import type { Panel } from '../types';

export interface SearchableLink {
  id: string;
  label: string;
  url: string;
  panelId: string;
  panelTitle: string;
  openInNewTab: boolean;
}

export interface RankedLink extends SearchableLink {
  score: number;
}

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

export function collectSearchableLinks(panels: Panel[]): SearchableLink[] {
  return panels.flatMap((panel) =>
    panel.links.map((link) => ({
      id: link.id,
      label: link.label,
      url: link.url,
      panelId: panel.id,
      panelTitle: panel.title || 'Untitled panel',
      openInNewTab: panel.openLinksInNewTab ?? true,
    }))
  );
}

export function rankLinks(links: SearchableLink[], query: string): RankedLink[] {
  const q = normalized(query);
  if (!q) {
    return links.slice(0, 60).map((link) => ({ ...link, score: 0 }));
  }

  const ranked = links
    .map((link) => {
      const label = normalized(link.label);
      const url = normalized(link.url);
      const panel = normalized(link.panelTitle);

      let score = -1;
      if (label === q) score = 120;
      else if (label.startsWith(q)) score = 95;
      else if (label.includes(q)) score = 80;
      else if (url.startsWith(q)) score = 70;
      else if (url.includes(q)) score = 55;
      else if (panel.includes(q)) score = 40;

      return { ...link, score };
    })
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));

  return ranked.slice(0, 60);
}
