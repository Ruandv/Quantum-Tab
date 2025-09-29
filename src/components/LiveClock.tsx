import { LiveClockProps } from '@/types/common';
import React, { useState, useEffect } from 'react';

const LiveClock: React.FC<LiveClockProps> = ({ 
  className = '', 
  timeZone, 
  dateFormat = "yyyy-MM-dd", 
  timeFormat = "hh:mm a", 
  showDate, 
  showTime = true, 
  showTimeZone,
  // Get dimensions from parent ResizableWidget via CSS custom properties
  // These will be available as CSS variables in the component
}: LiveClockProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    // Create a date object in the specified timezone
    const timeInZone = new Date(date.toLocaleString("en-US", { timeZone }));

    // Time format token mapping
    const formatMap: { [key: string]: string } = {
      // Hours
      'HH': String(timeInZone.getHours()).padStart(2, '0'), // 24-hour format with zero (00-23)
      'H': String(timeInZone.getHours()), // 24-hour format without zero (0-23)
      'hh': String(timeInZone.getHours() % 12 || 12).padStart(2, '0'), // 12-hour format with zero (01-12)
      'h': String(timeInZone.getHours() % 12 || 12), // 12-hour format without zero (1-12)

      // Minutes
      'mm': String(timeInZone.getMinutes()).padStart(2, '0'), // Minutes with zero (00-59)
      'm': String(timeInZone.getMinutes()), // Minutes without zero (0-59)

      // Seconds
      'ss': String(timeInZone.getSeconds()).padStart(2, '0'), // Seconds with zero (00-59)
      's': String(timeInZone.getSeconds()), // Seconds without zero (0-59)

      // AM/PM
      'A': timeInZone.getHours() >= 12 ? 'PM' : 'AM', // Uppercase AM/PM
      'a': timeInZone.getHours() >= 12 ? 'pm' : 'am', // Lowercase am/pm

      // Milliseconds
      'SSS': String(timeInZone.getMilliseconds()).padStart(3, '0'), // Milliseconds (000-999)
    };

    // Replace format tokens with actual values
    // Sort keys by length (longest first) to avoid partial replacements
    let formattedTime = timeFormat;
    Object.keys(formatMap)
      .sort((a, b) => b.length - a.length)
      .forEach(token => {
        formattedTime = formattedTime.replace(new RegExp(token, 'g'), formatMap[token]);
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
      'yyyy': date.getFullYear().toString(),
      'yyy': date.getFullYear().toString(),
      'yy': date.getFullYear().toString().slice(-2),

      // Month tokens (using Intl API for localization)
      'MMMM': getLocalizedMonth(date, 'long'), // Full month name
      'MMM': getLocalizedMonth(date, 'short'), // Short month name
      'MM': String(date.getMonth() + 1).padStart(2, '0'), // 2-digit month with zero
      'M': String(date.getMonth() + 1), // Month without zero

      // Day tokens (using Intl API for localization)
      'dddd': getLocalizedDay(date, 'long'), // Full day name
      'ddd': getLocalizedDay(date, 'short'), // Short day name
      'dd': String(date.getDate()).padStart(2, '0'), // 2-digit day with zero
      'd': String(date.getDate()), // Day without zero
    };

    // Replace format tokens with actual values
    // Sort keys by length (longest first) to avoid partial replacements
    let formattedDate = dateFormat;
    Object.keys(formatMap)
      .sort((a, b) => b.length - a.length)
      .forEach(token => {
        formattedDate = formattedDate.replace(new RegExp(token, 'g'), formatMap[token]);
      });

    return formattedDate;
  };

  return (
    <div className={`live-clock-widget ${className}`}>
      <div className="time-display">
        {showTime && <h2 className="current-time">{formatTime(currentTime)}</h2>}
        {showDate && <p className="current-date">{formatDate(currentTime)}</p>}
      </div>
      {showTimeZone && <p className="time-zone">{timeZone}</p>}
    </div>
  );
};

LiveClock.displayName = 'LiveClock';

export default LiveClock;