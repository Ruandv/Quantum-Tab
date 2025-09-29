import React from 'react';
import { createRoot } from 'react-dom/client';
import NewTab from './NewTab';
import ErrorBoundary from '../components/ErrorBoundary';
import '../i18n'; // Initialize i18n
import './newtab.css';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <NewTab />
    </ErrorBoundary>
  );
} else {
  console.error('Root container not found!');
}