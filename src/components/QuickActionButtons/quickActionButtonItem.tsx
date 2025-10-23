import React from 'react';
import { QuickActionButtonItemProps } from '@/types/common';
import styles from './quickActionButtons.module.css';

const QuickActionButtonItem: React.FC<QuickActionButtonItemProps> = ({
  button,
  index,
  isLocked,
  onButtonClick,
  onRemoveButton,
}) => {
  return (
    <div key={index} className={styles.actionBtnContainer}>
      <button
        className={styles.actionBtn}
        onClick={() => onButtonClick(button.url)}
        title={`Open ${button.label}`}
      >
        <span className={styles.btnIcon}>{button.icon}</span>
        <span className={styles.btnLabel}>{button.label}</span>
      </button>
      {!isLocked && (
        <button
          className={styles.removeBtn}
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
