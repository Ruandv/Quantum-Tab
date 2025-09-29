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
        console.log('Component map created with keys:', Object.keys(map));
        return map;
    }, []);

    // Initialize widgets with default configuration
    const getInitialWidgets = useCallback((): DashboardWidget[] => {
        try {
            const viewport = getViewportDimensions();

            const clockWidget: DashboardWidget = {
                id: 'clock-widget-1',
                allowMultiples: true,
                position: { x: Math.max(50, viewport.width - 350), y: 50 },
                dimensions: { width: 300, height: 200 },
                component: componentMap['LiveClock'] || (() => null),
                props: { className: 'default-clock' }
            };

            const backgroundManagerWidget: DashboardWidget = {
                id: 'background-manager-1',
                allowMultiples: false,
                position: { x: 50, y: Math.max(50, viewport.height - 250) },
                dimensions: { width: 300, height: 200 },
                component: componentMap['background-manager'] || (() => null),
                props: { className: 'default-background-manager' }
            };

            const quickActionWidget: DashboardWidget = {
                id: 'quick-action-1',
                allowMultiples: true,
                position: {
                    x: Math.max(50, viewport.width - 350), y: Math.max(270, viewport.height - 250)
                },
                dimensions: { width: 300, height: 200 },
                component: componentMap['quick-actions'] || (() => null),
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
            console.log('Starting widget initialization...');

            // Quick check if chrome.storage is available
            if (!chrome?.storage?.local) {
                console.warn('Chrome storage not available, using default widgets');
                setWidgets(getInitialWidgets());
                setIsLoading(false);
                return;
            }

            try {
                console.log('Loading data from Chrome storage...');
                const savedData = await chromeStorage.loadAll();
                console.log('Loaded saved data:', savedData);

                // Set background and lock state
                setBackgroundImage(savedData.backgroundImage || '');
                setIsLocked(savedData.isLocked || false);

                // Handle widgets - force fresh start if data looks corrupted
                if (!savedData?.widgets?.length || savedData.widgets.some(w => !w.component)) {
                    console.log('No valid saved widgets found, using initial widgets');
                    setWidgets(getInitialWidgets());
                    setIsLoading(false);
                    return;
                }

                // Restore component references with error handling
                console.log('Available component map keys:', Object.keys(componentMap));
                const restoredWidgets = savedData.widgets.map(widget => {
                    try {
                        console.log(`Restoring widget ${widget.id} with component:`, widget.component);
                        // Default to LiveClock if component info is missing
                        let componentName = 'LiveClock';
                        let widgetTypeId = '';

                        // Try to extract widget type ID from saved data
                        const comp = widget.component as any;
                        console.log(`Restoring widget ${widget.id}, saved component:`, comp);

                        if (typeof comp === 'string') {
                            // If it's a string, it might be the widget type ID
                            widgetTypeId = comp;
                            console.log(`Widget ${widget.id}: Using string component as widgetTypeId: ${widgetTypeId}`);
                        } else if (comp?.widgetTypeId) {
                            // If we stored the widget type ID
                            widgetTypeId = comp.widgetTypeId;
                            console.log(`Widget ${widget.id}: Found widgetTypeId in component: ${widgetTypeId}`);
                        } else if (comp?.name && typeof comp.name === 'string') {
                            // Fallback: try to match by component function name
                            componentName = comp.name;
                            console.log(`Widget ${widget.id}: Using component name: ${componentName}`);
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

                // Validate restored widgets before setting
                const validWidgets = restoredWidgets.filter(w => w.component && typeof w.component === 'function');

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
                console.log('Widget initialization complete, stopping loading spinner');
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
            console.log('Extension reset successfully');
        } catch (error) {
            console.error('Failed to reset extension:', error);
        }
    }, [getInitialWidgets]);

    // Add keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.shiftKey && event.key === 'R') {
                event.preventDefault();
                console.log('Manual reset triggered');
                handleReset();
            } else if (event.ctrlKey && event.shiftKey && event.key === 'L') {
                event.preventDefault();
                console.log('Manual loading stop triggered');
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
                const serializedWidgets: SerializedWidget[] = widgets.map(widget => {
                    // Find the widget type ID for this component
                    const componentName = widget.component.name || widget.component.displayName || 'unknown';
                    console.log(`Saving widget ${widget.id}, component name: ${componentName}`);
                    
                    const widgetType = widgetRegistry.findByComponentName(componentName);
                    const serializedComponent = widgetType?.id || componentName || 'LiveClock';
                    
                    console.log(`Widget ${widget.id}: Found widgetType:`, widgetType?.name, 'Serializing as:', serializedComponent);
                    
                    return {
                        id: widget.id,
                        allowMultiples: widgetType?.allowMultiples || false,
                        component: serializedComponent,
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
            className="newtab-container"
            style={{
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                minHeight: '100vh',
                position: 'relative'
            }}
        >
            <div className="newtab-content">
                <header className="newtab-header">
                    <div className="header-actions">
                        <button
                            className={`lock-toggle ${isLocked ? 'locked' : ''}`}
                            onClick={handleToggleLock}
                            title={isLocked ? 'Unlock Dashboard' : 'Lock Dashboard'}
                        >
                            <span className="btn-icon">{isLocked ? '🔒' : '🔓'}</span>
                            {isLocked ? 'Unlock' : 'Lock'}
                        </button>
                        <WidgetManager
                            onAddWidget={handleAddWidget}
                            onRemoveWidget={handleRemoveWidget}
                            existingWidgets={widgets}
                            onBackgroundChange={handleBackgroundChange}
                            isLocked={isLocked}
                        />
                    </div>
                </header>

                <main className="newtab-main">
                    <div className="main-dashboard">
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
                    </div>
                </main>
            </div>
        </div>
    );
};

export default NewTab;