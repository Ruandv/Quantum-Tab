import React, { useState, useRef, useCallback } from 'react';

interface ResizableWidgetProps {
  id: string;
  children: React.ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onResize?: (dimensions: { width: number; height: number }) => void;
  isResizable?: boolean;
  className?: string;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const ResizableWidget: React.FC<ResizableWidgetProps> = ({
  id,
  children,
  initialWidth = 300,
  initialHeight = 200,
  minWidth = 150,
  minHeight = 100,
  maxWidth = 800,
  maxHeight = 600,
  onResize,
  isResizable = true,
  className = '',
}) => {
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);
  
  const widgetRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent, direction: ResizeDirection) => {
    if (!isResizable) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeDirection(direction);
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { width, height };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;
      
      let newWidth = startSize.current.width;
      let newHeight = startSize.current.height;

      // Calculate new dimensions based on resize direction
      if (direction.includes('e')) {
        newWidth = Math.max(minWidth, Math.min(maxWidth, startSize.current.width + deltaX));
      }
      if (direction.includes('w')) {
        newWidth = Math.max(minWidth, Math.min(maxWidth, startSize.current.width - deltaX));
      }
      if (direction.includes('s')) {
        newHeight = Math.max(minHeight, Math.min(maxHeight, startSize.current.height + deltaY));
      }
      if (direction.includes('n')) {
        newHeight = Math.max(minHeight, Math.min(maxHeight, startSize.current.height - deltaY));
      }

      setWidth(newWidth);
      setHeight(newHeight);
      onResize?.({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [width, height, isResizable, minWidth, minHeight, maxWidth, maxHeight, onResize]);

  const getResizeHandles = () => {
    if (!isResizable) return null;

    const handles: { direction: ResizeDirection; className: string }[] = [
      { direction: 'n', className: 'resize-handle resize-n' },
      { direction: 's', className: 'resize-handle resize-s' },
      { direction: 'e', className: 'resize-handle resize-e' },
      { direction: 'w', className: 'resize-handle resize-w' },
      { direction: 'ne', className: 'resize-handle resize-ne' },
      { direction: 'nw', className: 'resize-handle resize-nw' },
      { direction: 'se', className: 'resize-handle resize-se' },
      { direction: 'sw', className: 'resize-handle resize-sw' },
    ];

    return handles.map(({ direction, className }) => (
      <div
        key={direction}
        className={className}
        onMouseDown={(e) => handleMouseDown(e, direction)}
      />
    ));
  };

  return (
    <div
      ref={widgetRef}
      className={`resizable-widget ${className} ${isResizing ? 'resizing' : ''}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`,
        maxWidth: `${maxWidth}px`,
        maxHeight: `${maxHeight}px`,
      }}
    >
      {children}
      {getResizeHandles()}
    </div>
  );
};

export default ResizableWidget;