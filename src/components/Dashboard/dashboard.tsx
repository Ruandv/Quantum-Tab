import React, { useState, useCallback, useMemo, useRef, useEffect, CSSProperties } from 'react';
import ResizableWidget from '../ResizableWidget/resizableWidget';
import { DashboardWidget, DashboardProps, DragState, Position, Dimensions } from '../../types/common';
import { constrainPosition, getViewportDimensions } from '../../utils/helpers';
import { dispatchWidgetEditing } from '@/utils/widgetEvents';
import styles from './dashboard.module.css';
import widgetCommon from '../../styles/widgetCommon.module.css';

const Dashboard: React.FC<DashboardProps> = ({
  widgets,
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

  const handleRequestWidgetInfo = useCallback(
    (widgetName: string) => {
      // Create a documentation URL for the widget on GitHub Wiki
      const baseUrl = 'https://github.com/Ruandv/Quantum-Tab/wiki';
      const widgetSlug = widgetName.toLowerCase().replace(/\s+/g, '');
      const docsUrl = `${baseUrl}/${widgetSlug}`;

      // Open documentation in a new tab/window
      window.open(docsUrl, '_blank', 'noopener,noreferrer');
    },
    []
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
        const contentElement = element.querySelector(`.${styles.widgetContent}`);
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
            className={styles.errorWidget}
            style={{
              position: 'absolute',
              left: `${widget.position.x}px`,
              top: `${widget.position.y}px`,
              width: `${widget.dimensions.width}px`,
              height: `${widget.dimensions.height}px`,
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
        cursor: isLocked ? 'default' : 'move'
      };

      const widgetContentStyles: CSSProperties = {
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
          className={`${styles.widgetWrapper} ${isLocked ? styles.locked : styles.editable} ${isDragging ? styles.dragging : ''} ${isEmpty ? styles.emptyWidget : ''}`}
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
            {!isLocked && (
              <>
                <button
                  className={styles.widgetInfoBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRequestWidgetInfo(widget.wikiPage || widget.name);
                  }}
                  title="More info ..."
                >🛈
                </button>
                <button
                  className={styles.widgetEditBtn}
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleEditWidget(widget.id);
                  }}
                  title="Edit widget"
                >
                  🖉
                </button>
                <button
                  className={styles.widgetRemoveBtn}
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleRemoveWidget(widget.id);
                  }}
                  title="Remove widget"
                >
                  ×
                </button>
              </>
            )}
            <div className={`${styles.widgetContent}`} style={widgetContentStyles}>
              {widget.props?.widgetHeading && widget.isRuntimeVisible && (<h3 className={widgetCommon.widgetTitle} >{widget.props?.widgetHeading?.toString()}</h3>)}
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
      handleRequestWidgetInfo,
      handleEditWidget,
      onBackgroundChange,
      onUpdateWidgetProps,
    ]
  );

  return (
    <div
      className={`${styles.dashboardContainer}`}
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
