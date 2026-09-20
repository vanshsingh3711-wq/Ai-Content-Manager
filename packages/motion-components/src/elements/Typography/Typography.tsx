import React from 'react';
import { ResolvedSceneElement } from '../../scene/scene.types';
import { DesignTokens } from '../../themes/tokens.types';
import { TypographyStyle, TextMeasurementResult } from '../../typography/typography.types';
import { resolveTypography } from '../../typography/typography.resolver';

export interface TypographyProps {
  element: ResolvedSceneElement;
  tokens: DesignTokens;
}

export const Typography: React.FC<TypographyProps> = ({ element, tokens }) => {
  if (element.type !== 'text') return null;

  const { textConfig = {}, textMeasurement, textSegments, textContent } = element;
  const resolvedStyle = resolveTypography(textConfig.role, tokens, textConfig);

  // If the scene resolver didn't measure the text (for some reason), we can't render it properly.
  // The system design requires it to be pre-measured.
  if (!textMeasurement) {
    return <div style={{ color: 'red' }}>Error: Text not measured by layout system</div>;
  }

  const { lines, fontSize, width, height } = textMeasurement;
  
  const align = resolvedStyle.alignment || 'left';
  const verticalAlign = textConfig.verticalAlign || 'top';
  
  // Calculate text alignment mapping for SVG
  const textAnchorMap: Record<string, "start" | "middle" | "end"> = {
    'left': 'start',
    'center': 'middle',
    'right': 'end'
  };

  // Determine starting X based on alignment
  let startX = 0;
  if (align === 'center') startX = width / 2;
  if (align === 'right') startX = width;

  // Vertical alignment
  let startY = 0;
  if (verticalAlign === 'middle') {
    startY = (element.geometry.height - height) / 2;
  } else if (verticalAlign === 'bottom') {
    startY = element.geometry.height - height;
  }

  const lineHeight = fontSize * resolvedStyle.lineHeight;

  // Background rendering
  const renderBackground = () => {
    if (!textConfig.background || textConfig.background === 'none') return null;
    
    let bgColor = tokens.colors.surface;
    let radius = tokens.radius.sm;
    const paddingX = tokens.spacing.md;
    const paddingY = tokens.spacing.sm;

    if (textConfig.background === 'pill') {
      radius = tokens.radius.pill;
    } else if (textConfig.background === 'highlight') {
      bgColor = tokens.colors.accent;
    }

    return (
      <rect
        x={-paddingX}
        y={startY - paddingY}
        width={width + paddingX * 2}
        height={height + paddingY * 2}
        rx={radius}
        ry={radius}
        fill={bgColor}
      />
    );
  };

  return (
    <svg 
      width={element.geometry.width} 
      height={element.geometry.height}
      style={{ overflow: 'visible' }}
    >
      {renderBackground()}
      
      {/* 
        We use text-before-edge alignment so the Y coordinate corresponds to the top of the text bounding box,
        matching our measurement model which considers height = lines * lineHeight.
      */}
      <text
        fontFamily={resolvedStyle.fontFamily}
        fontSize={fontSize}
        fontWeight={resolvedStyle.fontWeight}
        letterSpacing={resolvedStyle.letterSpacing}
        fill={resolvedStyle.colorToken || tokens.colors.textPrimary}
        textAnchor={textAnchorMap[align]}
        alignmentBaseline="before-edge"
        dominantBaseline="hanging"
      >
        {lines.map((line, index) => (
          <tspan 
            key={index} 
            x={startX} 
            y={startY + index * lineHeight}
          >
            {/* If we have segments, we would render them here by slicing the string, but for simplicity of the primitive, we just render the line. 
                Full rich-text segment implementation across line breaks requires advanced cursor tracking. 
                For MVP, we just render the raw string per line if textContent is provided. */}
            {line.text}
          </tspan>
        ))}
      </text>
    </svg>
  );
};
