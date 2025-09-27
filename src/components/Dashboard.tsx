import React, { useState, useCallback, useMemo } from 'react';
import ResizableWidget from './ResizableWidget';
import { DashboardWidget, DashboardProps, DragState, Position, Dimensions } from '../types/common';
import { constrainPosition, getViewportDimensions } from '../utils/helpers';

const Dashboard: React.FC<DashboardProps> = ({
    widgets,
    className = '',
    isLocked = false,
    onRemoveWidget,
    onWidgetResize,
    onWidgetMove,
    onBackgroundChange
}) => {
    const [dragState, setDragState] = useState<DragState>({
        isDragging: false,
        draggedWidgetId: null,
        startPos: { x: 0, y: 0 },
        startWidgetPos: { x: 0, y: 0 }
    });

    const containerBounds = useMemo(() => getViewportDimensions(), []);

    const handleMouseDown = useCallback((e: React.MouseEvent, widget: DashboardWidget) => {
        if (isLocked) return;

        const target = e.target as HTMLElement;
        if (target.classList.contains('resize-handle') || target.closest('.resize-handle')) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        setDragState({
            isDragging: true,
            draggedWidgetId: widget.id,
            startPos: { x: e.clientX, y: e.clientY },
            startWidgetPos: { x: widget.position.x, y: widget.position.y }
        });
    }, [isLocked]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragState.isDragging || !dragState.draggedWidgetId) return;

        const deltaX = e.clientX - dragState.startPos.x;
        const deltaY = e.clientY - dragState.startPos.y;

        const rawPosition: Position = {
            x: dragState.startWidgetPos.x + deltaX,
            y: dragState.startWidgetPos.y + deltaY
        };

        const widget = widgets.find(w => w.id === dragState.draggedWidgetId);
        if (!widget) return;

        const constrainedPosition = constrainPosition(rawPosition, widget.dimensions, containerBounds);
        onWidgetMove?.(dragState.draggedWidgetId, constrainedPosition);
    }, [dragState, widgets, containerBounds, onWidgetMove]);

    const handleMouseUp = useCallback(() => {
        if (dragState.isDragging) {
            setDragState({
                isDragging: false,
                draggedWidgetId: null,
                startPos: { x: 0, y: 0 },
                startWidgetPos: { x: 0, y: 0 }
            });
        }
    }, [dragState.isDragging]);

    const handleWidgetResize = useCallback((widgetId: string, dimensions: Dimensions) => {
        onWidgetResize?.(widgetId, dimensions);
    }, [onWidgetResize]);

    const handleRemoveWidget = useCallback((widgetId: string) => {
        onRemoveWidget?.(widgetId);
    }, [onRemoveWidget]);

    // Global mouse event listeners
    React.useEffect(() => {
        if (dragState.isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

    const renderWidget = useCallback((widget: DashboardWidget, index: number) => {
        const WidgetComponent = widget.component;
        const isDragging = dragState.draggedWidgetId === widget.id;

        // Safety check to prevent React error #130
        if (!WidgetComponent) {
            console.error('Widget component is undefined for widget:', widget);
            return null;
        }

        return (
            <div
                key={widget.id}
                className={`widget-wrapper ${isLocked ? 'locked' : 'editable'} ${isDragging ? 'dragging' : ''}`}
                style={{
                    position: 'absolute',
                    left: `${widget.position.x}px`,
                    top: `${widget.position.y}px`,
                    zIndex: isDragging ? 1000 : 10 + index,
                    cursor: isLocked ? 'default' : 'move'
                }}
                onMouseDown={(e) => handleMouseDown(e, widget)}
            >
                <ResizableWidget
                    id={widget.id}
                    initialWidth={widget.dimensions.width}
                    initialHeight={widget.dimensions.height}
                    isResizable={!isLocked}
                    onResize={(dimensions) => handleWidgetResize(widget.id, dimensions)}
                >
                    {!isLocked && handleRemoveWidget && (
                        <button
                            className="widget-remove-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveWidget(widget.id);
                            }}
                            title="Remove widget"
                        >
                            ×
                        </button>
                    )}
                    {!isLocked && (
                        <div className="widget-drag-indicator" title="Drag to move">
                            ⋮⋮
                        </div>
                    )}
                    <div className="widget-content">
                        <WidgetComponent
                            isLocked={isLocked}
                            {...(widget.props || {})}
                            {...(widget.id.includes('background-manager') && onBackgroundChange ? { onBackgroundChange } : undefined)}
                        />
                    </div>
                </ResizableWidget>
            </div>
        );
    }, [dragState.draggedWidgetId, isLocked, handleMouseDown, handleWidgetResize, handleRemoveWidget]);

    return (
        <div className={`dashboard-container ${className}`}>
            {widgets.map(renderWidget)}
        </div>
    );
};

export default React.memo(Dashboard);