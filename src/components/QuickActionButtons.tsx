import { QuickActionButtonsProps, ActionButton } from '@/types/common';
import React, { useState } from 'react';

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
  },],
  isLocked,
  onButtonsChange
}: QuickActionButtonsProps) => {
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newButton, setNewButton] = useState({ icon: '', label: '', url: '' });

  const handleButtonClick = (url: string) => {
    if (!isLocked) {
      alert("you are in edit state")
    }
    else {
      window.open(url, '_blank');
    }
  };

  const handleAddButton = () => {
    setShowAddPopup(true);
  };

  const handleSaveButton = () => {
    if (newButton.icon && newButton.label && newButton.url) {
      const updatedButtons = [...buttons, newButton];
      onButtonsChange?.(updatedButtons);
      setNewButton({ icon: '', label: '', url: '' });
      setShowAddPopup(false);
    }
    else {
      alert("eee");
    }
  };

  const handleCancelAdd = () => {
    setNewButton({ icon: '', label: '', url: '' });
    setShowAddPopup(false);
  };

  const handleRemoveButton = (index: number) => {
    const updatedButtons = buttons.filter((_, i) => i !== index);
    onButtonsChange?.(updatedButtons);
  };

  return (
    <div className={`quick-actions-widget ${className}`}>
      <h3 className="widget-title">Quick Access</h3>
      <div className="action-buttons">
        {buttons.map((button, index) => (
          <div key={index} className="action-btn-container">
            <button
              className="action-btn"
              onClick={() => handleButtonClick(button.url)}
              title={`Open ${button.label}`}
            >
              <span className="btn-icon">{button.icon}</span>
              <span className="btn-label">{button.label}</span>
            </button>
            {!isLocked && (
              <button
                className="remove-btn"
                onClick={() => handleRemoveButton(index)}
                title="Remove button"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {!isLocked && (
          <button title='Add' className="action-btn" onClick={handleAddButton}>
            <span className="btn-icon">➕</span>
            <span className="btn-label">Add</span>
          </button>
        )}
      </div>

      {/* Add Button Popup */}
      {showAddPopup && (
        <div className="add-popup-overlay">
          <div className="add-popup">
            <h4>Add New Action Button</h4>
            <div className="form-group">
              <label>Icon (emoji):</label>
              <input
                type="text"
                value={newButton.icon}
                onChange={(e) => setNewButton({ ...newButton, icon: e.target.value })}
                placeholder="🌟"
                maxLength={2}
              />
            </div>
            <div className="form-group">
              <label>Label:</label>
              <input
                type="text"
                value={newButton.label}
                onChange={(e) => setNewButton({ ...newButton, label: e.target.value })}
                placeholder="My Website"
              />
            </div>
            <div className="form-group">
              <label>URL:</label>
              <input
                type="url"
                value={newButton.url}
                onChange={(e) => setNewButton({ ...newButton, url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="popup-buttons">
              <button onClick={handleSaveButton} className="save-btn">
                Save
              </button>
              <button onClick={handleCancelAdd} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickActionButtons;