import React from 'react';
import { useProportionalTextSize, useWidgetTextSizes } from '../hooks/useProportionalTextSize';
import { Dimensions } from '../types/common';

/**
 * Test component to demonstrate proportional text sizing
 * This shows how text scales based on widget dimensions
 */
const ProportionalTextDemo: React.FC<{ dimensions: Dimensions }> = ({ dimensions }) => {
  const displayText = useProportionalTextSize(dimensions, 'display');
  const headingText = useProportionalTextSize(dimensions, 'heading');
  const bodyText = useProportionalTextSize(dimensions, 'body');
  const smallText = useProportionalTextSize(dimensions, 'small');
  
  const allSizes = useWidgetTextSizes(dimensions);

  return (
    <div 
      className="proportional-text-demo" 
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '12px',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.1)',
        ...allSizes.allCssProperties
      }}
    >
      <div style={displayText.style}>Display Text</div>
      <div style={headingText.style}>Heading Text</div>
      <div style={bodyText.style}>Body Text - This text will scale proportionally based on the widget size</div>
      <div style={smallText.style}>Small Text - Labels and hints</div>
      
      <div style={{ marginTop: '1rem', fontSize: 'var(--widget-small-size)', opacity: 0.7 }}>
        Size: {dimensions.width}×{dimensions.height}px<br/>
        Display: {displayText.fontSize}px<br/>
        Heading: {headingText.fontSize}px<br/>
        Body: {bodyText.fontSize}px<br/>
        Small: {smallText.fontSize}px
      </div>
    </div>
  );
};

export default ProportionalTextDemo;