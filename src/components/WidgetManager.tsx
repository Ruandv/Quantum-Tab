import React, { useState } from 'react';
import { DashboardWidget } from './Dashboard';
import LiveClock from './LiveClock';
import QuickActionButtons from './QuickActionButtons';

interface WidgetType {
    id: string;
    name: string;
    description: string;
    component: React.ComponentType<any>;
    defaultDimensions: { width: number; height: number };
    defaultProps?: any;
}

interface WidgetManagerProps {
    onAddWidget: (widget: DashboardWidget) => void;
    onRemoveWidget: (widgetId: string) => void;
    existingWidgets: DashboardWidget[];
}

// Available widget types
const AVAILABLE_WIDGETS: WidgetType[] = [
    {
        id: 'live-clock',
        name: 'Live Clock',
        description: 'Real-time clock with date and greeting',
        component: LiveClock,
        defaultDimensions: { width: 400, height: 150 },
        defaultProps: {
            timeZone: 'Africa/Nairobi',
            dateFormat: 'yyyy-MM-dd',
            timeFormat: 'hh:mm a'
        },
    },
    {
        id: 'quick-actions',
        name: 'Quick Actions',
        description: 'Quick access buttons to favorite sites',
        component: QuickActionButtons,
        defaultDimensions: { width: 350, height: 200 },
    },
];

const WidgetManager: React.FC<WidgetManagerProps> = ({
    onAddWidget,
    onRemoveWidget,
    existingWidgets
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWidgetType, setSelectedWidgetType] = useState<WidgetType | null>(null);
    const [widgetDimensions, setWidgetDimensions] = useState({ width: 300, height: 200 });
    const [widgetPosition, setWidgetPosition] = useState({ x: 50, y: 50 });

    const handleAddWidget = () => {
        if (!selectedWidgetType) return;

        const newWidget: DashboardWidget = {
            id: `${selectedWidgetType.id}-${Date.now()}`, // Unique ID
            component: selectedWidgetType.component,
            dimensions: widgetDimensions,
            position: widgetPosition,
            props: selectedWidgetType.defaultProps || {},
        };

        onAddWidget(newWidget);
        setIsModalOpen(false);
        setSelectedWidgetType(null);
    };

    const handleRemoveWidget = (widgetId: string) => {
        onRemoveWidget(widgetId);
    };

    return (
        <>
            {/* Add Widget Button */}
            <button
                className="add-widget-btn"
                onClick={() => setIsModalOpen(true)}
                title="Add Widget"
            >
                <span className="btn-icon">➕</span>
                Add Widget
            </button>

            {/* Widget Management Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Widget</h2>
                            <button
                                className="modal-close"
                                onClick={() => setIsModalOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Widget Type Selection */}
                            <div className="form-section">
                                <h3>Choose Widget Type</h3>
                                <div className="widget-types">
                                    {AVAILABLE_WIDGETS.map((widgetType) => (
                                        <div
                                            key={widgetType.id}
                                            className={`widget-type-card ${selectedWidgetType?.id === widgetType.id ? 'selected' : ''}`}
                                            onClick={() => {
                                                setSelectedWidgetType(widgetType);
                                                setWidgetDimensions(widgetType.defaultDimensions);
                                            }}
                                        >
                                            <h4>{widgetType.name}</h4>
                                            <p>{widgetType.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Widget Configuration */}
                            {selectedWidgetType && (
                                <>
                                    <div className="form-section">
                                        <h3>Widget Dimensions</h3>
                                        <div className="dimension-options">
                                            <div className="dimension-field">
                                                <label className="dimension-label">
                                                    Width
                                                </label>
                                                <div className="input-with-unit">
                                                    <input
                                                        type="number"
                                                        value={widgetDimensions.width}
                                                        min="150"
                                                        max="800"
                                                        placeholder="400"
                                                        onChange={(e) => setWidgetDimensions({
                                                            ...widgetDimensions,
                                                            width: parseInt(e.target.value) || 300
                                                        })}
                                                    />
                                                    <span className="input-unit">px</span>
                                                </div>
                                            </div>
                                            <div className="dimension-field">
                                                <label className="dimension-label">
                                                    Height
                                                </label>
                                                <div className="input-with-unit">
                                                    <input
                                                        type="number"
                                                        value={widgetDimensions.height}
                                                        min="100"
                                                        max="600"
                                                        placeholder="200"
                                                        onChange={(e) => setWidgetDimensions({
                                                            ...widgetDimensions,
                                                            height: parseInt(e.target.value) || 200
                                                        })}
                                                    />
                                                    <span className="input-unit">px</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-section">
                                        <h3>Initial Position</h3>
                                        <div className="position-options">
                                            <div className="position-field">
                                                <label className="position-label">
                                                    X Position
                                                </label>
                                                <div className="input-with-unit">
                                                    <input
                                                        type="number"
                                                        value={widgetPosition.x}
                                                        min="0"
                                                        placeholder="50"
                                                        onChange={(e) => setWidgetPosition({
                                                            ...widgetPosition,
                                                            x: parseInt(e.target.value) || 0
                                                        })}
                                                    />
                                                    <span className="input-unit">px</span>
                                                </div>
                                            </div>
                                            <div className="position-field">
                                                <label className="position-label">
                                                    Y Position
                                                </label>
                                                <div className="input-with-unit">
                                                    <input
                                                        type="number"
                                                        value={widgetPosition.y}
                                                        min="0"
                                                        placeholder="50"
                                                        onChange={(e) => setWidgetPosition({
                                                            ...widgetPosition,
                                                            y: parseInt(e.target.value) || 0
                                                        })}
                                                    />
                                                    <span className="input-unit">px</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedWidgetType.defaultProps && (
                                        <div className='form-section additional-properties'>
                                            <h3>Additional Properties</h3>
                                            <div className="properties-grid">
                                                {Object.entries(selectedWidgetType.defaultProps).map(([key, value]) => (
                                                    <div key={key} className="property-field">
                                                        <label className="property-label">
                                                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={String(value)}
                                                            placeholder={`Enter ${key.toLowerCase()}`}
                                                            onChange={(e) => setSelectedWidgetType({
                                                                ...selectedWidgetType,
                                                                defaultProps: {
                                                                    ...selectedWidgetType.defaultProps,
                                                                    [key]: e.target.value
                                                                }
                                                            })}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>)}
                                </>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-secondary"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleAddWidget}
                                disabled={!selectedWidgetType}
                            >
                                Add Widget
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Existing Widgets List */}
            {existingWidgets.length > 0 && (

                <div className="widgets-list">
                    {existingWidgets.map((widget) => (
                        <div key={widget.id} className="widget-item">
                            <span className="widget-name">
                                {AVAILABLE_WIDGETS.find(w => widget.id.startsWith(w.id))?.name || 'Unknown Widget'}
                            </span>
                            <button
                                className="remove-widget-btn"
                                onClick={() => handleRemoveWidget(widget.id)}
                                title="Remove Widget"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export default WidgetManager;