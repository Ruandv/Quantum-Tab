import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './updateNotification.module.css';

interface NotificationData {
  type: 'install' | 'update';
  version: string;
  previousVersion?: string;
  timestamp: string;
}

interface UpdateNotificationProps {
  onDismiss: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onDismiss }) => {
  const { t } = useTranslation();
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for pending notifications
    chrome.storage.sync.get(['notificationPending', 'showWelcomeNotification', 'showUpdateNotification'], (result) => {
      if (result.notificationPending && (result.showWelcomeNotification || result.showUpdateNotification)) {
        setNotification(result.notificationPending);
        setIsVisible(true);
      }
    });
  }, []);

  const handleDismiss = async () => {
    setIsVisible(false);

    // Clear notification flags
    await chrome.storage.sync.set({
      showWelcomeNotification: false,
      showUpdateNotification: false,
      notificationPending: null
    });

    // Fade out animation
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const handleViewChanges = () => {
    // Open changelog or release notes
    window.open('https://github.com/Ruandv/quantum-tab/releases', '_blank');
  };

  if (!notification || !isVisible) {
    return null;
  }

  const isInstall = notification.type === 'install';
  const isUpdate = notification.type === 'update';

  return (
    <div className={`${styles.updateNotificationOverlay} ${isVisible ? styles.visible : ''}`}>
      <div className={styles.updateNotification}>
        <div className={styles.notificationHeader}>
          <div className={styles.notificationIcon}>
            {isInstall ? '🎉' : '✨'}
          </div>
          <div className={styles.notificationTitle}>
            {isInstall ? t('notifications.welcome.title') : t('notifications.update.title')}
          </div>
          <button className={styles.notificationClose} onClick={handleDismiss}>
            ×
          </button>
        </div>

        <div className={styles.notificationContent}>
          {isInstall && (
            <>
              <p className={styles.notificationMessage}>
                {t('notifications.welcome.message')}
              </p>
              <div className={styles.notificationFeatures}>
                <h4>{t('notifications.welcome.featuresTitle')}</h4>
                <ul>
                  <li>{t('notifications.welcome.features.widgets')}</li>
                  <li>{t('notifications.welcome.features.customization')}</li>
                  <li>{t('notifications.welcome.features.languages')}</li>
                  <li>{t('notifications.welcome.features.backgrounds')}</li>
                </ul>
              </div>
            </>
          )}

          {isUpdate && (
            <>
              <p className={styles.notificationMessage}>
                {t('notifications.update.message', {
                  version: notification.version
                })}
              </p>
              <div className={styles.notificationVersionInfo}>
                {notification.previousVersion && (
                  <>
                    <span className={`${styles.versionBadge} ${styles.old}`}>
                      v{notification.previousVersion}
                    </span>
                    <span className={styles.versionArrow}>→</span>
                  </>
                )}
                <span className={`${styles.versionBadge} ${styles.new}`}>
                  v{notification.version}
                </span>
              </div>
            </>
          )}
        </div>

        <div className={styles.notificationActions}>
          {isUpdate && (
            <button className={`${styles.notificationButton} ${styles.secondaryButton}`} onClick={handleViewChanges}>
              {t('notifications.buttons.viewChanges')}
            </button>
          )}
          <button className={`${styles.notificationButton} ${styles.primaryButton}`} onClick={handleDismiss}>
            {isInstall ? t('notifications.buttons.getStarted') : t('notifications.buttons.continue')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;