import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './Popup';
import '../i18n'; // Initialize i18n
import './popup.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
