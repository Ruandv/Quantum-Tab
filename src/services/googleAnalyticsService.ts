// Google Analytics service for Chrome Extension using Measurement Protocol v4
export class GoogleAnalyticsService {
  private static instance: GoogleAnalyticsService;
  private measurementId: string;
  private apiSecret: string;
  private clientId: string;
  private sessionId: string;
  private initialized = false;

  private constructor() {
    // Initialize with default values - these should be configured
    this.measurementId = '';
    this.apiSecret = '';
    this.clientId = this.generateClientId();
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): GoogleAnalyticsService {
    if (!GoogleAnalyticsService.instance) {
      GoogleAnalyticsService.instance = new GoogleAnalyticsService();
    }
    return GoogleAnalyticsService.instance;
  }

  /**
   * Initialize the GA service with measurement ID and API secret
   */
  public initialize(measurementId: string, apiSecret: string): void {
    this.measurementId = measurementId;
    this.apiSecret = apiSecret;
    this.initialized = true;
  }

  /**
   * Check if GA is properly configured
   */
  public isConfigured(): boolean {
    return this.initialized && !!this.measurementId && !!this.apiSecret;
  }

  /**
   * Send an event to Google Analytics
   */
  public async sendEvent(eventName: string, parameters: Record<string, string | number | boolean> = {}): Promise<void> {
    if (!this.isConfigured()) {
      console.warn('Google Analytics not configured. Skipping event:', eventName);
      return;
    }

    try {
      const payload = {
        client_id: this.clientId,
        events: [{
          name: eventName,
          params: {
            session_id: this.sessionId,
            engagement_time_msec: '100',
            ...parameters
          }
        }]
      };

      const response = await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        console.warn('GA event failed:', response.status, response.statusText);
      } else {
        console.log('GA event sent:', eventName, parameters);
      }
    } catch (error) {
      console.warn('Failed to send GA event:', error);
    }
  }

  /**
   * Track widget addition
   */
  public async trackWidgetAddition(widgetType: string, widgetName: string): Promise<void> {
    await this.sendEvent('widget_added', {
      widget_type: widgetType,
      widget_name: widgetName,
      custom_parameter_1: 'extension_usage'
    });
  }

  /**
   * Track extension installation
   */
  public async trackExtensionInstall(version: string): Promise<void> {
    await this.sendEvent('extension_install', {
      extension_version: version,
      install_timestamp: Date.now().toString()
    });
  }

  /**
   * Track extension update
   */
  public async trackExtensionUpdate(fromVersion: string, toVersion: string): Promise<void> {
    await this.sendEvent('extension_update', {
      previous_version: fromVersion,
      new_version: toVersion,
      update_timestamp: Date.now().toString()
    });
  }

  /**
   * Track general extension usage
   */
  public async trackUsage(action: string, details?: Record<string, string | number | boolean>): Promise<void> {
    await this.sendEvent('extension_usage', {
      action: action,
      ...details
    });
  }

  /**
   * Generate a unique client ID for this extension instance
   */
  private generateClientId(): string {
    // Use chrome.storage to persist client ID across sessions
    const stored = localStorage.getItem('ga_client_id');
    if (stored) {
      return stored;
    }

    const clientId = Date.now().toString() + Math.random().toString(36).substring(2);
    localStorage.setItem('ga_client_id', clientId);
    return clientId;
  }

  /**
   * Generate a session ID
   */
  private generateSessionId(): string {
    return Date.now().toString();
  }
}

// Export singleton instance
export const googleAnalytics = GoogleAnalyticsService.getInstance();