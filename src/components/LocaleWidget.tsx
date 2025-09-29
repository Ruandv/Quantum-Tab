import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LocaleWidgetProps } from '../types/common';

const LocaleWidget: React.FC<LocaleWidgetProps> = ({
  className = '',
  selectedLocale,
  onLocaleChange,
  isLocked = false
}: LocaleWidgetProps) => {
  const { t, i18n } = useTranslation();
  const [currentLocale, setCurrentLocale] = useState<string>(selectedLocale || i18n.language);

  // Available locales - add more as you create additional locale files
  const availableLocales = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'af', name: 'Afrikaans', flag: '🇿🇦' }
  ];

  // Update internal state when prop changes
  useEffect(() => {
    if (selectedLocale && selectedLocale !== currentLocale) {
      setCurrentLocale(selectedLocale);
    }
  }, [selectedLocale, currentLocale]);

  // Handle locale change
  const handleLocaleChange = useCallback(async (newLocale: string) => {
    try {
      // Change the i18n language
      await i18n.changeLanguage(newLocale);
      
      // Update internal state
      setCurrentLocale(newLocale);
      
      // Notify parent component
      onLocaleChange?.(newLocale);
      
      // Store in chrome storage for persistence
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ userLocale: newLocale });
      }
    } catch (error) {
      console.error('Failed to change locale:', error);
    }
  }, [i18n, onLocaleChange]);

  // Get current locale display info
  const getCurrentLocaleInfo = () => {
    return availableLocales.find(locale => locale.code === currentLocale) || availableLocales[0];
  };

  if (isLocked) {
    // Show read-only view when locked
    const localeInfo = getCurrentLocaleInfo();
    return (
      <div className={`locale-widget ${className}`}>
        <h3 className="widget-title">🌐 {t('localeWidget.title')}</h3>
        <div className="locale-display locked">
          <span className="locale-flag">{localeInfo.flag}</span>
          <span className="locale-name">{localeInfo.name}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`locale-widget ${className}`}>
      <h3 className="widget-title">🌐 {t('localeWidget.title')}</h3>
      
      <div className="locale-selector">
        <label htmlFor="locale-select" className="locale-label">
          {t('localeWidget.labels.language')}
        </label>
        
        <select
          id="locale-select"
          value={currentLocale}
          onChange={(e) => handleLocaleChange(e.target.value)}
          className="locale-dropdown"
        >
          {availableLocales.map((locale) => (
            <option key={locale.code} value={locale.code}>
              {locale.flag} {locale.name}
            </option>
          ))}
        </select>
        
        <div className="locale-info">
          <small className="locale-hint">
            {t('localeWidget.hints.restart')}
          </small>
        </div>
      </div>
      
      <div className="current-locale-display">
        <span className="current-locale-label">{t('localeWidget.labels.current')}</span>
        <div className="current-locale-value">
          <span className="locale-flag">{getCurrentLocaleInfo().flag}</span>
          <span className="locale-name">{getCurrentLocaleInfo().name}</span>
        </div>
      </div>
    </div>
  );
};

LocaleWidget.displayName = 'LocaleWidget';

export default LocaleWidget;