import React, { useEffect, useState } from 'react';
import { SettingsWidgetProps, SettingsWidgetMetaData, PATToken, ProviderSettings } from '@/types/common';
import styles from './settingsWidget.module.css';
import chromeStorage from '@/utils/chromeStorage';

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
const SettingsWidget: React.FC<SettingsWidgetProps> = ({ widgetId, isLocked }: SettingsWidgetProps) => {

  const [activeTab, setActiveTab] = useState<'pat' | 'providers'>('pat');
  const [patTokens, setPatTokens] = useState<PATToken[]>([]);
  const [providerSettings, setProviderSettings] = useState<ProviderSettings[]>([]);

  const [newPatName, setNewPatName] = useState('');
  const [newPatKey, setNewPatKey] = useState('');
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderType, setNewProviderType] = useState('AI');
  const [newProviderUrl, setNewProviderUrl] = useState('');
  const [newProviderApiKey, setNewProviderApiKey] = useState('');

  const addPatToken = () => {
    if (!newPatName || !newPatKey) return;
    const newTokens = [...patTokens, { name: newPatName, key: newPatKey }];
    setPatTokens(newTokens);
    chromeStorage.setWidgetMetaData<SettingsWidgetMetaData>(widgetId, {
      patTokens: newTokens,
      lastRefresh: new Date()
    });
    setNewPatName('');
    setNewPatKey('');
  };

  const removePatToken = (index: number) => {
    const newTokens = patTokens.filter((_, i) => i !== index);
    setPatTokens(newTokens);
    chromeStorage.setWidgetMetaData<SettingsWidgetMetaData>(widgetId, {
      patTokens: newTokens,
      lastRefresh: new Date()
    });
  };

  const addProviderSetting = () => {
    if (!newProviderName || !newProviderType || !newProviderUrl || !newProviderApiKey) return;
    const newSettings = [...providerSettings, {
      name: newProviderName,
      providerType: newProviderType,
      providerSettings: { url: newProviderUrl, apiKey: newProviderApiKey }
    }];
    setProviderSettings(newSettings);
    chromeStorage.setWidgetMetaData<SettingsWidgetMetaData>(widgetId, {
      providerSettings: newSettings,
      lastRefresh: new Date()
    });
    setNewProviderName('');
    setNewProviderUrl('');
    setNewProviderApiKey('');
    setNewProviderType('AI'); // Reset to default
  };

  const removeProviderSetting = (index: number) => {
    const newSettings = providerSettings.filter((_, i) => i !== index);
    setProviderSettings(newSettings);
    chromeStorage.setWidgetMetaData<SettingsWidgetMetaData>(widgetId, {
      providerSettings: newSettings,
      lastRefresh: new Date()
    });
  };
  useEffect(() => {
    console.log('SettingsWidget props updated:', widgetId);
    // get the metaData for this widgetId from wherever it's stored
    async function fetchMetaData() {
      // Placeholder for fetching logic
      const res = await chromeStorage.getWidgetMetaData<SettingsWidgetMetaData>(widgetId);
      setPatTokens(res.patTokens || []);
      setProviderSettings(res.providerSettings || [])
      console.log('Fetched metaData for widget', widgetId, res);
    }
    fetchMetaData();
  }, [widgetId]);
  return (
    isLocked ? <> </> :
      <div className={styles.settingsWidget}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${activeTab === 'pat' ? styles.active : ''}`}
            onClick={() => setActiveTab('pat')}
          >
            PAT Tokens
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'providers' ? styles.active : ''}`}
            onClick={() => setActiveTab('providers')}
          >
            Provider Settings
          </button>
        </div>
        <div className={styles.tabContent}>
          {activeTab === 'pat' && (
            <div className={styles.section}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={newPatName}
                  onChange={(e) => setNewPatName(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Key</label>
                <input
                  type="password"
                  className={styles.input}
                  value={newPatKey}
                  onChange={(e) => setNewPatKey(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <button className={styles.button} onClick={addPatToken}>
                  Add PAT Token
                </button>
              </div>
              <ul className={styles.list}>
                {patTokens.map((token, index) => (
                  <li key={index} className={styles.listItem}>
                    <span className={styles.itemName}>{token.name}</span>
                    <button className={styles.removeButton} onClick={() => removePatToken(index)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'providers' && (
            <div className={styles.section}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Provider Type</label>
                <select
                  className={styles.input}
                  value={newProviderType}
                  onChange={(e) => setNewProviderType(e.target.value)}
                >
                  <option value="AI">AI</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>URL</label>
                <input
                  type="text"
                  className={styles.input}
                  value={newProviderUrl}
                  onChange={(e) => setNewProviderUrl(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>API Key</label>
                <input
                  type="password"
                  className={styles.input}
                  value={newProviderApiKey}
                  onChange={(e) => setNewProviderApiKey(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <button className={styles.button} onClick={addProviderSetting}>
                  Add Provider Setting
                </button>
              </div>
              <ul className={styles.list}>
                {providerSettings.map((setting, index) => (
                  <li key={index} className={styles.listItem}>
                    <span className={styles.itemName}>{setting.name} ({setting.providerType})</span>
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