import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BackgroundManagerProps } from '../types/common';
import { validateImageFile, fileToDataURL } from '../utils/helpers';

const BackgroundManager: React.FC<BackgroundManagerProps> = ({
  className = '',
  onBackgroundChange,
  isLocked
}: BackgroundManagerProps) => {
  const { t } = useTranslation();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error || t('backgroundManager.errors.invalidFile'));
      return;
    }

    setIsUploading(true);

    try {
      const imageUrl = await fileToDataURL(file);
      setUploadedImage(imageUrl);
      onBackgroundChange?.(imageUrl);
    } catch (err) {
      setError(t('backgroundManager.errors.failedToRead'));
      console.error('File read error:', err);
    } finally {
      setIsUploading(false);
    }
  }, [onBackgroundChange, t]);

  const handleRemoveBackground = useCallback(() => {
    setUploadedImage(null);
    setError(null);
    onBackgroundChange?.('');
  }, [onBackgroundChange]);

  const handleRestoreDefault = useCallback(() => {
    setUploadedImage(null);
    setError(null);
    onBackgroundChange?.('default');
  }, [onBackgroundChange]);

  const renderUploadArea = () => {
    if (isUploading) {
      return (
        <div className="upload-content">
          <div className="upload-spinner" />
          <span>{t('common.states.uploading')}</span>
        </div>
      );
    }

    return (
      <div className="upload-content">
        <div className="upload-icon">📁</div>
        <span className="upload-text">{t('backgroundManager.upload.clickToUpload')}</span>
        <small className="upload-hint">{t('backgroundManager.upload.supportedFormats')}</small>
      </div>
    );
  };

  const renderPreview = () => (
    <div className="preview-section">
      <div className="image-preview">
        <img
          src={uploadedImage!}
          alt={t('backgroundManager.upload.previewAlt')}
          className="preview-image"
        />
        <div className="preview-overlay">
          <span className="preview-label">{t('backgroundManager.preview.currentBackground')}</span>
        </div>
      </div>
    </div>
  );

  const renderControls = () => {
    if (uploadedImage) {
      return (
        <>
          <button
            className="control-btn change-btn"
            onClick={handleFileSelect}
            title={t('backgroundManager.tooltips.changeBackground')}
          >
            📁 {t('common.buttons.change')}
          </button>
          <button
            className="control-btn default-btn"
            onClick={handleRestoreDefault}
            title={t('backgroundManager.tooltips.restoreDefault')}
          >
            🎨 {t('common.buttons.default')}
          </button>
          <button
            className="control-btn remove-btn"
            onClick={handleRemoveBackground}
            title={t('backgroundManager.tooltips.removeBackground')}
          >
            🗑️ {t('common.buttons.remove')}
          </button>
        </>
      );
    }

    return (
      <button
        className="control-btn default-btn"
        onClick={handleRestoreDefault}
        title={t('backgroundManager.tooltips.restoreDefault')}
      >
        🎨 {t('backgroundManager.buttons.defaultGradient')}
      </button>
    );
  };

  // Return null if locked (after all hooks have been called)
  if (isLocked) {
    return null;
  }

  return (
    <div className={`background-manager-widget ${className}`}>
      <h3 className="widget-title">{t('backgroundManager.title')}</h3>

      <div className="upload-section">
        {!uploadedImage ? (
          <div className="upload-area" onClick={handleFileSelect}>
            {renderUploadArea()}
          </div>
        ) : (
          renderPreview()
        )}

        {error && (
          <div className="error-message" style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {error}
          </div>
        )}
      </div>

      <div className="control-buttons">
        {renderControls()}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </div>
  );
};

BackgroundManager.displayName = 'BackgroundManager';

export default BackgroundManager;