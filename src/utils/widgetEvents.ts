/**
 * Widget Event System
 * 
 * Provides a centralized event system for widgets to handle cleanup operations
 * when they are removed from the dashboard.
 */

export interface WidgetEvent {
  type: string;
  widgetId: string;
  data?: any;
}

export type WidgetEventListener = (event: WidgetEvent) => void;

class WidgetEventManager {
  private listeners: Map<string, WidgetEventListener[]> = new Map();

  /**
   * Add an event listener for a specific event type
   */
  addEventListener(eventType: string, listener: WidgetEventListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(listener);
  }

  /**
   * Remove an event listener
   */
  removeEventListener(eventType: string, listener: WidgetEventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Dispatch an event to all registered listeners
   */
  dispatchEvent(event: WidgetEvent): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in widget event listener for ${event.type}:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for a specific event type
   */
  removeAllListeners(eventType: string): void {
    this.listeners.delete(eventType);
  }

  /**
   * Clear all event listeners
   */
  clear(): void {
    this.listeners.clear();
  }
}

// Export singleton instance
export const widgetEventManager = new WidgetEventManager();

// Common event types
export const WIDGET_EVENTS = {
  REMOVE_WIDGET: 'RemoveWidget',
  WIDGET_ADDED: 'WidgetAdded',
  WIDGET_UPDATED: 'WidgetUpdated'
} as const;

/**
 * Convenience function to dispatch a widget removal event
 */
export const dispatchWidgetRemoval = (widgetId: string, data?: any): void => {
  widgetEventManager.dispatchEvent({
    type: WIDGET_EVENTS.REMOVE_WIDGET,
    widgetId,
    data
  });
};

/**
 * Convenience function to add a removal listener for a specific widget
 */
export const addWidgetRemovalListener = (
  widgetId: string, 
  cleanup: () => void | Promise<void>
): (() => void) => {
  const listener: WidgetEventListener = async (event) => {
    if (event.widgetId === widgetId) {
      try {
        await cleanup();
        console.log(`Cleanup completed for widget: ${widgetId}`);
      } catch (error) {
        console.error(`Cleanup failed for widget ${widgetId}:`, error);
      }
    }
  };

  widgetEventManager.addEventListener(WIDGET_EVENTS.REMOVE_WIDGET, listener);
  
  // Return cleanup function to remove the listener
  return () => {
    widgetEventManager.removeEventListener(WIDGET_EVENTS.REMOVE_WIDGET, listener);
  };
};