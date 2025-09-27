import React, { useState, useCallback, useMemo } from 'react';
import { DashboardWidget, WidgetManagerProps, WidgetType, Dimensions, Position } from '../types/common';
import { widgetRegistry } from '../utils/widgetRegistry';
import { generateUniqueId, findOptimalPosition, getViewportDimensions } from '../utils/helpers';

const WidgetManager: React.FC<WidgetManagerProps> = ({
    onAddWidget,
    onRemoveWidget,
    existingWidgets,
    onBackgroundChange
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWidgetType, setSelectedWidgetType] = useState<WidgetType | null>(null);
    const [widgetDimensions, setWidgetDimensions] = useState<Dimensions>({ width: 300, height: 200 });
    const [widgetPosition, setWidgetPosition] = useState<Position>({ x: 50, y: 50 });

    const availableWidgets = useMemo(() => widgetRegistry.getAvailable(), []);
    const containerBounds = useMemo(() => getViewportDimensions(), []);

    const resetModalState = useCallback(() => {
        setSelectedWidgetType(null);
        setWidgetDimensions({ width: 300, height: 200 });
        setWidgetPosition({ x: 50, y: 50 });
    }, []);

    const handleOpenModal = useCallback(() => {
        setIsModalOpen(true);
        resetModalState();
    }, [resetModalState]);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        resetModalState();
    }, [resetModalState]);

    const handleWidgetTypeSelect = useCallback((widgetType: WidgetType) => {
        setSelectedWidgetType(widgetType);
        setWidgetDimensions(widgetType.defaultDimensions);
        
        // Auto-calculate optimal position
        const optimalPosition = findOptimalPosition(
            widgetType.defaultDimensions,
            existingWidgets,
            containerBounds
        );
        setWidgetPosition(optimalPosition);
    }, [existingWidgets, containerBounds]);

    const handleAddWidget = useCallback(() => {
        if (!selectedWidgetType) return;
        let widgetProps = { ...(selectedWidgetType.defaultProps || {}) };
        
        // Add background change handler for BackgroundManager
        if (selectedWidgetType.id === 'background-manager' && onBackgroundChange) {
            widgetProps = {
                ...widgetProps,
                onBackgroundChange
            };
        }

        const newWidget: DashboardWidget = {
            id: generateUniqueId(selectedWidgetType.id),
            component: selectedWidgetType.component,
            dimensions: widgetDimensions,
            position: widgetPosition,
            props: widgetProps,
        };
        debugger;
        onAddWidget(newWidget);
        handleCloseModal();
    }, [selectedWidgetType, widgetDimensions, widgetPosition, onBackgroundChange, onAddWidget, handleCloseModal]);

    const handleDimensionChange = useCallback((dimension: 'width' | 'height', value: number) => {
        setWidgetDimensions(prev => ({ ...prev, [dimension]: value }));
    }, []);

    const handlePositionChange = useCallback((axis: 'x' | 'y', value: number) => {
        setWidgetPosition(prev => ({ ...prev, [axis]: value }));
    }, []);

    const handlePropertyChange = useCallback((key: string, value: string) => {
        if (!selectedWidgetType) return;
        
        setSelectedWidgetType(prev => prev ? {
            ...prev,
            defaultProps: {
                ...prev.defaultProps,
                [key]: value
            }
        } : null);
    }, [selectedWidgetType]);

    const getWidgetDisplayName = useCallback((widget: DashboardWidget): string => {
        const widgetType = availableWidgets.find(w => widget.id.startsWith(w.id));
        return widgetType?.name || 'Unknown Widget';
    }, [availableWidgets]);

    const renderWidgetTypeCard = useCallback((widgetType: WidgetType) => (
        <div
            key={widgetType.id}
            className={`widget-type-card ${selectedWidgetType?.id === widgetType.id ? 'selected' : ''}`}
            onClick={() => handleWidgetTypeSelect(widgetType)}
        >
            <h4>{widgetType.name}</h4>
            <p>{widgetType.description}</p>
        </div>
    ), [selectedWidgetType, handleWidgetTypeSelect]);

    const renderDimensionInput = useCallback((
        dimension: 'width' | 'height',
        value: number,
        min: number,
        max: number
    ) => (
        <div className="dimension-field">
            <label className="dimension-label">
                {dimension.charAt(0).toUpperCase() + dimension.slice(1)}
            </label>
            <div className="input-with-unit">
                <input
                    type="number"
                    value={value}
                    min={min}
                    max={max}
                    onChange={(e) => handleDimensionChange(dimension, parseInt(e.target.value) || value)}
                />
                <span className="input-unit">px</span>
            </div>
        </div>
    ), [handleDimensionChange]);

    const renderPositionInput = useCallback((
        axis: 'x' | 'y',
        value: number,
        label: string
    ) => (
        <div className="position-field">
            <label className="position-label">{label}</label>
            <div className="input-with-unit">
                <input
                    type="number"
                    value={value}
                    min={0}
                    onChange={(e) => handlePositionChange(axis, parseInt(e.target.value) || 0)}
                />
                <span className="input-unit">px</span>
            </div>
        </div>
    ), [handlePositionChange]);

    return (
        <>
            <button
                className="add-widget-btn"
                onClick={handleOpenModal}
                title="Add Widget"
            >
                <span className="btn-icon">➕</span>
                Add Widget
            </button>

            {isModalOpen && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Widget</h2>
                            <button className="modal-close" onClick={handleCloseModal}>
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-section">
                                <h3>Choose Widget Type</h3>
                                <div className="widget-types">
                                    {availableWidgets.map(renderWidgetTypeCard)}
                                </div>
                            </div>

                            {selectedWidgetType && (
                                <>
                                    <div className="form-section">
                                        <h3>Widget Dimensions</h3>
                                        <div className="dimension-options">
                                            {renderDimensionInput('width', widgetDimensions.width, 150, 800)}
                                            {renderDimensionInput('height', widgetDimensions.height, 100, 600)}
                                        </div>
                                    </div>

                                    <div className="form-section">
                                        <h3>Initial Position</h3>
                                        <div className="position-options">
                                            {renderPositionInput('x', widgetPosition.x, 'X Position')}
                                            {renderPositionInput('y', widgetPosition.y, 'Y Position')}
                                        </div>
                                    </div>

                                    {selectedWidgetType.defaultProps && Object.entries(selectedWidgetType.defaultProps).length > 0 && (
                                        <div className="form-section additional-properties">
                                            <h3>Additional Properties</h3>
                                            <div className="properties-grid">
                                                {Object.entries(selectedWidgetType.defaultProps).map(([key, value]) => (
                                                    <div key={key} className="property-field">
                                                        <label className="property-label">
                                                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={String(value ?? '')}
                                                            placeholder={`Enter ${key.toLowerCase()}`}
                                                            onChange={(e) => handlePropertyChange(key, e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={handleCloseModal}>
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

            {existingWidgets.length > 0 && (
                <div className="widgets-list">
                    {existingWidgets.map((widget) => (
                        <div key={widget.id} className="widget-item">
                            <span className="widget-name">
                                {getWidgetDisplayName(widget)}
                            </span>
                            <button
                                className="remove-widget-btn"
                                onClick={() => onRemoveWidget(widget.id)}
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

export default React.memo(WidgetManager);