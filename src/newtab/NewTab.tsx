import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Dashboard from '../components/Dashboard/dashboard';
import WidgetManager from '../components/WidgetManager/widgetManager';
import UpdateNotification from '../components/UpdateNotification/updateNotification';
import { DashboardWidget, Position, Dimensions } from '../types/common';
import chromeStorage, { SerializedWidget } from '../utils/chromeStorage';
import { widgetRegistry } from '../utils/widgetRegistry';
import { debounce } from '../utils/helpers';
import { dispatchWidgetRemoval } from '../utils/widgetEvents';
import { defaultDimensions, defaultPosition, defaultStyle } from '@/types/defaults';
import NotificationManager from '@/utils/notificationManager';
import { upgradeWidgets } from '../utils/widgetUpgrade';
import GitHubIssues from '@/components/GitHubIssues/gitHubIssues';
import styles from './newTab.module.css';

// Stable fallback component to avoid creating new function instances
const EmptyWidget: React.FC<any> = () => null;

const NewTab: React.FC = () => {
  const { t } = useTranslation();

  // Component mapping for deserialization
  const componentMap = useMemo(() => widgetRegistry.createComponentMap(), []);

  // Initialize widgets with default configuration
  const getInitialWidgets = useCallback((): DashboardWidget[] => {
    try {
      // Create a stable fallback component reference
      const ClockComponent = componentMap['live-clock'];
      if (!ClockComponent) {
        console.error('Live clock component not found in component map');
        return [];
      }

      const clockWidget: DashboardWidget = {
        id: 'live-clock-1',
        name: 'Live Clock',
        wikiPage: 'liveclock',
        description: 'Real-time clock with customizable timezone and format',
        allowMultiples: true,
        isRuntimeVisible: true,
        position: defaultPosition,
        dimensions: defaultDimensions,
        component: ClockComponent,
        props: { className: 'default-clock' },
        style: defaultStyle,
      };

      return [clockWidget];
    } catch (error) {
      console.error('Error creating initial widgets:', error);
      return [];
    }
  }, [componentMap]);

  // State management
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [backgroundSize, setBackgroundSize] = useState<'cover' | 'contain' | 'auto'>('cover');
  const [isLoading, setIsLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  // Load data from Chrome storage on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      // Quick check if chrome.storage is available
      if (!chrome?.storage?.local) {
        console.warn('Chrome storage not available, using default widgets');
        setWidgets(getInitialWidgets());
        setIsLoading(false);
        return;
      }

      try {
        const savedData = await chromeStorage.loadAll();
        // Set background and lock state
        setBackgroundImage(savedData.backgroundImage || '');
        setIsLocked(savedData.isLocked || false);

        // Check for pending notifications
        chrome.storage.sync.get(['showWelcomeNotification', 'showUpdateNotification'], (result) => {
          if (result.showWelcomeNotification || result.showUpdateNotification) {
            setShowNotification(true);
          }
        });

        // Make NotificationManager available globally for testing
        (window as any).NotificationManager = NotificationManager;

        // Check for and perform widget upgrades if needed
        const upgradeResult = await upgradeWidgets(savedData.widgets);
        if (upgradeResult.upgraded) {
          console.log('Widget upgrade performed:', upgradeResult.changes);
          // Save the upgraded widgets back to storage
          await chromeStorage.saveWidgets(upgradeResult.widgets);
          // Update savedData with upgraded widgets
          savedData.widgets = upgradeResult.widgets;
        }

        // Handle widgets - force fresh start if data looks corrupted
        if (!savedData?.widgets?.length || savedData.widgets.some((w) => !w.component)) {
          setWidgets(getInitialWidgets());
          setIsLoading(false);
          return;
        }

        // Restore component references with error handling
        const restoredWidgets = savedData.widgets.map((widget) => {
          try {
            // Default to LiveClock if component info is missing
            let componentName = 'LiveClock';
            let widgetTypeId = '';

            // Try to extract widget type ID from saved data
            const comp = widget.component as any;

            if (typeof comp === 'string') {
              // If it's a string, it might be the widget type ID
              widgetTypeId = comp;
            } else if (comp?.widgetTypeId) {
              // If we stored the widget type ID
              widgetTypeId = comp.widgetTypeId;
            } else if (comp?.name && typeof comp.name === 'string') {
              // Fallback: try to match by component function name
              componentName = comp.name;
            }

            // If we have a widget type ID, get the component from registry
            if (widgetTypeId) {
              try {
                const widgetType = widgetRegistry.get(widgetTypeId);
                if (widgetType && widgetType.component) {
                  componentName =
                    widgetType.component.name || widgetType.component.displayName || widgetTypeId;
                } else {
                  console.warn(
                    `Widget type ${widgetTypeId} not found in registry for widget ${widget.id}`
                  );
                  // Try to use the widget type ID directly as component name
                  componentName = widgetTypeId;
                }
              } catch (regError) {
                console.warn('Error accessing widget registry:', regError);
              }
            }

            // Try multiple lookup strategies
            let restoredComponent = componentMap[componentName];

            // If not found by component name, try by widget type ID
            if (!restoredComponent && widgetTypeId) {
              restoredComponent = componentMap[widgetTypeId];
              if (restoredComponent) {
                componentName = widgetTypeId;
              }
            }

            // If still not found, try original component name from saved data
            if (!restoredComponent && comp?.name) {
              restoredComponent = componentMap[comp.name];
              if (restoredComponent) {
                componentName = comp.name;
              }
            }

            // Special case: if widget ID contains 'background-manager', force lookup
            if (!restoredComponent && widget.id.includes('background-manager')) {
              restoredComponent = componentMap['background-manager'];
              if (restoredComponent) {
                componentName = 'background-manager';
              }
            }

            if (!restoredComponent) {
              console.warn(
                `Failed to restore component for widget ${widget.id}, falling back to EmptyWidget`
              );
              restoredComponent = EmptyWidget;
              componentName = 'EmptyWidget';
            }

            // Try to get widget info from registry for better metadata
            const widgetType =
              widgetRegistry.get(componentName) || widgetRegistry.get(widgetTypeId);

            const restoredWidget: DashboardWidget = {
              ...widget,
              wikiPage: widgetType?.wikiPage || widget.wikiPage || 'Unknown Wiki Page',
              component: restoredComponent,
              style: widget.style || defaultStyle,
              name: widget.name || 'Unknown Widget',
              description: widget.description || 'Widget description not available',
            };
            return restoredWidget;
          } catch (widgetError) {
            console.error(`Error restoring widget ${widget.id}:`, widgetError);
            // Return widget with LiveClock as fallback and default style
            const fallbackWidget: DashboardWidget = {
              ...widget,
              wikiPage: 'liveclock',
              component: componentMap['LiveClock'],
              style: widget.style || defaultStyle,
              name: widget.name || 'Live Clock',
              description:
                widget.description || 'Real-time clock with customizable timezone and format',
            };
            return fallbackWidget;
          }
        });

        // Validate restored widgets before setting
        const validWidgets = restoredWidgets.filter(
          (w) => w.component && typeof w.component === 'function'
        );

        if (validWidgets.length === 0) {
          console.warn('No valid restored widgets, falling back to initial widgets');
          setWidgets(getInitialWidgets());
        } else {
          setWidgets(validWidgets);
        }
      } catch (error) {
        console.error('Critical error during widget initialization:', error);
        // Clear corrupted storage and use initial widgets
        try {
          await chromeStorage.clearAll();
        } catch (clearError) {
          console.error('Failed to clear storage:', clearError);
        }
        setWidgets(getInitialWidgets());
      } finally {
        setIsLoading(false);
      }
    };

    // Add timeout safeguard
    const timeoutId = setTimeout(() => {
      console.warn('Loading timeout - forcing initialization with default widgets');
      setWidgets(getInitialWidgets());
      setIsLoading(false);
    }, 5000); // 5 second timeout

    loadInitialData().finally(() => {
      clearTimeout(timeoutId);
    });
  }, [getInitialWidgets, componentMap]);

  // Debug function to reset everything
  const handleReset = useCallback(async () => {
    try {
      await chromeStorage.clearAll();
      setWidgets(getInitialWidgets());
      setBackgroundImage('');
      setIsLocked(false);
    } catch (error) {
      console.error('Failed to reset extension:', error);
    }
  }, [getInitialWidgets]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        handleReset();
      } else if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        event.preventDefault();
        setIsLoading(false);
        if (widgets.length === 0) {
          setWidgets(getInitialWidgets());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset, widgets.length, getInitialWidgets]);

  // Optimized save function with debouncing
  const saveToStorage = useCallback(
    debounce(async () => {
      try {
        const serializedWidgets: SerializedWidget[] = widgets.map((widget: DashboardWidget) => {
          // Find the widget type ID for this component
          const componentName = widget.component.name || widget.component.displayName || 'unknown';

          const widgetType = widgetRegistry.findByComponentName(componentName);
          const serializedComponent = widgetType?.id || componentName || 'LiveClock';

          return {
            id: widget.id,
            name: widget.name,
            description: widget.description,
            isRuntimeVisible: widget.isRuntimeVisible ?? widgetType?.isRuntimeVisible ?? true,
            wikiPage: widget.wikiPage || widget.name.toLowerCase().replace(/\s+/g, ''),
            allowMultiples: widgetType?.allowMultiples || false,
            component: serializedComponent,
            props: widget.props,
            dimensions: widget.dimensions,
            position: widget.position,
            style: widget.style,
            metaData: widget.metaData,
          };
        });
        const version = await chromeStorage.getVersion();
        const success = await chromeStorage.saveAll({
          widgets: serializedWidgets,
          backgroundImage,
          isLocked,
          version,
          timestamp: Date.now(),
        });

        if (!success) {
          console.error('Failed to save dashboard data to Chrome storage');
        }
      } catch (error) {
        console.error('Error saving to Chrome storage:', error);
      }
    }, 1000),
    [widgets, backgroundImage, isLocked]
  );

  // Auto-save when state changes
  useEffect(() => {
    if (!isLoading) {
      saveToStorage();
      // get background widget
      const bg = widgets.find((x) => x.id.toLowerCase().startsWith('background-manager'));
      if (bg) {
        setBackgroundSize(bg.props.backgroundSize as any);
      }
    }
  }, [widgets, backgroundImage, isLocked, saveToStorage, isLoading]);

  // Widget management functions
  const handleAddWidget = useCallback((widget: DashboardWidget) => {
    setWidgets((prev) => {
      // Add the new widget, then filter to keep only the last occurrence for each id
      const updated = [...prev, widget];
      const uniqueById = updated.reduceRight<DashboardWidget[]>((acc, curr) => {
        if (!acc.some((w) => w.id === curr.id)) {
          acc.unshift(curr);
        }
        return acc;
      }, []);
      return uniqueById;
    });
  }, []);

  const handleRemoveWidget = useCallback(async (widgetId: string) => {
    // Dispatch the RemoveWidget event before removing the widget
    dispatchWidgetRemoval(widgetId);
    // Remove the widget from state
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
  }, []);

  const handleWidgetResize = useCallback((id: string, dimensions: Dimensions) => {
    setWidgets((prev) =>
      prev.map((widget) => (widget.id === id ? { ...widget, dimensions } : widget))
    );
  }, []);

  const handleWidgetMove = useCallback((id: string, position: Position) => {
    setWidgets((prev) =>
      prev.map((widget) => (widget.id === id ? { ...widget, position } : widget))
    );
  }, []);

  const handleBackgroundChange = useCallback((newBackground: string) => {
    setBackgroundImage(newBackground);
  }, []);

  const handleToggleLock = useCallback(() => {
    setIsLocked((prev) => !prev);
  }, []);

  return isLoading ? (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.2rem',
      }}
    >
      {t('common.loading.dashboard')}
    </div>
  ) : (
    <div
      className={styles.newtabContainer}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundSize: backgroundSize,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      <div className={styles.newtabContent}>
        <header className={styles.newtabHeader}>
          <div className={styles.headerActions}>
            <button
              className={`${styles.lockToggle} ${isLocked ? styles.locked : ''}`}
              onClick={handleToggleLock}
              title={isLocked ? 'Unlock Dashboard' : 'Lock Dashboard'}
            >
              <span className={styles.btnIcon}>{isLocked ? '🔒' : '🔓'}</span>
              {isLocked ? 'Unlock' : 'Lock'}
            </button>
            <WidgetManager
              onAddWidget={handleAddWidget}
              existingWidgets={widgets}
              onBackgroundChange={handleBackgroundChange}
              isLocked={isLocked}
            />
          </div>
        </header>

        <main className={styles.newtabMain}>
          <div className={styles.mainDashboard}>
            <Dashboard
              widgets={widgets}
              onRemoveWidget={handleRemoveWidget}
              onWidgetResize={handleWidgetResize}
              onWidgetMove={handleWidgetMove}
              isLocked={isLocked}
              onBackgroundChange={handleBackgroundChange}
              onUpdateWidgetProps={(widgetId: string, newProps: any) => {
                setWidgets((prev) =>
                  prev.map((w) =>
                    w.id === widgetId ? { ...w, props: { ...w.props, ...newProps } } : w
                  )
                );
              }}
            />
          </div>
        </main>
      </div>
      {/* Update/Welcome Notification */}
      {showNotification && <UpdateNotification onDismiss={() => setShowNotification(false)} />}
      <GitHubIssues isLocked={isLocked} />
    </div>
  );
};

export default NewTab;
