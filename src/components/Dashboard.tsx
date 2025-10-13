import React, { useState, useCallback, useMemo, useRef, useEffect, CSSProperties } from 'react';
import ResizableWidget from './ResizableWidget';
import { DashboardWidget, DashboardProps, DragState, Position, Dimensions } from '../types/common';
import { constrainPosition, getViewportDimensions } from '../utils/helpers';
import { dispatchWidgetEditing } from '@/utils/widgetEvents';

const Dashboard: React.FC<DashboardProps> = ({
  widgets,
  className = '',
  isLocked = false,
  onRemoveWidget,
  onWidgetResize,
  onWidgetMove,
  onBackgroundChange,
  onUpdateWidgetProps,
}) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedWidgetId: null,
    startPos: { x: 0, y: 0 },
    startWidgetPos: { x: 0, y: 0 },
  });

  const [emptyWidgets, setEmptyWidgets] = useState<Set<string>>(new Set());
  const widgetRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Calculate dynamic container height based on widget positions
  const containerHeight = useMemo(() => {
    if (widgets.length === 0) return 400; // Default minimum height

    const lowestPoint = widgets.reduce((max, widget) => {
      // Calculate widget bottom including padding (2rem = 32px) and some extra margin
      const widgetPadding = 0; // 2rem padding * 2 for top and bottom
      const extraMargin = 5; // Additional breathing room
      const widgetBottom =
        widget.position.y + widget.dimensions.height + widgetPadding + extraMargin;
      return Math.max(max, widgetBottom);
    }, 400); // Minimum 400px height

    return Math.max(lowestPoint, 400);
  }, [widgets]);

  const containerBounds = useMemo(() => getViewportDimensions(), []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, widget: DashboardWidget) => {
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
        startWidgetPos: { x: widget.position.x, y: widget.position.y },
      });
    },
    [isLocked]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging || !dragState.draggedWidgetId) return;

      const deltaX = e.clientX - dragState.startPos.x;
      const deltaY = e.clientY - dragState.startPos.y;

      const rawPosition: Position = {
        x: dragState.startWidgetPos.x + deltaX,
        y: dragState.startWidgetPos.y + deltaY,
      };

      const widget = widgets.find((w) => w.id === dragState.draggedWidgetId);
      if (!widget) return;

      const constrainedPosition = constrainPosition(
        rawPosition,
        widget.dimensions,
        containerBounds
      );
      onWidgetMove?.(dragState.draggedWidgetId, constrainedPosition);
    },
    [dragState, widgets, containerBounds, onWidgetMove]
  );

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState({
        isDragging: false,
        draggedWidgetId: null,
        startPos: { x: 0, y: 0 },
        startWidgetPos: { x: 0, y: 0 },
      });
    }
  }, [dragState.isDragging]);

  const handleWidgetResize = useCallback(
    (widgetId: string, dimensions: Dimensions) => {
      onWidgetResize?.(widgetId, dimensions);
    },
    [onWidgetResize]
  );
  const handleEditWidget = useCallback(
    (widgetId: string) => {
      dispatchWidgetEditing(widgetId);
    },
    []
  );

  const handleRemoveWidget = useCallback(
    (widgetId: string) => {
      onRemoveWidget?.(widgetId);
    },
    [onRemoveWidget]
  );

  // Check for empty widgets after render
  useEffect(() => {
    const checkEmptyWidgets = () => {
      const newEmptyWidgets = new Set<string>();

      widgetRefs.current.forEach((element, widgetId) => {
        const contentElement = element.querySelector('.widget-content');
        if (contentElement) {
          // Check if content is empty (no text, no child elements, or only whitespace)
          const hasText = contentElement.textContent?.trim().length || 0;
          const hasElements = contentElement.children.length;
          const hasVisibleContent = hasText > 0 || hasElements > 0;
          if (!hasVisibleContent && isLocked) {
            newEmptyWidgets.add(widgetId);
          }
        }
      });

      setEmptyWidgets(newEmptyWidgets);
    };

    checkEmptyWidgets();
    const timeoutId = setTimeout(checkEmptyWidgets, 100);

    return () => clearTimeout(timeoutId);
  }, [widgets, isLocked]);

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

  const renderWidget = useCallback(
    (widget: DashboardWidget, index: number) => {
      const WidgetComponent = widget.component;
      const isDragging = dragState.draggedWidgetId === widget.id;

      // Safety check to prevent React error #130 - use a stable empty component
      if (!WidgetComponent) {
        console.error('Widget component is undefined for widget:', widget);
        // Return a stable empty widget div instead of null to maintain consistent rendering
        return (
          <div
            key={widget.id + index}
            className="widget-wrapper error-widget"
            style={{
              position: 'absolute',
              left: `${widget.position.x}px`,
              top: `${widget.position.y}px`,
              width: `${widget.dimensions.width}px`,
              height: `${widget.dimensions.height}px`,
              border: '2px dashed red',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'red',
              fontSize: '12px',
            }}
          >
            Error: Missing Component
          </div>
        );
      }

      const isEmpty = emptyWidgets.has(widget.id);
      const widgetStyles: CSSProperties = {
        position: 'absolute',
        left: `${widget.position.x}px`,
        top: `${widget.position.y}px`,
        zIndex: isDragging ? 1000 : 0,
        cursor: isLocked ? 'default' : 'move',
        // ...(typeof widget.style.radius == 'number' && widget.style.radius > 0) ? { borderRadius: `${widget.style.radius}px` } : {},
        // ...(typeof widget.style.border == 'number' && widget.style.border > 0) ? { border: `${widget.style.border}px solid` } : {}
      };

      const widgetContentStyles: CSSProperties = {
        display: 'flex',
        alignItems: widget.style?.alignment || 'center',
        justifyContent: widget.style?.justify || 'center',
      };
      return (
        <div
          key={widget.id}
          ref={(el) => {
            if (el) {
              widgetRefs.current.set(widget.id, el);
            } else {
              widgetRefs.current.delete(widget.id);
            }
          }}
          className={`widget-wrapper ${isLocked ? 'locked' : 'editable'} ${isDragging ? 'dragging' : ''} ${isEmpty ? 'empty-widget' : ''}`}
          style={widgetStyles}
          onMouseDown={(e) => handleMouseDown(e, widget)}
        >
          <ResizableWidget
            id={widget.id}
            initialWidth={widget.dimensions.width}
            initialHeight={widget.dimensions.height}
            isResizable={!isLocked}
            onResize={(dimensions) => handleWidgetResize(widget.id, dimensions)}
            widgetStyle={widget.style}
          >
            {!isLocked && handleRemoveWidget && (
              <>
              <button
                className="widget-edit-btn edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditWidget(widget.id);
                }}
                title="Edit widget"
              >
                🖉
              </button>
              <button
                className="widget-remove-btn remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveWidget(widget.id);
                }}
                title="Remove widget"
              >
                ×
              </button>
              </>
            )}
            {!isLocked && (
              <div className="widget-drag-indicator" title="Drag to move">
                ⋮⋮
              </div>
            )}
            <div className="widget-content" style={widgetContentStyles}>
              <WidgetComponent
                isLocked={isLocked}
                widgetId={widget.id}
                {...(widget.props || {})}
                {...(widget.id.includes('background-manager') && onBackgroundChange
                  ? { onBackgroundChange }
                  : undefined)}
                {...(widget.id.includes('quick-actions') && onUpdateWidgetProps
                  ? {
                    onButtonsChange: (buttons: Array<{ icon: string; label: string; url: string }>) =>
                      onUpdateWidgetProps(widget.id, { buttons }),
                  }
                  : undefined)}
              />
            </div>
          </ResizableWidget>
        </div>
      );
    },
    [
      dragState.draggedWidgetId,
      isLocked,
      emptyWidgets,
      handleMouseDown,
      handleWidgetResize,
      handleRemoveWidget,
      onBackgroundChange,
      onUpdateWidgetProps,
    ]
  );

  return (
    <div
      className={`dashboard-container ${className}`}
      style={{
        height: `${containerHeight}px`,
        minHeight: '400px',
      }}
    >
      {widgets.map(renderWidget)}
    </div>
  );
};

export default React.memo(Dashboard);
