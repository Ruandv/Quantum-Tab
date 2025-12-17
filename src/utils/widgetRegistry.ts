import {
  LiveClockProps,
  QuickActionButtonsProps,
  BackgroundManagerProps,
  LocaleWidgetProps,
  SprintNumberProps,
  WidgetType,
  QuarterIndicatorProps,
  GitHubGuruProps,
  SettingsWidgetProps
} from '../types/common';
import LiveClock from '../components/LiveClock/liveClock';
import QuickActionButtons from '../components/QuickActionButtons/quickActionButtons';
import LocaleWidget from '../components/LocaleWidget/localeWidget';
import SprintNumber from '../components/SprintNumber/sprintNumber';
import { defaultDimensions } from '@/types/defaults';
import BackgroundManager from '@/components/BackgroundManager/backgroundManager';
import QuarterIndicator from '@/components/QuarterIndicator/quaterIndicator';
import GitHubGuru from '@/components/GitHubGuru/gitHubGuru';
import SettingsWidget from '@/components/SettingsWidget/settingsWidget';

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
      wikiPage: 'liveclock',
      allowMultiples: true,
      isRuntimeVisible: true,
      description: 'Real-time clock with customizable timezone and format',
      component: LiveClock,
      defaultDimensions: { width: 400, height: 200 },
      defaultProps: {
        widgetHeading: 'Live Clock',
        timeZone: getBrowserRegion(),
        dateFormat: 'yyyy-MM-dd',
        timeFormat: 'hh:mm a',
        showTime: true,
        showDate: false,
        showTimeZone: false,
      },
      group: 'general'
    });

    this.register<QuickActionButtonsProps>({
      id: 'quick-actions',
      name: 'Quick Actions',
      wikiPage: 'quickactions',
      allowMultiples: true,
      isRuntimeVisible: true,
      group: 'general',
      description: 'Quick access buttons to your favorite websites',
      component: QuickActionButtons,
      defaultDimensions: { width: 350, height: 200 },
      defaultProps: {
        widgetHeading: 'Quick Actions',
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
      wikiPage: 'backgroundmanager',
      allowMultiples: false,
      isRuntimeVisible: false,
      group: 'general',
      description: 'Upload and manage custom background images',
      component: BackgroundManager,
      defaultDimensions: { width: 320, height: 320 },
      defaultProps: {
        widgetHeading: 'Background Manager',
        settingId: 0,
        aiPrompt: '',
        isAIEnabled: false,
        providerName: "GitToken",
        autoRefresh: false,
        refreshInterval: 360, // 360 minutes = 6 hours
        backgroundSize: 'cover',
      },
      metaData: { lastRefresh: new Date(), backgroundImage: '' }
    });

    this.register<GitHubGuruProps>({
      id: 'github-guru',
      name: 'GitHub Guru',
      wikiPage: 'github-guru',
      allowMultiples: true,
      isRuntimeVisible: true,
      group: 'git',
      description: 'Monitor all PRs and your PRs with notifications',
      component: GitHubGuru,
      defaultDimensions: { width: 450, height: 300 },
      defaultProps: {
        widgetHeading: 'GitHub Guru',
        repositoryUrl: '',
        autoRefresh: true,
        providerName: "GitToken",
        refreshInterval: 5, // in minutes
      },
    });

    this.register<LocaleWidgetProps>({
      id: 'locale-selector',
      name: 'Language Settings',
      wikiPage: 'localewidget',
      allowMultiples: false,
      isRuntimeVisible: false,
      group: 'general',
      description: 'Change your preferred language and locale',
      component: LocaleWidget,
      defaultDimensions: defaultDimensions,
      defaultProps: {
        widgetHeading: 'Language Settings',
        selectedLocale: getBrowserLanguage(),
      },
    });

    this.register<SprintNumberProps>({
      id: 'sprint-number',
      name: 'Sprint Counter',
      allowMultiples: true,
      isRuntimeVisible: true,
      group: 'business',
      description: 'Track sprint numbers and project timelines',
      component: SprintNumber,
      defaultDimensions: { width: 300, height: 250 },
      defaultProps: {
        widgetHeading: 'Sprint Counter',
        startDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
        numberOfDays: 14,
        currentSprint: 1,
      },
      wikiPage: 'sprint-number'
    });

    this.register<QuarterIndicatorProps>({
      id: 'quarter-indicator',
      name: 'Quarter Indicator',
      allowMultiples: true,
      isRuntimeVisible: true,
      description: 'Track quarterly progress and milestones',
      component: QuarterIndicator,
      defaultDimensions: { width: 300, height: 250 },
      defaultProps: {
        widgetHeading: 'Quarter Indicator',
        startDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      },
      group: 'business',
      wikiPage: 'quarter-indicator'
    });

    this.register<SettingsWidgetProps>({
      id: 'settings-widget',
      name: 'Settings',
      wikiPage: 'settings',
      allowMultiples: false,
      isRuntimeVisible: false,
      group: 'general',
      description: 'Manage PAT tokens and provider settings',
      component: SettingsWidget,
      defaultDimensions: { width: 500, height: 400 },
      defaultProps: {
        widgetHeading: 'Settings',
      },
    });
  }

  public register<T = unknown>(widget: WidgetType<T>): void {
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

  // Method to get localized widget information
  public getLocalizedWidget(widgetId: string, t?: (key: string) => string): WidgetType | undefined {
    const widget = this.get(widgetId);
    if (!widget || !t) return widget;

    // Create a localized copy of the widget
    const localizedWidget = { ...widget };

    // Map widget IDs to translation keys
    const translationMap: Record<string, { name: string; description: string }> = {
      'live-clock': { name: 'widgets.liveClock.name', description: 'widgets.liveClock.description' },
      'quick-actions': { name: 'widgets.quickActions.name', description: 'widgets.quickActions.description' },
      'background-manager': { name: 'widgets.backgroundManager.name', description: 'widgets.backgroundManager.description' },
      'github-widget': { name: 'widgets.githubWidget.name', description: 'widgets.githubWidget.description' },
      'github-guru': { name: 'widgets.githubGuru.name', description: 'widgets.githubGuru.description' },
      'locale-selector': { name: 'widgets.localeWidget.name', description: 'widgets.localeWidget.description' },
      'sprint-number': { name: 'widgets.sprintNumber.name', description: 'widgets.sprintNumber.description' },
    };

    const translations = translationMap[widgetId];
    if (translations) {
      localizedWidget.name = t(translations.name);
      localizedWidget.description = t(translations.description);
    }

    return localizedWidget;
  }

  public getAllLocalized(t?: (key: string) => string): WidgetType[] {
    if (!t) return this.getAll();

    return this.getAll().map(widget => this.getLocalizedWidget(widget.id, t) || widget);
  }

  public getComponentByName(name: string): React.ComponentType<Record<string, unknown>> | undefined {
    const widget = Array.from(this.widgets.values()).find((w) => w.component.name.toLowerCase() === name.toLowerCase());
    return widget?.component;
  }

  public getComponentNameByKey(key: string): string {
    const widget = Array.from(this.widgets.values()).find((w) => w.id === key);
    return widget?.name || key;
  }

  public findByComponentName(componentName: string): WidgetType | undefined {
    return Array.from(this.widgets.values()).find((widget) => {
      // console.log(widget.component.name,  widget.id);

      // Check direct name and displayName
      return (
        widget.component.name === componentName || widget.component.displayName === componentName
      );
    });
  }

  public createComponentMap(): Record<string, React.ComponentType<Record<string, unknown>>> {
    const map: Record<string, React.ComponentType<Record<string, unknown>>> = {};
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
