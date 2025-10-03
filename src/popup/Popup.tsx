import React, { useState, useEffect } from 'react';

interface TabInfo {
  id?: number;
  title?: string;
  url?: string;
}

const Popup: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabInfo>({});
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    // Get current tab information
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setCurrentTab({
          id: tabs[0].id,
          title: tabs[0].title,
          url: tabs[0].url,
        });
      }
    });
  }, []);

  const handleSendMessage = () => {
    if (currentTab.id && message) {
      chrome.tabs.sendMessage(currentTab.id, { action: 'showMessage', message }, (response) => {
        console.log('Message sent to content script:', response);
      });
    }
  };

  const handleStorageTest = () => {
    // Test Chrome storage API
    chrome.storage.sync.set({ testData: new Date().toISOString() }, () => {
      console.log('Data saved to storage');
    });

    chrome.storage.sync.get(['testData'], (result) => {
      console.log('Data retrieved from storage:', result.testData);
    });
  };

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>Quantum Tab</h1>
        <p>Chrome Extension with React & TypeScript</p>
      </header>

      <main className="popup-content">
        <section className="tab-info">
          <h2>Current Tab</h2>
          <div className="tab-details">
            <p>
              <strong>Title:</strong> {currentTab.title || 'Unknown'}
            </p>
            <p>
              <strong>URL:</strong> {currentTab.url || 'Unknown'}
            </p>
          </div>
        </section>

        <section className="message-section">
          <h2>Send Message</h2>
          <div className="input-group">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter a message..."
              className="message-input"
            />
            <button onClick={handleSendMessage} className="send-button">
              Send to Content Script
            </button>
          </div>
        </section>

        <section className="actions">
          <button onClick={handleStorageTest} className="action-button">
            Test Storage API
          </button>
        </section>
      </main>
    </div>
  );
};

export default Popup;
