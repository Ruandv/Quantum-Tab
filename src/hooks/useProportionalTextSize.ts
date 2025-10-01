import { useMemo } from 'react';
import { Dimensions } from '../types/common';

/**
 * Configuration for different text size categories
 */
interface TextSizeConfig {
  baseSize: number;      // Base font size in pixels
  minSize: number;       // Minimum font size in pixels
  maxSize: number;       // Maximum font size in pixels
  scaleFactor: number;   // How much to scale relative to widget size
}

/**
 * Predefined text size configurations for different use cases
 */
const TEXT_SIZE_PRESETS = {
  // For large display text like clock time
  display: {
    baseSize: 48,
    minSize: 24,
    maxSize: 96,
    scaleFactor: 0.12  // 12% of widget width
  },
  // For main headings
  heading: {
    baseSize: 24,
    minSize: 16,
    maxSize: 48,
    scaleFactor: 0.06  // 6% of widget width
  },
  // For subheadings
  subheading: {
    baseSize: 18,
    minSize: 14,
    maxSize: 32,
    scaleFactor: 0.045 // 4.5% of widget width
  },
  // For body text
  body: {
    baseSize: 14,
    minSize: 12,
    maxSize: 20,
    scaleFactor: 0.035 // 3.5% of widget width
  },
  // For small text like labels
  small: {
    baseSize: 12,
    minSize: 10,
    maxSize: 16,
    scaleFactor: 0.03  // 3% of widget width
  },
  // For button text
  button: {
    baseSize: 14,
    minSize: 12,
    maxSize: 18,
    scaleFactor: 0.04  // 4% of widget width
  }
} as const;

export type TextSizeCategory = keyof typeof TEXT_SIZE_PRESETS;

/**
 * Custom hook for calculating proportional text size based on widget dimensions
 * 
 * @param dimensions - Current widget dimensions
 * @param category - Text size category (display, heading, body, etc.)
 * @param customConfig - Optional custom configuration to override preset
 * @returns Object with calculated font size and CSS custom properties
 */
export const useProportionalTextSize = (
  dimensions: Dimensions,
  category: TextSizeCategory = 'body',
  customConfig?: Partial<TextSizeConfig>
) => {
  const config = useMemo(() => ({
    ...TEXT_SIZE_PRESETS[category],
    ...customConfig
  }), [category, customConfig]);

  const calculations = useMemo(() => {
    const { width, height } = dimensions;
    const { baseSize, minSize, maxSize, scaleFactor } = config;

    // Calculate size based on the smaller dimension to maintain readability 
    // in both wide and tall widgets
    const referenceDimension = Math.min(width, height);
    
    // Calculate proportional size
    const proportionalSize = referenceDimension * scaleFactor;
    
    // Clamp to min/max bounds
    const clampedSize = Math.max(minSize, Math.min(maxSize, proportionalSize));
    
    // Round to avoid sub-pixel rendering issues
    const fontSize = Math.round(clampedSize);
    
    // Calculate scaling factor for other proportional elements
    const scalingFactor = fontSize / baseSize;
    
    // Calculate line height proportionally (typically 1.2-1.6x font size)
    const lineHeight = Math.round(fontSize * 1.4);
    
    return {
      fontSize,
      lineHeight,
      scalingFactor,
      referenceDimension,
      proportionalSize
    };
  }, [dimensions, config]);

  // Return both the calculated values and CSS custom properties
  return {
    // Direct values
    fontSize: calculations.fontSize,
    lineHeight: calculations.lineHeight,
    scalingFactor: calculations.scalingFactor,
    
    // CSS custom properties object for easy application
    cssProperties: {
      '--widget-font-size': `${calculations.fontSize}px`,
      '--widget-line-height': `${calculations.lineHeight}px`,
      '--widget-scale-factor': calculations.scalingFactor.toString(),
      '--widget-reference-size': `${calculations.referenceDimension}px`
    } as React.CSSProperties,
    
    // Style object for direct application
    style: {
      fontSize: `${calculations.fontSize}px`,
      lineHeight: `${calculations.lineHeight}px`
    },
    
    // Debug information
    debug: {
      category,
      config,
      dimensions,
      ...calculations
    }
  };
};

/**
 * Helper hook for multiple text sizes in a single widget
 * Returns all common text sizes for easy use in complex widgets
 */
export const useWidgetTextSizes = (dimensions: Dimensions) => {
  const display = useProportionalTextSize(dimensions, 'display');
  const heading = useProportionalTextSize(dimensions, 'heading');
  const subheading = useProportionalTextSize(dimensions, 'subheading');
  const body = useProportionalTextSize(dimensions, 'body');
  const small = useProportionalTextSize(dimensions, 'small');
  const button = useProportionalTextSize(dimensions, 'button');

  return {
    display,
    heading,
    subheading,
    body,
    small,
    button,
    
    // Combined CSS properties for all sizes
    allCssProperties: {
      '--widget-display-size': `${display.fontSize}px`,
      '--widget-heading-size': `${heading.fontSize}px`,
      '--widget-subheading-size': `${subheading.fontSize}px`,
      '--widget-body-size': `${body.fontSize}px`,
      '--widget-small-size': `${small.fontSize}px`,
      '--widget-button-size': `${button.fontSize}px`,
      
      '--widget-display-line-height': `${display.lineHeight}px`,
      '--widget-heading-line-height': `${heading.lineHeight}px`,
      '--widget-subheading-line-height': `${subheading.lineHeight}px`,
      '--widget-body-line-height': `${body.lineHeight}px`,
      '--widget-small-line-height': `${small.lineHeight}px`,
      '--widget-button-line-height': `${button.lineHeight}px`,
      '--widget-background-color': '#110099'
    } as React.CSSProperties
  };
};

export default useProportionalTextSize;