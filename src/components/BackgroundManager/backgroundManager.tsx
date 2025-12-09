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
  providerName,
  isAIEnabled
}: BackgroundManagerProps) => {
  const { t } = useTranslation();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [backgroundSize, setBackgroundSize] = useState<string>('auto');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiKey, setAiKey] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  useEffect(() => {
    setError(null);
    if (!widgetId) return;

    const doWork = async () => {
      const widget = await chromeStorage.getWidgetData(widgetId);
      const serializedWidget = widget as unknown as SerializedWidget;

      // Always load backgroundSize
      const storedSize = typeof serializedWidget.props?.backgroundSize === 'string' ? serializedWidget.props.backgroundSize : 'auto';
      setBackgroundSize(storedSize);

      // Load metadata
      const widgetMetaData = await chromeStorage.getWidgetMetaData(widgetId);
      if (widgetMetaData && typeof widgetMetaData === 'object') {
        const lastRefreshValue = (widgetMetaData as Record<string, unknown>)['lastRefresh'];
        const lastRefreshDateTime = typeof lastRefreshValue === 'string' ? new Date(lastRefreshValue) : null;
        setLastRefresh(lastRefreshDateTime);
      } else {
        const sixHoursAgo = new Date();
        sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);
        setLastRefresh(sixHoursAgo);
      }
      // Load AI data only if AI is enabled
      if (isAIEnabled) {
        const storedPrompt = serializedWidget.props?.aiPrompt?.toString() || '';
        const storedKey = await chromeStorage.getProviderConfiguration(providerName) || '';
        setAiPrompt(storedPrompt);
        setAiKey(storedKey.apiKey);
      }
    };
    doWork();
  }, [widgetId, isAIEnabled]);
  // Add widget removal event listener for cleanup

  useEffect(() => {
    const doWork = async () => {
      if (lastRefresh) {
        await chromeStorage.setWidgetMetaData(widgetId, {
          lastRefresh: lastRefresh.toISOString(),
          backgroundImage: uploadedImage
        });
      }
    };
    doWork();
  }, [lastRefresh, widgetId, uploadedImage]); 

  useEffect(() => {
    const doWork = async () => {
      const rawWidgetData = await chromeStorage.getWidgetData(widgetId);
      const storedProps =
        rawWidgetData && typeof rawWidgetData === 'object' && 'props' in rawWidgetData && rawWidgetData.props
          ? (rawWidgetData.props as Record<string, unknown>)
          : {};
      const updatedProps = {
        ...storedProps,
        aiPrompt,
        backgroundSize,
      };
      await chromeStorage.setWidgetData(widgetId, { props: updatedProps });
    }
    doWork();

  }, [aiPrompt, backgroundSize, widgetId])

  useEffect(() => {
    if (!widgetId) return;

    const removeListener = addWidgetRemovalListener(widgetId, async () => {
      // Cleanup: Remove the background image from storage when widget is removed
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
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

  const handleAIButtonClick = async (event?: React.SyntheticEvent): Promise<void> => {
    event.preventDefault();
    if (!widgetId) return;

    if (!aiPrompt || !aiKey) {
      setError(t('backgroundManager.errors.aiInputRequired'));
      setIsUploading(false);
      return;
    }

    setIsUploading(true);

    const api = GeminiService.getInstance(aiKey);
    const data = await api.generateResponse(aiPrompt);
    setUploadedImage(data);
    onBackgroundChange?.(data);
    setLastRefresh(new Date());
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


      {!isUploading && (
        <>
          {isAIEnabled && (
            <>
              <label htmlFor="aiPrompt" className={styles.label}>
                {t('backgroundManager.labels.aiPrompt')}
              </label>
              <textarea
                id="aiPrompt"
                className={styles.aiTextarea}
                placeholder={t('backgroundManager.placeholders.aiPrompt')}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <button className={styles.controlBtn} onClick={handleAIButtonClick}>
                {t('backgroundManager.buttons.submit')}
              </button>
            </>
          )}
          {!isAIEnabled && (
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
      )}
    </>
  );
};
BackgroundManager.displayName = 'BackgroundManager';
export default BackgroundManager;