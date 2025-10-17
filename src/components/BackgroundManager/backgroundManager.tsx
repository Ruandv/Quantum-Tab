import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BackgroundManagerProps } from '../../types/common';
import { validateImageFile, fileToDataURL } from '../../utils/helpers';
import { addWidgetRemovalListener } from '../../utils/widgetEvents';
import styles from './backgroundManager.module.css';
import widgetCommon from '../../styles/widgetCommon.module.css';

const BackgroundManager: React.FC<BackgroundManagerProps> = ({
  onBackgroundChange,
  isLocked,
  widgetId,
}: BackgroundManagerProps) => {
  const { t } = useTranslation();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Add widget removal event listener for cleanup
  useEffect(() => {
    if (!widgetId) return;

    const removeListener = addWidgetRemovalListener(widgetId, async () => {
      // Cleanup: Remove the background image from storage when widget is removed
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          await chrome.storage.local.remove(['quantum-tab-background']);
          console.log('Background image storage cleared for widget:', widgetId);
        }

        // Reset background to default if there's a callback
        if (onBackgroundChange) {
          onBackgroundChange('');
        }
      } catch (error) {
        console.error('Failed to cleanup background storage:', error);
      }
    });

    // Cleanup listener when component unmounts
    return removeListener;
  }, [widgetId, onBackgroundChange]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    },
    [onBackgroundChange, t]
  );

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
        <div className={styles.uploadContent}>
          <div className={styles.uploadSpinner} />
          <span>{t('common.states.uploading')}</span>
        </div>
      );
    }

    return (
      <div className={styles.uploadContent}>
        <div className={styles.uploadIcon}>📁</div>
        <span className={styles.uploadText}>{t('backgroundManager.upload.clickToUpload')}</span>
        <small className={styles.uploadHint}>{t('backgroundManager.upload.supportedFormats')}</small>
      </div>
    );
  };

  const renderPreview = () => (
    <div className={styles.previewSection}>
      <div className={styles.imagePreview}>
        <img
          src={uploadedImage!}
          alt={t('backgroundManager.upload.previewAlt')}
          className={styles.previewImage}
        />
        <div className={styles.previewOverlay}>
          <span className={styles.previewLabel}>{t('backgroundManager.preview.currentBackground')}</span>
        </div>
      </div>
    </div>
  );

  const renderControls = () => {
    if (uploadedImage) {
      return (
        <>
          <button
            className={`${styles.controlBtn} ${styles.changeBtn}`}
            onClick={handleFileSelect}
            title={t('backgroundManager.tooltips.changeBackground')}
          >
            📁 {t('common.buttons.change')}
          </button>
          <button
            className={`${styles.controlBtn} ${styles.defaultBtn}`}
            onClick={handleRestoreDefault}
            title={t('backgroundManager.tooltips.restoreDefault')}
          >
            🎨 {t('common.buttons.default')}
          </button>
          <button
            className={`${styles.controlBtn} ${styles.removeBtn}`}
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
        className={`${styles.controlBtn} ${styles.defaultBtn}`}
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
    <>
      <div className={styles.uploadSection}>
        {!uploadedImage ? (
          <div className={styles.uploadArea} onClick={handleFileSelect}>
            {renderUploadArea()}
          </div>
        ) : (
          renderPreview()
        )}

        {error && (
          <div
            className="error-message"
            style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.5rem' }}
          >
            {error}
          </div>
        )}
      </div>

      <div className={styles.controlButtons}>{renderControls()}</div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </>
  );
};

BackgroundManager.displayName = 'BackgroundManager';

export default BackgroundManager;
