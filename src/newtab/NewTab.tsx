import React, { useState } from 'react';
import Dashboard, { DashboardWidget } from '../components/Dashboard';
import LiveClock from '../components/LiveClock';
import QuickActionButtons from '../components/QuickActionButtons';
import WidgetManager from '../components/WidgetManager';

const NewTab: React.FC = () => {
    // Configure initial dashboard widgets
    const initialWidgets: DashboardWidget[] = [
        {
            id: 'live-clock-initial',
            component: LiveClock,
            dimensions: {
                width: 400,
                height: 150,
            },
            position: {
                x: 100,
                y: 50,
            },
            props: { timeZone: 'Africa/Nairobi' } // Set default timezone to Africa/Nairobi
        },
        {
            id: 'quick-actions-initial',
            component: QuickActionButtons,
            dimensions: {
                width: 350,
                height: 200,
            },
            position: {
                x: 100,
                y: 220,
            },
        },
    ];

    const [widgets, setWidgets] = useState<DashboardWidget[]>(initialWidgets);
    const [isLocked, setIsLocked] = useState<boolean>(false);

    const handleAddWidget = (newWidget: DashboardWidget) => {
        setWidgets(prevWidgets => [...prevWidgets, newWidget]);
    };

    const handleRemoveWidget = (widgetId: string) => {
        setWidgets(prevWidgets => prevWidgets.filter(widget => widget.id !== widgetId));
    };

    const handleWidgetReorder = (reorderedWidgets: DashboardWidget[]) => {
        setWidgets(reorderedWidgets);
    };

    const handleWidgetResize = (widgetId: string, dimensions: { width: number; height: number }) => {
        setWidgets(prevWidgets =>
            prevWidgets.map(widget =>
                widget.id === widgetId
                    ? { ...widget, dimensions }
                    : widget
            )
        );
    };

    const handleWidgetMove = (widgetId: string, position: { x: number; y: number }) => {
        setWidgets(prevWidgets =>
            prevWidgets.map(widget =>
                widget.id === widgetId
                    ? { ...widget, position }
                    : widget
            )
        );
    };

    const toggleLock = () => {
        setIsLocked(prev => !prev);
    };

    return (
        <div className="newtab-container">
            <div className="newtab-content">
                <header className="newtab-header">
                    <div className="header-actions">
                        <button
                            className={`lock-toggle ${isLocked ? 'locked' : 'unlocked'}`}
                            onClick={toggleLock}
                            title={isLocked ? 'Unlock widgets for editing' : 'Lock widgets in place'}
                        >
                            {isLocked ? '🔒' : '🔓'} {isLocked ? 'Locked' : 'Edit Mode'}
                        </button>
                        <WidgetManager
                            onAddWidget={handleAddWidget}
                            onRemoveWidget={handleRemoveWidget}
                            existingWidgets={widgets}
                        />
                    </div>
                </header>

                <main className="newtab-main">
                    <Dashboard
                        widgets={widgets}
                        className="main-dashboard"
                        isLocked={isLocked}
                        onWidgetReorder={handleWidgetReorder}
                        onRemoveWidget={handleRemoveWidget}
                        onWidgetResize={handleWidgetResize}
                        onWidgetMove={handleWidgetMove}
                    />
                </main>
            </div>
        </div>
    );
};

export default NewTab;