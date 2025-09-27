import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Dashboard from '../components/Dashboard';
import WidgetManager from '../components/WidgetManager';
import { DashboardWidget, Position, Dimensions } from '../types/common';
import chromeStorage, { SerializedWidget } from '../utils/chromeStorage';
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
            
            const clockWidget: DashboardWidget = {
                id: 'clock-widget-1',
                position: { x: Math.max(50, viewport.width - 350), y: 50 },
                dimensions: { width: 300, height: 200 },
                component: componentMap['LiveClock'] || (() => null),
                props: { className: 'default-clock' }
            };

            const backgroundManagerWidget: DashboardWidget = {
                id: 'background-manager-1',
                position: { x: 50, y: Math.max(50, viewport.height - 250) },
                dimensions: { width: 300, height: 200 },
                component: componentMap['background-manager'] || (() => null),
                props: { className: 'default-background-manager' }
            };

            const quickActionWidget: DashboardWidget = {
                id: 'quick-action-1', 
                position: { x: Math.max(50, viewport.width - 350), y: Math.max(270, viewport.height - 250) },
                dimensions: { width: 300, height: 200 },
                component: componentMap['quick-action-buttons'] || (() => null),
                props: { className: 'default-quick-actions' }
            };

            return [clockWidget, backgroundManagerWidget, quickActionWidget];
        } catch (error) {
            console.error('Error creating initial widgets:', error);
            return [];
        }
    }, [componentMap]);

    // State management
    const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
    const [isLocked, setIsLocked] = useState<boolean>(false);
    const [backgroundImage, setBackgroundImage] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    // Load data from Chrome storage on component mount
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const savedData = await chromeStorage.loadAll();
                
                // Set background and lock state
                setBackgroundImage(savedData.backgroundImage || '');
                setIsLocked(savedData.isLocked || false);
                
                // Handle widgets
                if (!savedData?.widgets?.length) {
                    setWidgets(getInitialWidgets());
                    setIsLoading(false);
                    return;
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
                            console.warn(`Failed to restore component for widget ${widget.id}, falling back to LiveClock`);
                            restoredComponent = componentMap['LiveClock'];
                            componentName = 'LiveClock';
                        }

                        return {
                            ...widget,
                            component: restoredComponent
                        };
                    } catch (widgetError) {
                        console.error(`Error restoring widget ${widget.id}:`, widgetError);
                        // Return widget with LiveClock as fallback
                        return {
                            ...widget,
                            component: componentMap['LiveClock']
                        };
                    }
                });

                setWidgets(restoredWidgets);
            } catch (error) {
                console.error('Critical error during widget initialization:', error);
                // Use initial widgets as ultimate fallback
                setWidgets(getInitialWidgets());
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [getInitialWidgets, componentMap]);

    // Optimized save function with debouncing
    const saveToStorage = useCallback(
        debounce(async () => {
            try {
                const serializedWidgets: SerializedWidget[] = widgets.map(widget => {
                    // Find the widget type ID for this component
                    const widgetType = widgetRegistry.findByComponentName(widget.component.name);
                    return {
                        id: widget.id,
                        component: widgetType?.id || widget.component.name || 'LiveClock',
                        props: widget.props,
                        dimensions: widget.dimensions,
                        position: widget.position
                    };
                });

                const success = await chromeStorage.saveAll({
                    widgets: serializedWidgets,
                    backgroundImage,
                    isLocked,
                    timestamp: Date.now()
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
        }
    }, [widgets, backgroundImage, isLocked, saveToStorage, isLoading]);

    // Widget management functions
    const handleAddWidget = useCallback((widget: DashboardWidget) => {
        setWidgets(prev => [...prev, widget]);
    }, []);

    const handleRemoveWidget = useCallback((widgetId: string) => {
        setWidgets(prev => prev.filter(w => w.id !== widgetId));
    }, []);

    const handleUpdateWidget = useCallback((updatedWidget: DashboardWidget) => {
        setWidgets(prev => prev.map(w => w.id === updatedWidget.id ? updatedWidget : w));
    }, []);

    const handleWidgetResize = useCallback((id: string, dimensions: Dimensions) => {
        setWidgets(prev => prev.map(widget => 
            widget.id === id ? { ...widget, dimensions } : widget
        ));
    }, []);

    const handleWidgetMove = useCallback((id: string, position: Position) => {
        setWidgets(prev => prev.map(widget => 
            widget.id === id ? { ...widget, position } : widget
        ));
    }, []);

    const handleBackgroundChange = useCallback((newBackground: string) => {
        setBackgroundImage(newBackground);
    }, []);

    const handleToggleLock = useCallback(() => {
        setIsLocked(prev => !prev);
    }, []);

    // Export functionality for testing/debugging
    const handleExportData = useCallback(async () => {
        try {
            const storageInfo = await chromeStorage.getStorageInfo();
            const data = {
                widgets: widgets.map(widget => ({
                    ...widget,
                    component: widget.component.name || 'Unknown'
                })),
                backgroundImage,
                isLocked,
                timestamp: Date.now(),
                storageInfo
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quantum-tab-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        }
    }, [widgets, backgroundImage, isLocked]);

    // Show loading state
    if (isLoading) {
        return (
            <div style={{
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
                fontSize: '1.2rem'
            }}>
                Loading dashboard...
            </div>
        );
    }

    return (
        <div 
            className="new-tab-container"
            style={{
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                minHeight: '100vh',
                position: 'relative'
            }}
        >
            <Dashboard
                widgets={widgets}
                onRemoveWidget={handleRemoveWidget}
                onWidgetResize={handleWidgetResize}
                onWidgetMove={handleWidgetMove}
                isLocked={isLocked}
                onBackgroundChange={handleBackgroundChange}
                onUpdateWidgetProps={(widgetId: string, newProps: any) => {
                    setWidgets(prev => prev.map(w => 
                        w.id === widgetId ? { ...w, props: { ...w.props, ...newProps } } : w
                    ));
                }}
            />
            <WidgetManager
                onAddWidget={handleAddWidget}
                onRemoveWidget={handleRemoveWidget}
                existingWidgets={widgets}
                onBackgroundChange={handleBackgroundChange}
                isLocked={isLocked}
            />
        </div>
    );
};

export default NewTab;