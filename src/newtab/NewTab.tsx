import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Dashboard from '../components/Dashboard';
import WidgetManager from '../components/WidgetManager';
import { DashboardWidget, Position, Dimensions } from '../types/common';
import { storageManager } from '../utils/storageManager';
import { widgetRegistry } from '../utils/widgetRegistry';
import { debounce, getViewportDimensions } from '../utils/helpers';

const NewTab: React.FC = () => {
    // Component mapping for deserialization
    const componentMap = useMemo(() => {
        const map = widgetRegistry.createComponentMap();
        return map;
    }, []);

    // Initialize widgets with default configuration
    const getInitialWidgets = useCallback((): DashboardWidget[] => {
        try {
            const viewport = getViewportDimensions();

            // Get components directly from widget registry
            const liveClockWidget = widgetRegistry.get('live-clock');
            const quickActionsWidget = widgetRegistry.get('quick-actions');
            const backgroundManagerWidget = widgetRegistry.get('background-manager');

            return [
                {
                    id: 'live-clock-initial',
                    component: liveClockWidget?.component || (() => null),
                    dimensions: { width: 400, height: 150 },
                    position: { x: Math.min(100, viewport.width * 0.1), y: 50 },
                    props: { timeZone: 'Africa/Nairobi', 
                        dateFormat: 'yyyy-MM-dd', 
                        timeFormat: 'hh:mm a' }
                },
                {
                    id: 'quick-actions-initial',
                    component: quickActionsWidget?.component || (() => null),
                    dimensions: { width: 350, height: 200 },
                    position: { x: Math.min(100, viewport.width * 0.1), y: 220 },
                    props: {}
                },
                {
                    id: 'background-manager-initial',
                    component: backgroundManagerWidget?.component || (() => null),
                    dimensions: { width: 320, height: 320 },
                    position: { x: Math.min(520, viewport.width * 0.6), y: 50 },
                    props: {}
                },
            ];
        } catch (error) {
            console.error('Error creating initial widgets:', error);
            return [];
        }
    }, []);

    // State management with improved initialization
    const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
        try {
            if (!storageManager.isStorageAvailable()) {
                console.log('Storage not available, using initial widgets');
                return getInitialWidgets();
            }

            const savedData = storageManager.loadAll();
            if (!savedData?.widgets?.length) {
                return getInitialWidgets();
            }

            // Restore component references with error handling
            const restoredWidgets = savedData.widgets.map(widget => {
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
                                componentName = widgetType.component.name || widgetType.component.displayName || widgetTypeId;
                            } else {
                                console.warn(`Widget type ${widgetTypeId} not found in registry for widget ${widget.id}`);
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
                        console.warn(`All lookup strategies failed for widget ${widget.id}, using LiveClock fallback`);
                        console.warn(`Available component map keys:`, Object.keys(componentMap));
                    }

                    return {
                        ...widget,
                        component: restoredComponent || componentMap.LiveClock || (() => null)
                    };
                } catch (widgetError) {
                    console.error('Error restoring widget:', widget.id, widgetError);
                    // Return a safe fallback widget
                    return {
                        ...widget,
                        component: componentMap.LiveClock || (() => null)
                    };
                }
            });

            return restoredWidgets;
        } catch (error) {
            console.error('Critical error during widget initialization:', error);
            // Return initial widgets as ultimate fallback
            return getInitialWidgets();
        }
    });

    const [isLocked, setIsLocked] = useState<boolean>(() => {
        const savedData = storageManager.loadAll();
        return savedData?.isLocked ?? false;
    });

    const [backgroundImage, setBackgroundImage] = useState<string>(() => {
        const savedData = storageManager.loadAll();
        return savedData?.backgroundImage ?? '';
    });

    // Optimized save function with debouncing
    const saveToStorage = useCallback(
        debounce(() => {
            if (!storageManager.isStorageAvailable()) return;

            const success = storageManager.saveAll({
                widgets: widgets.map(widget => {
                    // Find the widget type ID for this component
                    const widgetType = widgetRegistry.findByComponentName(widget.component.name);
                    return {
                        ...widget,
                        component: {
                            name: widget.component.name,
                            widgetTypeId: widgetType?.id || 'live-clock'
                        } as any
                    };
                }),
                backgroundImage,
                isLocked,
                timestamp: Date.now()
            });

            if (!success) {
                console.warn('Failed to save data to storage');
            }
        }, 500),
        [widgets, backgroundImage, isLocked]
    );

    // Debounced save function specifically for widget position/resize changes
    const debouncedSaveWidgetPositions = useCallback(
        debounce(() => {
            if (!storageManager.isStorageAvailable()) return;

            const success = storageManager.saveAll({
                widgets: widgets.map(widget => {
                    // Find the widget type ID for this component
                    const widgetType = widgetRegistry.findByComponentName(widget.component.name);
                    return {
                        ...widget,
                        component: {
                            name: widget.component.name,
                            widgetTypeId: widgetType?.id || 'live-clock'
                        } as any
                    };
                }),
                backgroundImage,
                isLocked,
                timestamp: Date.now()
            });

            if (!success) {
                console.warn('Failed to save widget positions to storage');
            }
        }, 1000), // Longer debounce for position changes (1 second)
        [widgets, backgroundImage, isLocked]
    );

    const handleBackgroundChange = useCallback((imageUrl: string) => {
        setBackgroundImage(imageUrl);
    }, []);

    // Widget manipulation handlers
    const handleAddWidget = useCallback((newWidget: DashboardWidget) => {
        setWidgets(prev => [...prev, newWidget]);
        // Save immediately when adding widgets (no debounce needed)
        saveToStorage();
    }, [saveToStorage]);

    const handleRemoveWidget = useCallback((widgetId: string) => {
        setWidgets(prev => prev.filter(widget => widget.id !== widgetId));
        // Save immediately when removing widgets (no debounce needed)
        saveToStorage();
    }, [saveToStorage]);

    const handleWidgetResize = useCallback((widgetId: string, dimensions: Dimensions) => {
        setWidgets(prev =>
            prev.map(widget =>
                widget.id === widgetId ? { ...widget, dimensions } : widget
            )
        );
        // Trigger debounced save specifically for resize changes
        debouncedSaveWidgetPositions();
    }, [debouncedSaveWidgetPositions]);

    const handleWidgetMove = useCallback((widgetId: string, position: Position) => {
        setWidgets(prev =>
            prev.map(widget =>
                widget.id === widgetId ? { ...widget, position } : widget
            )
        );
        // Trigger debounced save specifically for position changes
        debouncedSaveWidgetPositions();
    }, [debouncedSaveWidgetPositions]);

    const toggleLock = useCallback(() => {
        setIsLocked(prev => !prev);
    }, []);

    // Auto-save on background and lock state changes (not widget changes)
    useEffect(() => {
        saveToStorage();
    }, [backgroundImage, isLocked]); // Only save on background/lock changes, not widget changes

    // Storage quota monitoring
    useEffect(() => {
        const checkStorageQuota = () => {
            const info = storageManager.getStorageInfo();
            if (info && info.totalSize > 4 * 1024 * 1024) { // 4MB warning
                console.warn('Storage usage is high:', info);
            }
        };

        const handleStorageEvent = (event: StorageEvent) => {
            if (event.key?.startsWith('quantum-tab-')) {
                // Handle external storage changes if needed
            }
        };

        window.addEventListener('storage', handleStorageEvent);
        checkStorageQuota();

        return () => window.removeEventListener('storage', handleStorageEvent);
    }, []);

    // Background style computation
    const backgroundStyle = useMemo(() => {
        if (!backgroundImage || backgroundImage === 'default') {
            return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
        }

        return {
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
        };
    }, [backgroundImage]);

    return (
        <div className="newtab-container" style={backgroundStyle}>
            <div className="newtab-content">
                <header className="newtab-header">
                    <div className="header-actions">
                        <button
                            className={`lock-toggle ${isLocked ? 'locked' : 'unlocked'}`}
                            onClick={toggleLock}
                            title={isLocked ? 'Unlock widgets for editing' : 'Lock widgets in place'}
                            type="button"
                        >
                            {isLocked ? '🔒' : '🔓'} {isLocked ? 'Locked' : 'Edit Mode'}
                        </button>
                        {!isLocked && <WidgetManager
                            onAddWidget={handleAddWidget}
                            onRemoveWidget={handleRemoveWidget}
                            existingWidgets={widgets}
                            onBackgroundChange={handleBackgroundChange}
                        />}
                    </div>

                </header>


                <main className="newtab-main">
                    <Dashboard
                        widgets={widgets}
                        className="main-dashboard"
                        isLocked={isLocked}
                        onRemoveWidget={handleRemoveWidget}
                        onWidgetResize={handleWidgetResize}
                        onWidgetMove={handleWidgetMove}
                        onBackgroundChange={handleBackgroundChange}
                    />
                </main>
            </div>
        </div>
    );
};

export default React.memo(NewTab);