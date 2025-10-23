import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SprintNumberProps } from '@/types/common';
import { addWidgetRemovalListener } from '../../utils/widgetEvents';
import styles from './sprintNumber.module.css';
import widgetCommon from '../../styles/widgetCommon.module.css';

const SprintNumber: React.FC<SprintNumberProps> = ({
  startDate,
  numberOfDays,
  currentSprint,
  widgetId,
}: SprintNumberProps) => {
  const { t } = useTranslation();
  const [currentSprintNumber, setCurrentSprintNumber] = useState<number>(currentSprint);
  const [sprintStartDate, setSprintStartDate] = useState<Date>(new Date());
  const [sprintEndDate, setSprintEndDate] = useState<Date>(new Date());
  const [error, setError] = useState<string>('');

  // Calculate sprint information
  useEffect(() => {
    try {
      // Validate and parse the start date
      const parsedStartDate = new Date(startDate);

      if (isNaN(parsedStartDate.getTime())) {
        setError(t('sprintNumber.errors.invalidDateFormat'));
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate day calculation
      parsedStartDate.setHours(0, 0, 0, 0);

      // Calculate the difference in days
      const diffInMs = today.getTime() - parsedStartDate.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      // Calculate how many sprints have passed
      const sprintsPassed = Math.floor(diffInDays / numberOfDays);

      // Calculate the current sprint number
      const calculatedSprintNumber = currentSprint + sprintsPassed;
      setCurrentSprintNumber(calculatedSprintNumber);

      // Calculate current sprint start and end dates
      const currentSprintStartDate = new Date(parsedStartDate);
      currentSprintStartDate.setDate(
        currentSprintStartDate.getDate() + sprintsPassed * numberOfDays
      );

      const currentSprintEndDate = new Date(currentSprintStartDate);
      currentSprintEndDate.setDate(currentSprintEndDate.getDate() + numberOfDays - 1);

      setSprintStartDate(currentSprintStartDate);
      setSprintEndDate(currentSprintEndDate);
      setError('');
    } catch (err) {
      console.error('Error calculating sprint number:', err);
      setError(t('sprintNumber.errors.calculationError'));
    }
  }, [startDate, numberOfDays, currentSprint, t]);

  // Update sprint information every day at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    // Set a timer to recalculate at midnight
    const midnightTimer = setTimeout(() => {
      // Force re-render by updating a dependency
      setCurrentSprintNumber((prev) => prev);

      // Set up daily interval
      const dailyInterval = setInterval(
        () => {
          setCurrentSprintNumber((prev) => prev);
        },
        24 * 60 * 60 * 1000
      ); // 24 hours

      return () => clearInterval(dailyInterval);
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimer);
  }, [startDate, numberOfDays, currentSprint]);

  // Add widget removal event listener for cleanup
  useEffect(() => {
    if (!widgetId) return;

    const removeListener = addWidgetRemovalListener(widgetId, async () => {
      try {
        console.log('Cleaning up SprintNumber widget data for:', widgetId);
        // No specific storage to clean up for this widget
      } catch (error) {
        console.error('Failed to cleanup SprintNumber widget data:', error);
      }
    });

    return removeListener;
  }, [widgetId]);

  // Format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (error) {
    return (
      <div className={`${styles.sprintNumberWidget} ${styles.error}`}>
        <div className={styles.errorMessage}>{error}</div>
      </div>
    );
  }

  return (
    <>
      <div className={`${widgetCommon.widgetTitle}`}>{t('sprintNumber.labels.sprint')}</div>
      <div className={`${styles.sprintNumber}`}>{currentSprintNumber}</div>
      <div className={`${styles.sprintDates}`}>
        <div className={`${styles.dateRow}`}>
          <span className={`${styles.dateLabel}`}>{t('sprintNumber.labels.start')}:</span>
          <span className={`${styles.dateValue}`}>{formatDate(sprintStartDate)}</span>
        </div>
        <div className={`${styles.dateRow}`}>
          <span className={`${styles.dateLabel}`}>{t('sprintNumber.labels.end')}:</span>
          <span className={`${styles.dateValue}`}>{formatDate(sprintEndDate)}</span>
        </div>
      </div>
    </>
  );
};

export default SprintNumber;
