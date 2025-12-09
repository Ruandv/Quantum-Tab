import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsWidgetProps, SettingsWidgetMetaData } from '@/types/common';
import styles from './settingsWidget.module.css';
import chromeStorage from '@/utils/chromeStorage';
import { providerRegistry } from '@/types/providerSettings';

const SettingsWidget: React.FC<SettingsWidgetProps> = ({ widgetId, isLocked, widgetHeading }: SettingsWidgetProps) => {
  const { t } = useTranslation();

  const [providers, setProviders] = useState<any[]>([]); // Use any[] for dynamic provider settings
  const [newProviderType, setNewProviderType] = useState({});

  const addProviderSetting = () => {
    if (!newProviderType) return;
    const newSettings = [...providers, newProviderType];
    chromeStorage.setWidgetMetaData<SettingsWidgetMetaData>(widgetId, {
      providers: newSettings,
      lastRefresh: new Date()
    });
    setNewProviderType({}); // Reset to default
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
      // setPatTokens(res.patTokens || []);
      setProviders(res.providers || [])
    }
    fetchMetaData();
  }, [widgetId]);
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
                value={newProviderType.toString()}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const prop = providerRegistry?.[e.target.value];
                  setNewProviderType(prop);
                }
                }
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
            {newProviderType && (
              Object.keys(newProviderType || {})?.map((key) => (
                <div key={key} className={styles.formGroup}>
                  <label className={styles.label}>{key}</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={newProviderType[key] || ''}
                    onChange={(e) => {
                      const o = { [`${key}`]: e.target.value }
                      setNewProviderType((prev) => ({
                        ...prev,
                        ...o
                      }));
                    }
                    }
                  />
                </div>
              )))}
            <div className={styles.formGroup}>
              <button className={styles.button} onClick={addProviderSetting}>
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
        </div>
      </div>
  );
};

export default SettingsWidget;