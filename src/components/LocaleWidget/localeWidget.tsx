import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LocaleWidgetProps } from '../../types/common';
import { addWidgetRemovalListener } from '../../utils/widgetEvents';
import styles from './localeWidget.module.css';

const LocaleWidget: React.FC<LocaleWidgetProps> = ({
  selectedLocale,
  onLocaleChange,
  isLocked = false,
  widgetId,
}: LocaleWidgetProps) => {
  const { t, i18n } = useTranslation();
  const [currentLocale, setCurrentLocale] = useState<string>(selectedLocale || i18n.language);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Available locales - add more as you create additional locale files
  const availableLocales = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
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

  // Add widget removal event listener for cleanup
  useEffect(() => {
    if (!widgetId) return;

    const removeListener = addWidgetRemovalListener(widgetId, async () => {
      // Cleanup: Reset language to English when widget is removed
      try {
        console.log('Resetting language to English for widget:', widgetId);

        // Reset i18n language to English
        await i18n.changeLanguage('en');

        // Clear stored user locale
        if (typeof chrome !== 'undefined' && chrome.storage) {
          await chrome.storage.local.remove(['quantum-tab-userLocale']);
          console.log('User locale storage cleared for widget:', widgetId);
        }
      } catch (error) {
        console.error('Failed to reset language during widget cleanup:', error);
      }
    });

    // Cleanup listener when component unmounts
    return removeListener;
  }, [widgetId, i18n]);

  // Handle locale change
  const handleLocaleChange = useCallback(
    async (newLocale: string) => {
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
          await chrome.storage.local.set({ 'quantum-tab-userLocale': newLocale });
          console.log('Locale saved to storage:', newLocale);
        }

        console.log('Locale change completed. i18n language:', i18n.language);
      } catch (error) {
        console.error('Failed to change locale:', error);
      }
    },
    [i18n, onLocaleChange, currentLocale]
  );

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(!isDropdownOpen);
  }, [isDropdownOpen]);

  // Return null if locked (after all hooks have been called)
  if (isLocked) {
    return null;
  }

  return (
    <>
      <div className={styles.localeSelector}>
        <label className={styles.localeLabel}>{t('localeWidget.labels.language')}</label>
        <div className={styles.customDropdown} ref={dropdownRef}>
          <div
            className={styles.dropdownTrigger}
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
            <span className={styles.selectedOption}>
              <span className={styles.localeFlag}>{availableLocales.find((locale) => locale.code === i18n.language)?.flag}</span>
              <span className={styles.localeName}>{availableLocales.find((locale) => locale.code === i18n.language)?.name}</span>
            </span>
            <span className={`${styles.dropdownArrow} ${isDropdownOpen ? styles.open : ''}`}>▼</span>
          </div>

          {isDropdownOpen && (
            <div className={styles.dropdownMenu}>
              {availableLocales.map((locale) => (
                <div
                  key={locale.code}
                  className={`${styles.dropdownOption} ${locale.code === currentLocale ? styles.selected : ''}`}
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
                  <span className={styles.localeFlag}>{locale.flag}</span>
                  <span className={styles.localeName}>{locale.name}</span>
                  {locale.code ===  i18n.language && <span className={styles.checkmark}>✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

LocaleWidget.displayName = 'LocaleWidget';

export default LocaleWidget;
