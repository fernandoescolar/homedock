import { useState, useEffect } from 'react';
import type { Link, LinkDisplay } from '../../types';
import { getFaviconUrl } from '../../utils/favicon';
import './LinkItem.css';

interface LinkItemProps {
  link: Link;
  isEdit: boolean;
  display?: LinkDisplay;
}

export function LinkItem({ link, isEdit, display = 'list' }: LinkItemProps) {
  const [faviconSrc, setFaviconSrc] = useState<string>('');

  useEffect(() => {
    setFaviconSrc(getFaviconUrl(link.url));
  }, [link.url]);

  const smallIcon = faviconSrc ? (
    <img
      className="link-item__icon"
      src={faviconSrc}
      width={16}
      height={16}
      alt=""
      onError={() => setFaviconSrc('')}
    />
  ) : (
    <span className="link-item__icon link-item__icon--fallback" aria-hidden="true">
      🔗
    </span>
  );

  const bigIcon = faviconSrc ? (
    <img
      className="link-item__icon-big"
      src={faviconSrc}
      width={36}
      height={36}
      alt=""
      onError={() => setFaviconSrc('')}
    />
  ) : (
    <span className="link-item__icon-big link-item__icon-big--fallback" aria-hidden="true">
      🔗
    </span>
  );

  const label = link.label || link.url || 'Unnamed link';

  /* ── Grid variant ───────────────────────────────────────── */
  if (display === 'grid') {
    if (isEdit) {
      return (
        <span className="link-item link-item--grid link-item--edit">
          {bigIcon}
          <span className="link-item__grid-label">{label}</span>
        </span>
      );
    }
    return (
      <a
        className="link-item link-item--grid"
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        title={link.url}
      >
        {bigIcon}
        <span className="link-item__grid-label">{label}</span>
      </a>
    );
  }

  /* ── List variant (default) ─────────────────────────────── */
  if (isEdit) {
    return (
      <span className="link-item link-item--edit">
        {smallIcon}
        <span className="link-item__label">
          {label}
        </span>
      </span>
    );
  }

  return (
    <a
      className="link-item"
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      title={link.url}
    >
      {smallIcon}
      <span className="link-item__label">
        {link.label || link.url}
      </span>
    </a>
  );
}
