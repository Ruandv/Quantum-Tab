import React, { useState } from 'react';
import { SettingsWidgetProps, PATToken, ProviderSettings } from '@/types/common';
import styles from './settingsWidget.module.css';

const SettingsWidget: React.FC<SettingsWidgetProps> = ({
  isLocked,
  metaData = {},
  onUpdateMetaData,
}) => {

  const [activeTab, setActiveTab] = useState<'pat' | 'providers'>('pat');
  const [patTokens, setPatTokens] = useState<PATToken[]>((metaData.patTokens as PATToken[]) || []);
  const [providerSettings, setProviderSettings] = useState<ProviderSettings[]>((metaData.providerSettings as ProviderSettings[]) || []);

  const [newPatName, setNewPatName] = useState('');
  const [newPatKey, setNewPatKey] = useState('');
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderType, setNewProviderType] = useState('AI');
  const [newProviderUrl, setNewProviderUrl] = useState('');
  const [newProviderApiKey, setNewProviderApiKey] = useState('');

  const saveMetaData = (updatedMetaData: Record<string, unknown>) => {
    onUpdateMetaData?.(updatedMetaData);
  };

  const addPatToken = () => {
    if (!newPatName || !newPatKey) return;
    const newTokens = [...patTokens, { name: newPatName, key: newPatKey }];
    setPatTokens(newTokens);
    saveMetaData({ ...metaData, patTokens: newTokens });
    setNewPatName('');
    setNewPatKey('');
  };

  const removePatToken = (index: number) => {
    const newTokens = patTokens.filter((_, i) => i !== index);
    setPatTokens(newTokens);
    saveMetaData({ ...metaData, patTokens: newTokens });
  };

  const addProviderSetting = () => {
    if (!newProviderName || !newProviderType || !newProviderUrl || !newProviderApiKey) return;
    const newSettings = [...providerSettings, {
      name: newProviderName,
      providerType: newProviderType,
      providerSettings: { url: newProviderUrl, apiKey: newProviderApiKey }
    }];
    setProviderSettings(newSettings);
    saveMetaData({ ...metaData, providerSettings: newSettings });
    setNewProviderName('');
    setNewProviderUrl('');
    setNewProviderApiKey('');
    setNewProviderType('AI'); // Reset to default
  };

  const removeProviderSetting = (index: number) => {
    const newSettings = providerSettings.filter((_, i) => i !== index);
    setProviderSettings(newSettings);
    saveMetaData({ ...metaData, providerSettings: newSettings });
  };

  return (
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
                disabled={isLocked}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Key</label>
              <input
                type="password"
                className={styles.input}
                value={newPatKey}
                onChange={(e) => setNewPatKey(e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div className={styles.formGroup}>
              <button className={styles.button} onClick={addPatToken} disabled={isLocked}>
                Add PAT Token
              </button>
            </div>
            <ul className={styles.list}>
              {patTokens.map((token, index) => (
                <li key={index} className={styles.listItem}>
                  <span className={styles.itemName}>{token.name}</span>
                  <button className={styles.removeButton} onClick={() => removePatToken(index)} disabled={isLocked}>
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
                disabled={isLocked}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Provider Type</label>
              <select
                className={styles.input}
                value={newProviderType}
                onChange={(e) => setNewProviderType(e.target.value)}
                disabled={isLocked}
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
                disabled={isLocked}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>API Key</label>
              <input
                type="password"
                className={styles.input}
                value={newProviderApiKey}
                onChange={(e) => setNewProviderApiKey(e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div className={styles.formGroup}>
              <button className={styles.button} onClick={addProviderSetting} disabled={isLocked}>
                Add Provider Setting
              </button>
            </div>
            <ul className={styles.list}>
              {providerSettings.map((setting, index) => (
                <li key={index} className={styles.listItem}>
                  <span className={styles.itemName}>{setting.name} ({setting.providerType})</span>
                  <button className={styles.removeButton} onClick={() => removeProviderSetting(index)} disabled={isLocked}>
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