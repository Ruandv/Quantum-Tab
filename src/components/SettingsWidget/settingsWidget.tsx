import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsWidgetProps, SettingsWidgetMetaData, CssStyle } from '@/types/common';
import styles from './settingsWidget.module.css';
import chromeStorage, { Defaults } from '@/utils/chromeStorage';
import { providerRegistry, ProviderSettings } from '@/types/providerSettings';

const SettingsWidget: React.FC<SettingsWidgetProps> = ({ widgetId, isLocked, widgetHeading }: SettingsWidgetProps) => {
  const { t } = useTranslation();

  const [providers, setProviders] = useState<ProviderSettings[]>([]);
  const [selectedProviderKey, setSelectedProviderKey] = useState<string>('');
  const [newProviderSettings, setNewProviderSettings] = useState<ProviderSettings | null>(null);
  const [defaultStyleSettings, setDefaultStyleSettings] = useState<CssStyle>(null);

  const addProviderSetting = () => {
    if (!newProviderSettings) return;
    const newSettings = [...providers, newProviderSettings];
    chromeStorage.setWidgetMetaData<SettingsWidgetMetaData>(widgetId, {
      providers: newSettings,
      lastRefresh: new Date()
    });
    setNewProviderSettings(null);
    setSelectedProviderKey('');
  };

  const removeProviderSetting = (index: number) => {
    const newSettings = providers.filter((_, i) => i !== index);
    setProviders(newSettings);
    chromeStorage.setWidgetMetaData<SettingsWidgetMetaData>(widgetId, {
      providers: newSettings,
      lastRefresh: new Date()
    });
  };

  useEffect(() => {
    // get the metaData for this widgetId from wherever it's stored
    async function fetchMetaData() {
      // Placeholder for fetching logic
      const res = await chromeStorage.getWidgetMetaData<SettingsWidgetMetaData>(widgetId);
      const defaultsRes = await chromeStorage.loadAllDefaults(); 
      setProviders((res?.providers as ProviderSettings[]) || [])
      setDefaultStyleSettings((defaultsRes?.['styling'] as CssStyle) || null);
    }
    fetchMetaData();
  }, [widgetId]);

  useEffect(() => {
    if(!defaultStyleSettings) return;
    async function saveDefaults() {
      const defaultsRes = await chromeStorage.loadAllDefaults(); 
      chromeStorage.saveAllDefaults({
        ...defaultsRes,
        styling: defaultStyleSettings
      });
    }
    saveDefaults();
  }, [defaultStyleSettings]);

  return (
    isLocked ? <> </> :
      <div className={styles.settingsWidget}>
        <h2>{widgetHeading}</h2>
        <div className={styles.content}>
          <div className={styles.section}>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('settingsWidget.labels.providerType')}</label>
              <select
                className={styles.input}
                value={selectedProviderKey}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const key = e.target.value;
                  setSelectedProviderKey(key);
                  if (key && providerRegistry[key]) {
                    setNewProviderSettings({ ...providerRegistry[key] });
                  } else {
                    setNewProviderSettings(null);
                  }
                }}
              >
                <option key={0} value={''}>
                  {t('settingsWidget.placeholders.select')} 
                </option>
                {Object.keys(providerRegistry).map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </div>
            {newProviderSettings && (
              Object.keys(newProviderSettings).map((key) => {
                if (key === 'name') return null; // Skip name field
                return (
                  <div key={key} className={styles.formGroup}>
                    <label className={styles.label}>{key}</label>
                    <input
                      type="text"
                      className={styles.input}
                      key={key}
                      value={(newProviderSettings as unknown as Record<string, string>)[key] || ''}
                      onChange={(e) => {
                        setNewProviderSettings((prev) => prev ? ({
                          ...prev,
                          [key]: e.target.value
                        }) : null);
                      }}
                    />
                  </div>
                );
              }))}
            <div className={styles.formGroup}>
              <button className={styles.button} onClick={addProviderSetting} disabled={!newProviderSettings}>
                {t('settingsWidget.buttons.addProvider')}
              </button>
            </div>
            <ul className={styles.list}>
              {providers.map((setting, index) => (
                <li key={index} className={styles.listItem}>
                  <span className={styles.itemName}>{setting.name}</span>
                  <button className={styles.removeButton} onClick={() => removeProviderSetting(index)}>
                    {t('common.buttons.remove')}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.content}>
            <div className={styles.section}>
              <h3>Default widget settings</h3>
              <p>These settings will apply to new widgets created after changing them.</p>
              {defaultStyleSettings && (
                Object.keys(defaultStyleSettings).map((key) => {
                  if (key === 'name') return null; // Skip name field
                  return (
                    <div key={key} className={styles.formGroup}>
                      <label className={styles.label}>{key}</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={(defaultStyleSettings as CssStyle)[key] || ''}
                        onChange={(e) => {
                          setDefaultStyleSettings((prev) => prev ? ({
                            ...prev,
                            [key]: e.target.value
                          }) : null);
                        }}
                      />
                    </div>
                  );
                }))}
            </div>
          </div>
        </div>
      </div>
  );
};

export default SettingsWidget;