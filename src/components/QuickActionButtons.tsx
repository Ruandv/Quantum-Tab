import { QuickActionButtonsProps } from '@/types/common';
import React from 'react';

interface ActionButton {
  icon: string;
  label: string;
  url: string;
}

const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({
  className = '',
  buttons = [{
    icon: '🐙',
    label: 'GitHub',
    url: 'https://github.com',
  },
  {
    icon: '🗞️',
    label: 'MyBroadband',
    url: 'https://mybroadband.co.za/',
  },]
}) => {
  const handleButtonClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className={`quick-actions-widget ${className}`}>
      <h3 className="widget-title">Quick Access</h3>
      <div className="action-buttons">
        {buttons.map((button, index) => (
          <button
            key={index}
            className="action-btn"
            onClick={() => handleButtonClick(button.url)}
            title={`Open ${button.label}`}
          >
            <span className="btn-icon">{button.icon}</span>
            <span className="btn-label">{button.label}</span>
          </button>
        ))}
        <button title='Add' className="action-btn">
          <span className="btn-icon">➕</span>
          <span className="btn-label">Add</span>
        </button>
      </div>
    </div>
  );
};

export default QuickActionButtons;