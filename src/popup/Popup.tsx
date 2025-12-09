import SettingsWidget from '@/components/SettingsWidget/settingsWidget';
import chromeStorage from '@/utils/chromeStorage';
import React, { useEffect } from 'react';
import './Popup.css';
const Popup: React.FC = () => {
  const version = chrome.runtime.getManifest().version;
  const [activeTab, setActiveTab] = React.useState<'provider' | 'recent' | 'bugs'>('provider');
  const [settingsWidgetId, setSettingsWidgetId] = React.useState<string>('');
  useEffect(() => {
    const doWork = async () => {
      // Any initialization logic can go here
      const widgetData = await chromeStorage.getWidgetData('settings-widget');
      setSettingsWidgetId(widgetData.id as string || '');
    }
    doWork();
  }
    , []);
  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>Quantum Tab <sub>{version}</sub></h1>
        <p>New tab. New intelligence.</p>
      </header>
      <main className="popup-content">
        <section className={`tab-info`} onClick={() => setActiveTab('provider')}>
          <h2>Provider Settings</h2>
          <div className={`tab-details ${activeTab === 'provider' ? 'active' : 'hide'}`}>
            <SettingsWidget isLocked={false} widgetId={settingsWidgetId} widgetHeading={""} />
          </div>
        </section>
        <section className={`tab-info`} onClick={() => setActiveTab('recent')}>
          <h2>Recent Changes</h2>
          <div className={`tab-details ${activeTab === 'recent' ? 'active' : 'hide'}`}>
            <p>
              <strong>Change log:</strong> <a target='_blank' href={`https://github.com/Ruandv/Quantum-Tab/releases/tag/v${version}`} rel="noreferrer">View Release Notes</a>
            </p>
          </div>
        </section>
        <section className={`tab-info`} onClick={() => setActiveTab('bugs')}>
          <h2>Bugs & Requests</h2>
          <div className={`tab-details ${activeTab === 'bugs' ? 'active' : 'hide'}`}>
            <p>
              <strong>Report a bug:</strong> <a target='_blank' href={`https://github.com/Ruandv/Quantum-Tab/issues/new?template=bug_report.md`} rel="noreferrer">Open an Issue</a>
            </p>
            <p>
              <strong>Request a feature:</strong> <a target='_blank' href={`https://github.com/Ruandv/Quantum-Tab/issues/new?template=feature_request.md`} rel="noreferrer">Open an Issue</a>
            </p>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Popup;
