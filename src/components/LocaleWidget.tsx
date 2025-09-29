import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Handle locale change
  const handleLocaleChange = useCallback(async (newLocale: string) => {
    try {
      console.log('Changing locale from', currentLocale, 'to', newLocale);
      
      // Change the i18n language
      await i18n.changeLanguage(newLocale);
      
      // Update internal state
      setCurrentLocale(newLocale);
      
      // Close dropdown
      setIsDropdownOpen(false);
      
      // Notify parent component
      onLocaleChange?.(newLocale);
      
      // Store in chrome storage for persistence
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ userLocale: newLocale });
        console.log('Locale saved to storage:', newLocale);
      }
      
      console.log('Locale change completed. i18n language:', i18n.language);
    } catch (error) {
      console.error('Failed to change locale:', error);
    }
  }, [i18n, onLocaleChange, currentLocale]);

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(!isDropdownOpen);
  }, [isDropdownOpen]);

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
        <label className="locale-label">
          {t('localeWidget.labels.language')}
        </label>
        
        <div className="custom-dropdown" ref={dropdownRef}>
          <div 
            className="dropdown-trigger"
            onClick={toggleDropdown}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleDropdown();
              }
            }}
          >
            <span className="selected-option">
              <span className="locale-flag">{getCurrentLocaleInfo().flag}</span>
              <span className="locale-name">{getCurrentLocaleInfo().name}</span>
            </span>
            <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
          </div>
          
          {isDropdownOpen && (
            <div className="dropdown-menu">
              {availableLocales.map((locale) => (
                <div
                  key={locale.code}
                  className={`dropdown-option ${locale.code === currentLocale ? 'selected' : ''}`}
                  onClick={() => handleLocaleChange(locale.code)}
                  role="option"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleLocaleChange(locale.code);
                    }
                  }}
                >
                  <span className="locale-flag">{locale.flag}</span>
                  <span className="locale-name">{locale.name}</span>
                  {locale.code === currentLocale && <span className="checkmark">✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        
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