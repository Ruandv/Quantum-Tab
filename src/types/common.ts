// Centralized type definitions for the entire application

// Utility type to make all properties required except className and callback functions
type RequiredProps<T> = Required<Omit<T, 'className' | 'isLocked' | 'buttons' | 'onBackgroundChange'>>;

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface DashboardWidget {
  id: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  dimensions: Dimensions;
  position: Position;
}

export interface WidgetType<T = any> {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType<T>;
  defaultDimensions: Dimensions;
  defaultProps: RequiredProps<T>;
}
interface DefaultWidgetProps{
    isLocked: boolean;
}

export interface SavedData {
  widgets: DashboardWidget[];
  backgroundImage: string;
  timestamp: number;
}

export interface StorageInfo {
  widgetsSize: number;
  backgroundSize: number;
  lockStateSize: number;
  totalSize: number;
}

// Component-specific interfaces
export interface LiveClockProps extends DefaultWidgetProps {
  className?: string;
  timeZone: string;
  dateFormat?: string; // Optional date format prop
  timeFormat?: string; // Optional time format prop
  showTime?: boolean;
  showDate?: boolean;
  showTimeZone?: boolean;
}

export interface QuickActionButtonsProps extends DefaultWidgetProps {
  className?: string;
  buttons?: ActionButton[];
}

export interface ActionButton {
  icon: string;
  label: string;
  url: string;
}

export interface BackgroundManagerProps extends DefaultWidgetProps {
  className?: string;
  onBackgroundChange?: (imageUrl: string) => void;
}

export interface ResizableWidgetProps {
  id: string;
  children: React.ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onResize?: (dimensions: Dimensions) => void;
  isResizable?: boolean;
  className?: string;
}

export interface DashboardProps {
  widgets: DashboardWidget[];
  className?: string;
  isLocked?: boolean;
  onRemoveWidget?: (widgetId: string) => void;
  onWidgetResize?: (widgetId: string, dimensions: Dimensions) => void;
  onWidgetMove?: (widgetId: string, position: Position) => void;
  onBackgroundChange?: (imageUrl: string) => void;
}

export interface WidgetManagerProps extends DefaultWidgetProps {
  onAddWidget: (widget: DashboardWidget) => void;
  onRemoveWidget: (widgetId: string) => void;
  existingWidgets: DashboardWidget[];
  onBackgroundChange?: (imageUrl: string) => void;
}

// Drag state interface
export interface DragState {
  isDragging: boolean;
  draggedWidgetId: string | null;
  startPos: Position;
  startWidgetPos: Position;
}

// Resize direction type
export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

// Constants
export const STORAGE_KEYS = {
  WIDGETS: 'quantum-tab-widgets',
  BACKGROUND: 'quantum-tab-background',
  LOCK_STATE: 'quantum-tab-lock-state'
} as const;

export const DEFAULT_WIDGET_CONSTRAINTS = {
  MIN_WIDTH: 150,
  MIN_HEIGHT: 100,
  MAX_WIDTH: 800,
  MAX_HEIGHT: 600,
  DEFAULT_WIDTH: 300,
  DEFAULT_HEIGHT: 200
} as const;

export const FILE_UPLOAD_CONSTRAINTS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
} as const;