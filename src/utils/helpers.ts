import { Position, Dimensions, FILE_UPLOAD_CONSTRAINTS } from '../types/common';

/**
 * Generate a unique ID with timestamp and random component
 */
export const generateUniqueId = (prefix: string = ''): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Constrain position to ensure widget stays within bounds
 */
export const constrainPosition = (
  position: Position,
  dimensions: Dimensions,
  containerBounds: { width: number; height: number }
): Position => {
  const maxX = Math.max(0, containerBounds.width - dimensions.width);
  const maxY = Math.max(0, containerBounds.height - dimensions.height);
  
  return {
    x: clamp(position.x, 0, maxX),
    y: clamp(position.y, 0, maxY)
  };
};

/**
 * Debounce function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
};

/**
 * Validate image file for upload
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = FILE_UPLOAD_CONSTRAINTS.ALLOWED_TYPES as readonly string[];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  if (file.size > FILE_UPLOAD_CONSTRAINTS.MAX_SIZE) {
    const maxSizeMB = FILE_UPLOAD_CONSTRAINTS.MAX_SIZE / (1024 * 1024);
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }

  return { isValid: true };
};

/**
 * Convert file to data URL
 */
export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (Array.isArray(obj)) return obj.map(deepClone) as unknown as T;
  
  const clonedObj = {} as T;
  Object.keys(obj).forEach(key => {
    clonedObj[key as keyof T] = deepClone(obj[key as keyof T]);
  });
  
  return clonedObj;
};

/**
 * Check if two objects are equal (shallow comparison)
 */
export const isEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => isEqual(a[key], b[key]));
  }
  
  return false;
};

/**
 * Create a safe string for use in IDs or classes
 */
export const sanitizeString = (str: string): string => {
  return str.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Get viewport dimensions
 */
export const getViewportDimensions = (): Dimensions => {
  return {
    width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
  };
};

/**
 * Calculate optimal widget position to avoid overlaps
 */
export const findOptimalPosition = (
  dimensions: Dimensions,
  existingWidgets: { position: Position; dimensions: Dimensions }[],
  containerBounds: Dimensions
): Position => {
  const gridSize = 20; // Snap to grid
  const padding = 10;
  
  for (let y = padding; y < containerBounds.height - dimensions.height; y += gridSize) {
    for (let x = padding; x < containerBounds.width - dimensions.width; x += gridSize) {
      const position = { x, y };
      
      // Check for overlaps
      const hasOverlap = existingWidgets.some(widget => {
        return !(
          position.x >= widget.position.x + widget.dimensions.width ||
          position.x + dimensions.width <= widget.position.x ||
          position.y >= widget.position.y + widget.dimensions.height ||
          position.y + dimensions.height <= widget.position.y
        );
      });
      
      if (!hasOverlap) {
        return position;
      }
    }
  }
  
  // Fallback to random position if no optimal position found
  return {
    x: Math.random() * Math.max(0, containerBounds.width - dimensions.width),
    y: Math.random() * Math.max(0, containerBounds.height - dimensions.height)
  };
};