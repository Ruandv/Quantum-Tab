# Proportional Text Sizing System

## Overview

The Quantum Tab extension now features a comprehensive proportional text sizing system that automatically adjusts text sizes based on widget dimensions. This ensures text remains readable and properly proportioned regardless of how users resize their widgets.

## How It Works

### 1. Custom Hook: `useProportionalTextSize`

Located in `src/hooks/useProportionalTextSize.ts`, this hook calculates appropriate font sizes based on:

- **Widget dimensions** (width × height)
- **Text category** (display, heading, subheading, body, small, button)
- **Scaling factors** (customizable per text type)
- **Min/max constraints** (prevents text from becoming too small or large)

### 2. Text Size Categories

The system provides predefined categories optimized for different use cases:

| Category | Base Size | Scale Factor | Use Case |
|----------|-----------|--------------|----------|
| `display` | 48px | 12% of width | Large display text (clock time) |
| `heading` | 24px | 6% of width | Main headings |
| `subheading` | 18px | 4.5% of width | Secondary headings |
| `body` | 14px | 3.5% of width | Regular text content |
| `small` | 12px | 3% of width | Labels, hints, captions |
| `button` | 14px | 4% of width | Button text |

### 3. CSS Custom Properties

The system automatically sets CSS custom properties on each widget:

```css
--widget-display-size: 48px;
--widget-heading-size: 24px;
--widget-subheading-size: 18px;
--widget-body-size: 14px;
--widget-small-size: 12px;
--widget-button-size: 14px;

/* Plus corresponding line-height properties */
--widget-display-line-height: 67px;
--widget-heading-line-height: 34px;
/* ... etc */
```

## Usage Examples

### In React Components

```tsx
import { useProportionalTextSize, useWidgetTextSizes } from '../hooks/useProportionalTextSize';

const MyWidget: React.FC = () => {
  // For a single text size
  const headingSize = useProportionalTextSize({ width: 400, height: 200 }, 'heading');
  
  // For multiple text sizes
  const textSizes = useWidgetTextSizes({ width: 400, height: 200 });
  
  return (
    <div style={textSizes.allCssProperties}>
      <h1 style={headingSize.style}>This scales proportionally</h1>
      <p style={{ fontSize: 'var(--widget-body-size)' }}>This uses CSS variables</p>
    </div>
  );
};
```

### In CSS

```css
.my-widget-title {
  font-size: var(--widget-heading-size, 1.2rem); /* Fallback for older browsers */
  line-height: var(--widget-heading-line-height, 1.4);
}

.my-widget-content {
  font-size: var(--widget-body-size, 1rem);
  line-height: var(--widget-body-line-height, 1.4);
}
```

## Implementation Details

### 1. Calculation Logic

The system uses the **smaller dimension** (min of width/height) as the reference to ensure text remains readable in both wide and tall widgets:

```typescript
const referenceDimension = Math.min(width, height);
const proportionalSize = referenceDimension * scaleFactor;
const fontSize = Math.max(minSize, Math.min(maxSize, proportionalSize));
```

### 2. Responsive Behavior

- **Small widgets** (150×100px): Text scales down but stays above minimum thresholds
- **Large widgets** (800×600px): Text scales up but is capped at maximum sizes
- **Aspect ratio independent**: Uses smaller dimension to prevent text from becoming too large in wide/tall widgets

### 3. Performance Optimizations

- Uses `useMemo` to prevent unnecessary recalculations
- CSS custom properties enable efficient styling without JavaScript re-renders
- Rounds font sizes to avoid sub-pixel rendering issues

## Current Widget Support

All existing widgets have been updated to use proportional text sizing:

- ✅ **LiveClock**: Time display scales from 24px to 96px based on widget size
- ✅ **QuickActionButtons**: Button text and icons scale proportionally
- ✅ **GitHubWidget**: All text elements (titles, labels, values) scale appropriately
- ✅ **BackgroundManager**: Upload text and hints scale with widget size

## Customization

You can create custom text size configurations:

```typescript
const customSize = useProportionalTextSize(
  { width: 300, height: 200 },
  'body',
  {
    baseSize: 16,
    minSize: 12,
    maxSize: 24,
    scaleFactor: 0.05
  }
);
```

## Testing

The implementation includes a demo component (`ProportionalTextDemo.tsx`) that shows how text scales at different widget sizes. You can see real-time font size calculations and visual scaling behavior.

## Benefits

1. **Improved Readability**: Text remains legible at all widget sizes
2. **Better UX**: Consistent visual hierarchy regardless of widget dimensions
3. **Responsive Design**: Automatic adaptation without manual CSS media queries
4. **Developer Friendly**: Easy to use hooks and CSS variables
5. **Performance**: Efficient calculation and rendering
6. **Accessibility**: Maintains readable text sizes for all users

## Future Enhancements

- Font weight scaling based on size
- Dynamic padding/margin adjustments
- Icon size scaling integration
- Advanced text fitting algorithms
- Theme-based scaling factors