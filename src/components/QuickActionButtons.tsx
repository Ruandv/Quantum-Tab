import { QuickActionButtonsProps, ActionButton } from '@/types/common';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newButton, setNewButton] = useState({ icon: '', label: '', url: '' });

  const handleButtonClick = (url: string) => {
    if (!isLocked) {
      alert(t('quickActionButtons.messages.editState'))
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
      alert(t('quickActionButtons.messages.validationError'));
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
      <h3 className="widget-title">{t('quickActionButtons.title')}</h3>
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
          <button title={t('quickActionButtons.tooltips.add')} className="action-btn" onClick={handleAddButton}>
            <span className="btn-icon">➕</span>
            <span className="btn-label">{t('quickActionButtons.buttons.add')}</span>
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
            <h4>{t('quickActionButtons.popup.title')}</h4>
            <div className="form-group">
              <label>{t('quickActionButtons.popup.labels.icon')}</label>
              <input
                type="text"
                value={newButton.icon}
                onChange={(e) => setNewButton({ ...newButton, icon: e.target.value })}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  e.currentTarget.focus();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                placeholder={t('quickActionButtons.popup.placeholders.icon')}
                maxLength={2}
                style={{ pointerEvents: 'all', cursor: 'text' }}
                autoFocus={false}
              />
            </div>
            <div className="form-group">
              <label>{t('quickActionButtons.popup.labels.label')}</label>
              <input
                type="text"
                value={newButton.label}
                onChange={(e) => setNewButton({ ...newButton, label: e.target.value })}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  e.currentTarget.focus();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                placeholder={t('quickActionButtons.popup.placeholders.label')}
                style={{ pointerEvents: 'all', cursor: 'text' }}
              />
            </div>
            <div className="form-group">
              <label>{t('quickActionButtons.popup.labels.url')}</label>
              <input
                type="url"
                value={newButton.url}
                onChange={(e) => setNewButton({ ...newButton, url: e.target.value })}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  e.currentTarget.focus();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                placeholder={t('quickActionButtons.popup.placeholders.url')}
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
                {t('quickActionButtons.popup.buttons.save')}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelAdd();
                }} 
                className="cancel-btn"
                style={{ pointerEvents: 'all' }}
              >
                {t('quickActionButtons.popup.buttons.cancel')}
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