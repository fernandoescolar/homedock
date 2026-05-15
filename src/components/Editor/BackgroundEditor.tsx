import { useRef, useState, type ChangeEvent } from 'react';
import type { BackgroundConfig } from '../../types';
import './BackgroundEditor.css';

interface BackgroundEditorProps {
  background: BackgroundConfig;
  onUpdate: (partial: Partial<BackgroundConfig>) => void;
  onClose: () => void;
}

export function BackgroundEditor({ background, onUpdate, onClose }: BackgroundEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const idPrefix = 'background-editor';

  function handlePickImage() {
    fileInputRef.current?.click();
  }

  function handleImageSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image file.');
      return;
    }

    const maxBytes = 8 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError('Image is too large. Please use one under 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        setUploadError('Failed to read image file.');
        return;
      }
      setUploadError(null);
      onUpdate({ mode: 'image', imageUrl: result });
      if (e.target) e.target.value = '';
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  }

  return (
    <aside className="background-editor" aria-label="Background settings">
      <div className="be-header">
        <h2 className="be-header__title">Background</h2>
        <button className="be-header__close" onClick={onClose} aria-label="Close background settings">
          ×
        </button>
      </div>

      <div className="be-body">
        <section className="be-section">
          <h3 className="be-section__title">Mode</h3>
          <div className="be-segment" role="group" aria-label="Background mode">
            <button
              type="button"
              className={`be-segment__btn${background.mode === 'daily' ? ' be-segment__btn--active' : ''}`}
              onClick={() => onUpdate({ mode: 'daily' })}
            >
              Daily Photo
            </button>
            <button
              type="button"
              className={`be-segment__btn${background.mode === 'solid' ? ' be-segment__btn--active' : ''}`}
              onClick={() => onUpdate({ mode: 'solid' })}
            >
              Color
            </button>
            <button
              type="button"
              className={`be-segment__btn${background.mode === 'gradient' ? ' be-segment__btn--active' : ''}`}
              onClick={() => onUpdate({ mode: 'gradient' })}
            >
              Gradient
            </button>
            <button
              type="button"
              className={`be-segment__btn${background.mode === 'image' ? ' be-segment__btn--active' : ''}`}
              onClick={() => onUpdate({ mode: 'image' })}
            >
              Fixed Image
            </button>
          </div>
        </section>

        {background.mode === 'solid' && (
          <section className="be-section">
            <h3 className="be-section__title">Color</h3>
            <label className="be-field">
              <span className="be-field__label">Background color</span>
              <input
                id={`${idPrefix}-solid-color`}
                type="color"
                className="be-color"
                value={background.solidColor}
                onChange={(e) => onUpdate({ solidColor: e.target.value })}
                aria-label="Background color"
              />
            </label>
          </section>
        )}

        {background.mode === 'gradient' && (
          <section className="be-section">
            <h3 className="be-section__title">Gradient</h3>
            <div className="be-row">
              <label className="be-field">
                <span className="be-field__label">From</span>
                <input
                  id={`${idPrefix}-gradient-from`}
                  type="color"
                  className="be-color"
                  value={background.gradientFrom}
                  onChange={(e) => onUpdate({ gradientFrom: e.target.value })}
                  aria-label="Gradient from color"
                />
              </label>
              <label className="be-field">
                <span className="be-field__label">To</span>
                <input
                  id={`${idPrefix}-gradient-to`}
                  type="color"
                  className="be-color"
                  value={background.gradientTo}
                  onChange={(e) => onUpdate({ gradientTo: e.target.value })}
                  aria-label="Gradient to color"
                />
              </label>
            </div>
            <label className="be-field">
              <span className="be-field__label">Angle: {Math.round(background.gradientAngle)} deg</span>
              <input
                id={`${idPrefix}-gradient-angle`}
                className="be-range"
                type="range"
                min={0}
                max={360}
                step={1}
                value={background.gradientAngle}
                onChange={(e) => onUpdate({ gradientAngle: Number(e.target.value) })}
                aria-label="Gradient angle"
              />
            </label>
          </section>
        )}

        {background.mode === 'image' && (
          <section className="be-section">
            <h3 className="be-section__title">Fixed image</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelected}
              style={{ display: 'none' }}
              aria-hidden="true"
              tabIndex={-1}
            />
            <button type="button" className="be-btn" onClick={handlePickImage}>
              Upload image
            </button>
            {background.imageUrl && (
              <>
                <img src={background.imageUrl} alt="Background preview" className="be-preview" />
                <button
                  type="button"
                  className="be-btn be-btn--ghost"
                  onClick={() => onUpdate({ imageUrl: '', mode: 'daily' })}
                >
                  Remove image and use daily photo
                </button>
              </>
            )}
            {uploadError && (
              <p className="be-note be-note--error" role="status" aria-live="polite">
                {uploadError}
              </p>
            )}
          </section>
        )}
      </div>
    </aside>
  );
}
