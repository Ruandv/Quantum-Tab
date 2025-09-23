import React from 'react';
import { createRoot } from 'react-dom/client';
import NewTab from './NewTab';
import './newtab.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<NewTab />);
}