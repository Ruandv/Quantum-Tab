import React, { useState } from 'react';
import ResizableWidget from './ResizableWidget';

export interface DashboardWidget {
  id: string;
  component: React.ComponentType<any>;
  props?: any;
  dimensions: {
    width: number;
    height: number;
  };
  position: {
    x: number;
    y: number;
  };
}

interface DashboardProps {
  widgets: DashboardWidget[];
  className?: string;
  isLocked?: boolean;
  onWidgetReorder?: (widgets: DashboardWidget[]) => void;
  onRemoveWidget?: (widgetId: string) => void;
  onWidgetResize?: (widgetId: string, dimensions: { width: number; height: number }) => void;
  onWidgetMove?: (widgetId: string, position: { x: number; y: number }) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  widgets, 
  className = '',
  isLocked = false,
  onWidgetReorder,
  onRemoveWidget,
  onWidgetResize,
  onWidgetMove
}) => {
  
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedWidgetId: string | null;
    startPos: { x: number; y: number };
    startWidgetPos: { x: number; y: number };
  }>({
    isDragging: false,
    draggedWidgetId: null,
    startPos: { x: 0, y: 0 },
    startWidgetPos: { x: 0, y: 0 }
  });

  const handleMouseDown = (e: React.MouseEvent, widget: DashboardWidget) => {
    if (isLocked) return;
    
    // Only start drag if clicking on the widget content area, not resize handles
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
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedWidgetId) return;
    
    const deltaX = e.clientX - dragState.startPos.x;
    const deltaY = e.clientY - dragState.startPos.y;
    
    const newX = Math.max(0, dragState.startWidgetPos.x + deltaX);
    const newY = Math.max(0, dragState.startWidgetPos.y + deltaY);
    
    onWidgetMove?.(dragState.draggedWidgetId, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    if (dragState.isDragging) {
      setDragState({
        isDragging: false,
        draggedWidgetId: null,
        startPos: { x: 0, y: 0 },
        startWidgetPos: { x: 0, y: 0 }
      });
    }
  };

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
  }, [dragState.isDragging, dragState.draggedWidgetId, dragState.startPos, dragState.startWidgetPos, onWidgetMove]);

  return (
    <div className={`dashboard-container ${className}`}>
      {widgets.map((widget, index) => {
        const WidgetComponent = widget.component;
        const isDragging = dragState.draggedWidgetId === widget.id;
        
        return (
          <div
            key={widget.id}
            className={`widget-wrapper ${isLocked ? 'locked' : 'editable'} ${isDragging ? 'dragging' : ''}`}
            style={{
              position: 'absolute',
              left: `${widget.position.x}px`,
              top: `${widget.position.y}px`,
              zIndex: isDragging ? 1000 : 10 + index, // Higher z-index for dragged widget, stacking order for others
              cursor: isLocked ? 'default' : 'move'
            }}
            onMouseDown={(e) => handleMouseDown(e, widget)}
          >
            <ResizableWidget
              id={widget.id}
              initialWidth={widget.dimensions.width}
              initialHeight={widget.dimensions.height}
              isResizable={!isLocked}
              onResize={(dimensions) => onWidgetResize?.(widget.id, dimensions)}
            >
              {!isLocked && onRemoveWidget && (
                <button 
                  className="widget-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveWidget(widget.id);
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
                <WidgetComponent {...(widget.props || {})} />
              </div>
            </ResizableWidget>
          </div>
        );
      })}
    </div>
  );
};

export default Dashboard;