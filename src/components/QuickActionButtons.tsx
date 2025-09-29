import { QuickActionButtonsProps, ActionButton } from '@/types/common';
import React, { useState } from 'react';
import QuickActionButtonItem from './QuickActionButtonItem';

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
          <QuickActionButtonItem
            key={index}
            button={button}
            index={index}
            isLocked={isLocked}
            onButtonClick={handleButtonClick}
            onRemoveButton={handleRemoveButton}
          />
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
        <div 
          className="add-popup-overlay" 
          onClick={handleCancelAdd}
        >
          <div 
            className="add-popup" 
            onClick={(e) => e.stopPropagation()}
          >
            <h4>Add New Action Button</h4>
            <div className="form-group">
              <label>Icon (emoji):</label>
              <input
                type="text"
                value={newButton.icon}
                onChange={(e) => setNewButton({ ...newButton, icon: e.target.value })}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  e.currentTarget.focus();
                  console.log('Icon input clicked and focused');
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  console.log('Icon input mouse down');
                }}
                onFocus={(e) => console.log('Icon input focused')}
                placeholder="🌟"
                maxLength={2}
                style={{ pointerEvents: 'all', cursor: 'text' }}
                autoFocus={false}
              />
            </div>
            <div className="form-group">
              <label>Label:</label>
              <input
                type="text"
                value={newButton.label}
                onChange={(e) => setNewButton({ ...newButton, label: e.target.value })}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  e.currentTarget.focus();
                  console.log('Label input clicked and focused');
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  console.log('Label input mouse down');
                }}
                onFocus={(e) => console.log('Label input focused')}
                placeholder="My Website"
                style={{ pointerEvents: 'all', cursor: 'text' }}
              />
            </div>
            <div className="form-group">
              <label>URL:</label>
              <input
                type="url"
                value={newButton.url}
                onChange={(e) => setNewButton({ ...newButton, url: e.target.value })}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  e.currentTarget.focus();
                  console.log('URL input clicked and focused');
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  console.log('URL input mouse down');
                }}
                onFocus={(e) => console.log('URL input focused')}
                placeholder="https://example.com"
                style={{ pointerEvents: 'all', cursor: 'text' }}
              />
            </div>
            <div className="popup-buttons">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveButton();
                }} 
                className="save-btn"
                style={{ pointerEvents: 'all' }}
              >
                Save
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelAdd();
                }} 
                className="cancel-btn"
                style={{ pointerEvents: 'all' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

QuickActionButtons.displayName = 'QuickActionButtons';

export default QuickActionButtons;