import React from 'react';
import { createRoot } from 'react-dom/client';
import NewTab from './NewTab';
import ErrorBoundary from '../components/ErrorBoundary';
import i18n from '../i18n'; // Import i18n instance
import './newtab.css';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  
  // Wait for i18n to be initialized before rendering
  const renderApp = () => {
    root.render(
      <ErrorBoundary>
        <NewTab />
      </ErrorBoundary>
    );
  };

  // Check if i18n is already initialized
  if (i18n.isInitialized) {
    renderApp();
  } else {
    // Wait for i18n to initialize
    i18n.on('initialized', () => {
      renderApp();
    });
    
    // Fallback timeout in case initialization doesn't fire the event
    setTimeout(() => {
      if (!i18n.isInitialized) {
        console.warn('i18n initialization timeout, rendering anyway');
        renderApp();
      }
    }, 1000);
  }
} else {
  console.error('Root container not found!');
}