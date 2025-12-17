import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './Popup';
import i18n from '../i18n'; // Import i18n instance
import './popup.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);

  const renderApp = () => {
    root.render(<Popup />);
  };

  if (i18n.isInitialized) {
    renderApp();
  } else {
    i18n.on('initialized', () => {
      renderApp();
    });

    // Fallback timeout
    setTimeout(() => {
      if (!i18n.isInitialized) {
        console.warn('i18n initialization timeout in popup, rendering anyway');
        renderApp();
      }
    }, 1000);
  }
}
