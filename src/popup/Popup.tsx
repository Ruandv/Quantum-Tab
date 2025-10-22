import React from 'react';

const Popup: React.FC = () => {
  const version = chrome.runtime.getManifest().version;

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>Quantum Tab <sub>{version}</sub></h1>
        <p>New tab. New intelligence.</p>
      </header>

      <main className="popup-content">
        <section className="tab-info">
          <h2>Recent Changes</h2>
          <div className="tab-details">
            <p>
              <strong>Change log:</strong> <a target='_blank' href={`https://github.com/Ruandv/Quantum-Tab/releases/tag/v${version}`} rel="noreferrer">View Release Notes</a>
            </p>
          </div>
        </section>
        <section className="tab-info">
          <h2>Bugs & Requests</h2>
          <div className="tab-details">
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
