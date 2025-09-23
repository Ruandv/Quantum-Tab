import React from 'react';

interface ActionButton {
  icon: string;
  label: string;
  url: string;
}

interface QuickActionButtonsProps {
  className?: string;
  buttons?: ActionButton[];
}

const defaultButtons: ActionButton[] = [
  {
    icon: '🐙',
    label: 'GitHub',
    url: 'https://github.com',
  },
  {
    icon: '📚',
    label: 'Stack Overflow',
    url: 'https://stackoverflow.com',
  },
  {
    icon: '📖',
    label: 'MDN Docs',
    url: 'https://developer.mozilla.org',
  },
  {
    icon: '🎥',
    label: 'YouTube',
    url: 'https://youtube.com',
  },
];

const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({ 
  className = '', 
  buttons = defaultButtons 
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
      </div>
    </div>
  );
};

export default QuickActionButtons;