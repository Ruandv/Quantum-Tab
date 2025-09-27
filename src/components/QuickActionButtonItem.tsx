import React from 'react';
import { ActionButton, QuickActionButtonItemProps } from '@/types/common';

const QuickActionButtonItem: React.FC<QuickActionButtonItemProps> = ({
  button,
  index,
  isLocked,
  onButtonClick,
  onRemoveButton
}) => {
  return (
    <div key={index} className="action-btn-container">
      <button
        className="action-btn"
        onClick={() => onButtonClick(button.url)}
        title={`Open ${button.label}`}
      >
        <span className="btn-icon">{button.icon}</span>
        <span className="btn-label">{button.label}</span>
      </button>
      {!isLocked && (
        <button
          className="remove-btn"
          onClick={() => onRemoveButton(index)}
          title="Remove button"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default QuickActionButtonItem;