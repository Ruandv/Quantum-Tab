import {
  LiveClockProps,
  QuickActionButtonsProps,
  BackgroundManagerProps,
  GitHubWidgetProps,
  WebsiteCounterProps,
  LocaleWidgetProps,
  SprintNumberProps,
  WidgetType
} from '../types/common';
import LiveClock from '../components/LiveClock';
import QuickActionButtons from '../components/QuickActionButtons';
import BackgroundManager from '../components/BackgroundManager';
import GitHubWidget from '../components/GitHubWidget';
import WebsiteCounter from '../components/WebsiteCounter';
import LocaleWidget from '../components/LocaleWidget';
import SprintNumber from '../components/SprintNumber';
import { defaultDimensions } from '@/types/defaults';

export class WidgetRegistry {
  private static instance: WidgetRegistry;
  private widgets = new Map<string, WidgetType>();

  private constructor() {
    this.registerDefaultWidgets();
  }

  public static getInstance(): WidgetRegistry {
    if (!WidgetRegistry.instance) {
      WidgetRegistry.instance = new WidgetRegistry();
    }
    return WidgetRegistry.instance;
  }

  private registerDefaultWidgets(): void {
    this.register<LiveClockProps>({
      id: 'live-clock',
      name: 'Live Clock',
      allowMultiples: true,
      description: 'Real-time clock with customizable timezone and format',
      component: LiveClock,
      defaultDimensions: { width: 400, height: 200 },
      defaultProps: {
        timeZone: getBrowserRegion(),
        dateFormat: 'yyyy-MM-dd',
        timeFormat: 'hh:mm a',
        showTime: true,
        showDate: false,
        showTimeZone: false,
      },
    });

    this.register<QuickActionButtonsProps>({
      id: 'quick-actions',
      name: 'Quick Actions',
      allowMultiples: true,
      description: 'Quick access buttons to your favorite websites',
      component: QuickActionButtons,
      defaultDimensions: { width: 350, height: 200 },
      defaultProps: {
        buttons: [
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
      },
    });

    this.register<BackgroundManagerProps>({
      id: 'background-manager',
      name: 'Background Manager',
      allowMultiples: false,
      description: 'Upload and manage custom background images',
      component: BackgroundManager,
      defaultDimensions: { width: 320, height: 320 },
      defaultProps: {},
    });

    this.register<GitHubWidgetProps>({
      id: 'github-widget',
      name: 'GitHub Repository',
      allowMultiples: true,
      description: 'Monitor and interact with GitHub repositories',
      component: GitHubWidget,
      defaultDimensions: { width: 400, height: 250 },
      defaultProps: {
        patToken: '',
        repositoryUrl: '',
      },
    });

    this.register<WebsiteCounterProps>({
      id: 'website-counter',
      name: 'Website Counter',
      allowMultiples: false,
      description: 'Track and count visits to your favorite websites',
      component: WebsiteCounter,
      defaultDimensions: { width: 350, height: 300 },
      defaultProps: {
        websites: ['google.com', 'github.com', 'mybroadband.co.za'].map((url) => {
          const hostname = url.replace('www.', '');
          return {
            url,
            hostname,
            count: 0,
            lastVisited: 0,
          };
        }),
        showFavicons: true,
        maxWebsites: 10,
        sortBy: 'count',
      },
    });

    this.register<LocaleWidgetProps>({
      id: 'locale-selector',
      name: 'Language Settings',
      allowMultiples: false,
      description: 'Change the language/locale of the extension interface',
      component: LocaleWidget,
      defaultDimensions: defaultDimensions,
      defaultProps: {
        selectedLocale: getBrowserLanguage(),
      },
    });

    this.register<SprintNumberProps>({
      id: 'sprint-number',
      name: 'Sprint Number',
      allowMultiples: true,
      description: 'Track and display your current sprint number with dates',
      component: SprintNumber,
      defaultDimensions: { width: 300, height: 250 },
      defaultProps: {
        startDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
        numberOfDays: 14,
        currentSprint: 1,
      },
    });
  }

  public register<T = any>(widget: WidgetType<T>): void {
    if (this.widgets.has(widget.id)) {
      console.warn(`Widget with id '${widget.id}' already exists. Overwriting...`);
    }
    this.widgets.set(widget.id, widget as WidgetType);
  }

  public unregister(widgetId: string): boolean {
    return this.widgets.delete(widgetId);
  }

  public get(widgetId: string): WidgetType | undefined {
    return this.widgets.get(widgetId);
  }

  public getAll(): WidgetType[] {
    return Array.from(this.widgets.values());
  }

  public getAvailable(): WidgetType[] {
    return this.getAll().filter((widget) => widget.component);
  }

  public getComponentByName(name: string): React.ComponentType<any> | undefined {
    const widget = Array.from(this.widgets.values()).find((w) => w.component.name === name);
    return widget?.component;
  }

  public findByComponentName(componentName: string): WidgetType | undefined {
    return Array.from(this.widgets.values()).find((widget) => {
      // Check direct name and displayName
      return (
        widget.component.name === componentName || widget.component.displayName === componentName
      );
    });
  }

  public createComponentMap(): Record<string, React.ComponentType<any>> {
    const map: Record<string, React.ComponentType<any>> = {};
    this.widgets.forEach((widget) => {
      // Use multiple keys for better matching
      const componentName = widget.component.name || widget.component.displayName || widget.id;
      map[componentName] = widget.component;

      // Also map by widget ID for reliable lookup
      map[widget.id] = widget.component;

      // Map by displayName for consistent identification
      if (widget.component.displayName) {
        map[widget.component.displayName] = widget.component;
      }
    });

    console.log('Created component map with keys:', Object.keys(map));
    return map;
  }
}

// Export singleton instance
export const widgetRegistry = WidgetRegistry.getInstance();
export default widgetRegistry;

/**
 * Gets the user's browser language preference
 * @returns {string} Language code (e.g., 'en', 'af', 'fr')
 */
function getBrowserLanguage(): string {
  try {
    // Primary method: Use navigator.language
    const browserLang = navigator.language.split('-')[0]; // Get language code without region

    // Available locales in our app - update this when adding new locales
    const availableLocales = ['en', 'af'];

    if (availableLocales.includes(browserLang)) {
      return browserLang;
    }
  } catch (error) {
    console.warn('Failed to detect browser language:', error);
  }

  // Fallback to English
  return 'en';
}

/**
 * Gets the user's browser timezone/region using modern browser APIs
 * @returns {string} IANA timezone identifier (e.g., 'America/New_York', 'Europe/London')
 */
function getBrowserRegion(): string {
  try {
    // Primary method: Use Intl.DateTimeFormat to get the resolved timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone) {
      return timezone;
    }
  } catch (error) {
    console.warn('Failed to get timezone from Intl.DateTimeFormat:', error);
  }

  try {
    // Fallback method: Use Date.toLocaleString with timezone option
    const date = new Date();
    const timeZoneGuess = date.toLocaleString('en', { timeZoneName: 'long' }).split(' ').pop();

    // Map common timezone abbreviations to IANA identifiers
    const timezoneMap: Record<string, string> = {
      'Eastern Standard Time': 'America/New_York',
      'Eastern Daylight Time': 'America/New_York',
      'Central Standard Time': 'America/Chicago',
      'Central Daylight Time': 'America/Chicago',
      'Mountain Standard Time': 'America/Denver',
      'Mountain Daylight Time': 'America/Denver',
      'Pacific Standard Time': 'America/Los_Angeles',
      'Pacific Daylight Time': 'America/Los_Angeles',
      'Greenwich Mean Time': 'Europe/London',
      'British Summer Time': 'Europe/London',
      'Central European Time': 'Europe/Berlin',
      'Central European Summer Time': 'Europe/Berlin',
      'Japan Standard Time': 'Asia/Tokyo',
      'China Standard Time': 'Asia/Shanghai',
      'India Standard Time': 'Asia/Kolkata',
      'Australian Eastern Standard Time': 'Australia/Sydney',
      'Australian Eastern Daylight Time': 'Australia/Sydney',
    };

    if (timeZoneGuess && timezoneMap[timeZoneGuess]) {
      return timezoneMap[timeZoneGuess];
    }
  } catch (error) {
    console.warn('Failed to get timezone from fallback method:', error);
  }

  try {
    // Another fallback: Use timezone offset to guess region
    const offset = new Date().getTimezoneOffset();
    const offsetMap: Record<number, string> = {
      480: 'America/Los_Angeles', // UTC-8
      420: 'America/Denver', // UTC-7
      360: 'America/Chicago', // UTC-6
      300: 'America/New_York', // UTC-5
      0: 'Europe/London', // UTC+0
      [-60]: 'Europe/Berlin', // UTC+1
      [-120]: 'Europe/Helsinki', // UTC+2
      [-480]: 'Asia/Shanghai', // UTC+8
      [-540]: 'Asia/Tokyo', // UTC+9
      [-330]: 'Asia/Kolkata', // UTC+5:30
      [-600]: 'Australia/Sydney', // UTC+10
    };

    if (offsetMap[offset]) {
      return offsetMap[offset];
    }
  } catch (error) {
    console.warn('Failed to get timezone from offset method:', error);
  }

  // Final fallback: Default to UTC
  console.warn('Unable to determine browser timezone, defaulting to UTC');
  return 'UTC';
}
