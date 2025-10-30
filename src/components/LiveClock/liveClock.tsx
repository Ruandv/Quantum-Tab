import { LiveClockProps } from '@/types/common';
import React, { useState, useEffect } from 'react';
import { addWidgetRemovalListener } from '../../utils/widgetEvents';
import styles from './liveClock.module.css';
import { GoogleAnalyticsService } from '@/services/googleAnalyticsService';

const LiveClock: React.FC<LiveClockProps> = ({
  timeZone,
  dateFormat = 'yyyy-MM-dd',
  timeFormat = 'hh:mm a',
  showDate,
  showTime = true,
  showTimeZone,
  widgetId,
}: LiveClockProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Add widget removal event listener for cleanup
  useEffect(() => {
    if (!widgetId) return;

    const removeListener = addWidgetRemovalListener(widgetId, async () => {
      // Cleanup: Clear any LiveClock-specific storage or timers
      try {
        console.log('Cleaning up LiveClock widget data for:', widgetId);
        const ga = await GoogleAnalyticsService.getInstance();
        await ga.sendEvent('widget_removed', { widgetId , widgetName: LiveClock.displayName});
        // Clear any clock-specific storage if it exists
        if (typeof chrome !== 'undefined' && chrome.storage) {
          console.log('LiveClock widget storage cleared for widget:', widgetId);
        }
      } catch (error) {
        console.error('Failed to cleanup LiveClock widget data:', error);
      }
    });

    // Cleanup listener when component unmounts
    return removeListener;
  }, [widgetId]);

  const formatTime = (date: Date) => {
    // Create a date object in the specified timezone
    const timeInZone = new Date(date.toLocaleString('en-US', { timeZone }));

    // Time format token mapping
    const formatMap: { [key: string]: string } = {
      // Hours
      HH: String(timeInZone.getHours()).padStart(2, '0'), // 24-hour format with zero (00-23)
      H: String(timeInZone.getHours()), // 24-hour format without zero (0-23)
      hh: String(timeInZone.getHours() % 12 || 12).padStart(2, '0'), // 12-hour format with zero (01-12)
      h: String(timeInZone.getHours() % 12 || 12), // 12-hour format without zero (1-12)

      // Minutes
      mm: String(timeInZone.getMinutes()).padStart(2, '0'), // Minutes with zero (00-59)
      m: String(timeInZone.getMinutes()), // Minutes without zero (0-59)

      // Seconds
      ss: String(timeInZone.getSeconds()).padStart(2, '0'), // Seconds with zero (00-59)
      s: String(timeInZone.getSeconds()), // Seconds without zero (0-59)

      // AM/PM
      A: timeInZone.getHours() >= 12 ? 'PM' : 'AM', // Uppercase AM/PM
      a: timeInZone.getHours() >= 12 ? 'pm' : 'am', // Lowercase am/pm

      // Milliseconds
      SSS: String(timeInZone.getMilliseconds()).padStart(3, '0'), // Milliseconds (000-999)
    };

    // Replace format tokens with actual values
    // Use a regex that matches tokens as whole words or surrounded by non-alphanumeric characters
    let formattedTime = timeFormat;
    Object.keys(formatMap)
      .sort((a, b) => b.length - a.length)
      .forEach((token) => {
        // Use a regex with word boundaries to avoid partial replacements
        const regex = new RegExp(`\\b${token}\\b`, 'g');
        formattedTime = formattedTime.replace(regex, formatMap[token]);
      });

    return formattedTime;
  };

  const formatDate = (date: Date) => {
    // Use browser's locale or fallback to en-US
    const locale = navigator.language || 'en-US';

    // Helper functions to get localized names using Intl API
    const getLocalizedMonth = (date: Date, format: 'long' | 'short') => {
      return new Intl.DateTimeFormat(locale, { month: format }).format(date);
    };

    const getLocalizedDay = (date: Date, format: 'long' | 'short') => {
      return new Intl.DateTimeFormat(locale, { weekday: format }).format(date);
    };

    // Comprehensive format token mapping using Intl API
    const formatMap: { [key: string]: string } = {
      // Year tokens
      yyyy: date.getFullYear().toString(),
      yyy: date.getFullYear().toString(),
      yy: date.getFullYear().toString().slice(-2),

      // Month tokens (using Intl API for localization)
      MMMM: getLocalizedMonth(date, 'long'), // Full month name
      MMM: getLocalizedMonth(date, 'short'), // Short month name
      MM: String(date.getMonth() + 1).padStart(2, '0'), // 2-digit month with zero
      M: String(date.getMonth() + 1), // Month without zero

      // Day tokens (using Intl API for localization)
      dddd: getLocalizedDay(date, 'long'), // Full day name
      ddd: getLocalizedDay(date, 'short'), // Short day name
      dd: String(date.getDate()).padStart(2, '0'), // 2-digit day with zero
      d: String(date.getDate()), // Day without zero
    };

    // Replace format tokens with actual values
    // Use a regex that matches tokens as whole words or surrounded by non-alphanumeric characters
    let formattedDate = dateFormat;
    Object.keys(formatMap)
      .sort((a, b) => b.length - a.length)
      .forEach((token) => {
        // Use a regex with word boundaries to avoid partial replacements
        const regex = new RegExp(`\\b${token}\\b`, 'g');
        formattedDate = formattedDate.replace(regex, formatMap[token]);
      });

    return formattedDate;
  };

  return (
    <>
      <div className={styles.timeDisplay}>
        {showTime && <h2 className={styles.currentTime}>{formatTime(currentTime)}</h2>}
        {showDate && <p className={styles.currentDate}>{formatDate(currentTime)}</p>}
      </div>
      {showTimeZone && <p className={styles.timeZone}>{timeZone}</p>}
    </>
  );
};

LiveClock.displayName = 'LiveClock';

export default LiveClock;
