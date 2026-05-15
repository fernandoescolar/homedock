import { useEffect, useMemo, useRef, useState } from 'react';
import type { SearchableLink } from '../../utils/search';
import { rankLinks } from '../../utils/search';
import './LinkSearchOverlay.css';

interface LinkSearchOverlayProps {
  links: SearchableLink[];
  onClose: () => void;
}

export function LinkSearchOverlay({ links, onClose }: LinkSearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => rankLinks(links, query), [links, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector<HTMLButtonElement>('[data-active="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function openLink(item: SearchableLink) {
    if (item.openInNewTab) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.assign(item.url);
    }
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length === 0) return;
      setActiveIndex((prev) => (prev + 1) % results.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length === 0) return;
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const selected = results[activeIndex];
      if (selected) openLink(selected);
    }
  }

  return (
    <div className="link-search" role="dialog" aria-modal="true" aria-labelledby="link-search-title">
      <button className="link-search__backdrop" onClick={onClose} aria-label="Close quick search" />
      <div className="link-search__card" role="document">
        <div className="link-search__header">
          <h2 id="link-search-title">Quick link search</h2>
          <p>Use Ctrl/Cmd+K to open, arrows to navigate, Enter to open.</p>
        </div>

        <input
          ref={inputRef}
          className="link-search__input"
          type="text"
          placeholder="Search by name, URL, or panel..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Search links"
        />

        <ul ref={listRef} className="link-search__results" role="listbox" aria-label="Search results">
          {results.length === 0 && (
            <li className="link-search__empty" role="option" aria-selected="false">
              {links.length === 0 ? 'No links available yet.' : 'No results for this search.'}
            </li>
          )}

          {results.map((item, index) => (
            <li key={`${item.panelId}-${item.id}`} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={`link-search__item ${index === activeIndex ? 'link-search__item--active' : ''}`}
                data-active={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => openLink(item)}
              >
                <div className="link-search__item-main">{item.label || item.url}</div>
                <div className="link-search__item-sub">{item.panelTitle} · {item.url}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
