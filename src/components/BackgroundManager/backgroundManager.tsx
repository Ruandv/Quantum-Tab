import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BackgroundManagerProps } from '../../types/common';
import { validateImageFile, fileToDataURL } from '../../utils/helpers';
import { addWidgetRemovalListener } from '../../utils/widgetEvents';
import styles from './backgroundManager.module.css';
import chromeStorage, { SerializedWidget } from '@/utils/chromeStorage';
import GeminiService from '@/services/geminiService';

const BackgroundManager: React.FC<BackgroundManagerProps> = ({
  onBackgroundChange,
  isLocked,
  widgetId,
  isAIEnabled,
  widgetHeading
}: BackgroundManagerProps) => {
  const { t } = useTranslation();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiPromptRef = useRef<HTMLTextAreaElement>(null);
  const aiKeyRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  useEffect(() => {
    setError(null);
    if (isAIEnabled && widgetId) {
      chromeStorage.getWidgetData(widgetId).then((widget) => {
        const serializedWidget = widget as unknown as SerializedWidget;
        aiPromptRef.current!.value = serializedWidget.props?.aiPrompt.toString() || '';
        aiKeyRef.current!.value = serializedWidget.props?.aiKey.toString() || '';
      });
    }
  }, [isAIEnabled, widgetId]);
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
        setError(null);
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


  const handleAIButtonClick = async (event: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    event.preventDefault();
    if (!widgetId) return;

    const rawWidgetData = await chromeStorage.getWidgetData(widgetId);
    const storedProps =
      rawWidgetData && typeof rawWidgetData === 'object' && 'props' in rawWidgetData && rawWidgetData.props
        ? (rawWidgetData.props as Record<string, unknown>)
        : {};
    const storedPrompt = typeof storedProps['aiPrompt'] === 'string' ? (storedProps['aiPrompt'] as string) : '';
    const storedKey = typeof storedProps['aiKey'] === 'string' ? (storedProps['aiKey'] as string) : '';

    if (aiPromptRef.current?.value === '' && storedPrompt !== '') {
      aiPromptRef.current.value = storedPrompt;
    }

    if (aiKeyRef.current?.value === '' && storedKey !== '') {
      aiKeyRef.current.value = storedKey;
    }

    if (!aiPromptRef.current?.value || !aiKeyRef.current?.value) {
      setError(t('backgroundManager.errors.aiInputRequired'));
      setIsUploading(false);
      return;
    }

    setIsUploading(true);
    const promptValue = aiPromptRef.current!.value;
    const keyValue = aiKeyRef.current!.value;
    const updatedProps = {
      ...storedProps,
      aiPrompt: promptValue,
      aiKey: keyValue,
    };

    await chromeStorage.setWidgetData(widgetId, { props: updatedProps });

    //const api = GeminiService.getInstance(keyValue);
    //const data = await api.generateResponse(promptValue);
    //setUploadedImage(data);
    //onBackgroundChange?.(data);

    setIsUploading(false);
  };

  return (
    <>
      {isUploading && error === null && (
        <div className={styles.uploadContent}>
          <div className={styles.uploadSpinner} />
          <span>{t('common.states.uploading')}</span>
        </div>
      )}
      {!isUploading && isAIEnabled && (
        <>
          {isUploading && (
            <div className={styles.uploadContent}>
              <div className={styles.uploadSpinner} />
              <span>{t('common.states.uploading')}</span>
            </div>
          )}
          <label htmlFor="aiPrompt" className={styles.label}>
            {t('backgroundManager.labels.aiPrompt')}
          </label>
          <textarea
            id="aiPrompt"
            ref={aiPromptRef}
            className={styles.aiTextarea}
            placeholder={t('backgroundManager.placeholders.aiPrompt')}
          />
          <label htmlFor="aiPromptKey" className={styles.label}>
            {t('backgroundManager.labels.aiPromptKey')}
          </label>
          <input
            type="text"
            id="aiPromptKey"
            ref={aiKeyRef}
            className={styles.aiTextarea}
            placeholder={t('backgroundManager.placeholders.aiPromptKey')}

          />
          <button className={styles.controlBtn} onClick={handleAIButtonClick}>
            {t('backgroundManager.buttons.submit')}
          </button>
        </>
      )} : {!isUploading && !isAIEnabled && (
        <>
          <div className={styles.uploadSection}>
            {!uploadedImage ? (
              <div className={styles.uploadArea} onClick={handleFileSelect}>
                {renderUploadArea()}
              </div>
            ) : (
              renderPreview()
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
      )}
      {error && (
        <div
          className="error-message"
          style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.5rem' }}
        >
          {error}
        </div>
      )}
    </>
  );
};

BackgroundManager.displayName = 'BackgroundManager';

export default BackgroundManager;
