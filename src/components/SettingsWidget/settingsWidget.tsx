import React, { useEffect, useState } from 'react';
import { SettingsWidgetProps, SettingsWidgetMetaData } from '@/types/common';
import styles from './settingsWidget.module.css';
import chromeStorage from '@/utils/chromeStorage';
import { providerRegistry } from '@/types/providerSettings';

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
const SettingsWidget: React.FC<SettingsWidgetProps> = ({ widgetId, isLocked,widgetHeading }: SettingsWidgetProps) => {

  const [activeTab, setActiveTab] = useState<'providers'>('providers');
  const [providers, setProviders] = useState<any[]>([]); // Use any[] for dynamic provider settings
  const [newProviderType, setNewProviderType] = useState({});

  const addProviderSetting = () => {
    if (!newProviderType) return;

    const newSettings = [...providers, newProviderType];
    // setProviders(newSettings);
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
          {activeTab === 'providers' && (
            <div className={styles.section}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Provider Type</label>
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
                    Please select
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
                  Add Provider Setting
                </button>
              </div>
              <ul className={styles.list}>
                {providers.map((setting, index) => (
                  <li key={index} className={styles.listItem}>
                    <span className={styles.itemName}>{setting.name}</span>
                    <button className={styles.removeButton} onClick={() => removeProviderSetting(index)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
  );
};

export default SettingsWidget;