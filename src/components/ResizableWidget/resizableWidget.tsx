import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useWidgetTextSizes } from '../../hooks/useProportionalTextSize';
import { CssStyle } from '../../types/common';
import styles from './resizableWidget.module.css';

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
  widgetStyle?: CssStyle;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const ResizableWidget: React.FC<ResizableWidgetProps> = ({
  children,
  initialWidth = 300,
  initialHeight = 200,
  minWidth = 150,
  minHeight = 10,
  maxWidth = 1800,
  maxHeight = 1600,
  onResize,
  isResizable = true,
  widgetStyle,
  className = '',
}) => {
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [isResizing, setIsResizing] = useState(false);
  const [, setResizeDirection] = useState<string | null>(null);

  const widgetRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });

  // Calculate proportional text sizes based on current dimensions
  const textSizes = useWidgetTextSizes({ width, height });

  // Combine custom properties with existing styles
  const widgetStyles = useMemo(
    () => ({
      width: `${width}px`,
      height: `${height}px`,
      position: 'relative' as const,
      minWidth: `${minWidth}px`,
      minHeight: `${minHeight}px`,
      maxWidth: `${maxWidth}px`,
      maxHeight: `${maxHeight}px`,
      color: `rgb(${widgetStyle?.textColorRed ?? 255}, ${widgetStyle?.textColorGreen ?? 255}, ${widgetStyle?.textColorBlue ?? 255})`,
      ...textSizes.allCssProperties,
      // Add background color if provided (but not when blur is active - backdrop handles it)
      ...(widgetStyle?.backgroundColorRed !== undefined &&
      (!widgetStyle?.blur || widgetStyle.blur <= 0)
        ? {
            backgroundColor: `rgba(${widgetStyle.backgroundColorRed}, ${widgetStyle.backgroundColorGreen}, ${widgetStyle.backgroundColorBlue}, ${widgetStyle.transparency})`,
          }
        : {}),
      // Add border radius if provided
      ...(widgetStyle?.radius ? { borderRadius: `${widgetStyle.radius}px` } : {}),
      // Add border if provided
      ...(widgetStyle?.border
        ? { border: `${widgetStyle.border}px solid rgba(255, 255, 255, 0.2)` }
        : {}),
    }),
    [
      width,
      height,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
      textSizes.allCssProperties,
      widgetStyle,
    ]
  );

  // Create blur backdrop styles if blur is specified
  const backdropStyles = useMemo(() => {
    if (!widgetStyle?.blur || widgetStyle.blur <= 0) return null;

    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor:
        widgetStyle?.backgroundColorRed !== undefined
          ? `rgba(${widgetStyle.backgroundColorRed}, ${widgetStyle.backgroundColorGreen}, ${widgetStyle.backgroundColorBlue}, ${widgetStyle.transparency})`
          : 'rgba(255, 255, 255, 0.1)',
      filter: `blur(${widgetStyle.blur}px)`,
      borderRadius: widgetStyle?.radius ? `${widgetStyle.radius}px` : 0,
      zIndex: -1,
      pointerEvents: 'none' as const,
    };
  }, [widgetStyle]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, direction: ResizeDirection) => {
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
    },
    [width, height, isResizable, minWidth, minHeight, maxWidth, maxHeight, onResize]
  );

  const getResizeHandles = () => {
    if (!isResizable) return null;

    const handles: { direction: ResizeDirection; classNames: string }[] = [
      { direction: 'n', classNames: `${styles.resizeHandle} ${styles.resizeN}` },
      { direction: 's', classNames: `${styles.resizeHandle} ${styles.resizeS}` },
      { direction: 'e', classNames: `${styles.resizeHandle} ${styles.resizeE}` },
      { direction: 'w', classNames: `${styles.resizeHandle} ${styles.resizeW}` },
      { direction: 'ne', classNames: `${styles.resizeHandle} ${styles.resizeNe}` },
      { direction: 'nw', classNames: `${styles.resizeHandle} ${styles.resizeNw}` },
      { direction: 'se', classNames: `${styles.resizeHandle} ${styles.resizeSe}` },
      { direction: 'sw', classNames: `${styles.resizeHandle} ${styles.resizeSw}` },
    ];

    return handles.map(({ direction, classNames }) => (
      <div
        key={direction}
        className={classNames}
        onMouseDown={(e) => handleMouseDown(e, direction)}
      />
    ));
  };

  return (
    <div
      ref={widgetRef}
      className={`${styles.resizableWidget} ${className} ${isResizing ? styles.resizing : ''}`}
      style={widgetStyles}
    >
      {/* Blur backdrop - positioned behind content */}
      {backdropStyles && (
        <div className={styles.widgetBlurBackdrop} style={backdropStyles} aria-hidden="true" />
      )}
      {children}
      {getResizeHandles()}
    </div>
  );
};

export default ResizableWidget;
