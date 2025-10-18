import { QuickActionButtonsProps } from '@/types/common';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import QuickActionButtonItem from './quickActionButtonItem';
import { addWidgetRemovalListener } from '../../utils/widgetEvents';
import { ModalDialog } from '../ModalDialog/modalDialog';
import styles from './quickActionButtons.module.css';

const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({
  buttons = [
    {
      icon: '🐙',
      label: 'GitHub',
      url: 'https://github.com',
    },
    {
      icon: '🗞️',
      label: 'MyBroadband',
      url: 'https://mybroadband.co.za/',
    },
  ],
  isLocked,
  onButtonsChange,
  widgetId,
}: QuickActionButtonsProps) => {
  const { t } = useTranslation();

  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newButton, setNewButton] = useState({ icon: '', label: '', url: '' });

  // Add widget removal event listener for cleanup
  useEffect(() => {
    if (!widgetId) return;

    const removeListener = addWidgetRemovalListener(widgetId, async () => {
      // No specific storage cleanup needed - QuickActionButtons data is stored
      // as part of the widget configuration in 'quantum-tab-widgets' and is
      // automatically removed when the widget is deleted from the dashboard
      console.log('QuickActionButtons widget removed:', widgetId);
    });

    // Cleanup listener when component unmounts
    return removeListener;
  }, [widgetId]);

  const handleButtonClick = (url: string) => {
    if (!isLocked) {
      alert(t('quickActionButtons.messages.editState'));
    } else {
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
    } else {
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
    <>
      <div className={styles.actionButtons}>
        {!isLocked && (
          <button
            title={t('quickActionButtons.tooltips.add')}
            className={styles.actionBtn}
            onClick={handleAddButton}
          >
            <span className={styles.btnIcon}>➕</span>
            <span className={styles.btnLabel}>{t('common.buttons.add')}</span>
          </button>
        )}
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
        
      </div>

      {/* Add Button Popup */}
      {showAddPopup && (
        <><ModalDialog
          isOpen={showAddPopup}
          onClose={handleCancelAdd}
          content={{
            title: t('quickActionButtons.popup.title'),
            content: <><div className="form-group">
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
                placeholder={t('common.placeholders.emoji')}
                maxLength={2}
                style={{ pointerEvents: 'all', cursor: 'text' }}
                autoFocus={false} />
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
                  placeholder={t('common.placeholders.website')}
                  style={{ pointerEvents: 'all', cursor: 'text' }} />
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
                  placeholder={t('common.placeholders.url')}
                  style={{ pointerEvents: 'all', cursor: 'text' }} />
              </div></>,
            actions: [
              { index: 1, text: t('common.buttons.save'), onClick: handleSaveButton },
              { index: 2, text: t('common.buttons.cancel'), onClick: handleCancelAdd },
            ],
          }}
        >
        </ModalDialog>
        </>
      )}
    </>
  );
};

QuickActionButtons.displayName = 'QuickActionButtons';

export default QuickActionButtons;
