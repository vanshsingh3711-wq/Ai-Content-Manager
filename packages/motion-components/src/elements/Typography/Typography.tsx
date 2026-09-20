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

  // Helper to slice segments for a specific line
  // We keep a running tally of character offsets to know where this line sits in the full text.
  let currentGlobalOffset = 0;
  
  const renderLineWithSegments = (lineText: string, lineIndex: number) => {
    // If no segments are provided, just return the raw text
    if (!textSegments || textSegments.length === 0) {
      return lineText;
    }

    // We need to find the global start index of this line.
    // If we assume `lines` were created by sequentially breaking `fullTextContent`,
    // we can just find the index of lineText starting from currentGlobalOffset.
    // Note: this is a simple heuristic assuming spaces were preserved or collapsed predictably.
    const fullText = (textContent || textSegments.map(s => s.text).join('')).replace(/\\s+/g, ' ');
    const normalizedLine = lineText.replace(/\\s+/g, ' ');
    
    // Simple fallback if complex splitting is too hard for this MVP:
    // Just map over segments and if the segment text is found in this line, color it.
    // But since words might repeat, we do a proper index tracking.
    
    const elements: React.ReactNode[] = [];
    let lineCharIndex = 0;
    
    for (const segment of textSegments) {
      if (lineCharIndex >= lineText.length) break;
      
      const segmentText = segment.text;
      
      // Look for the segment in the remaining line text
      const remainingLine = lineText.slice(lineCharIndex);
      const segIndexInLine = remainingLine.indexOf(segmentText);
      
      if (segIndexInLine !== -1) {
        // Add any un-styled text before this segment
        if (segIndexInLine > 0) {
          elements.push(
            <tspan key={`${lineIndex}-${lineCharIndex}-pre`}>
              {remainingLine.slice(0, segIndexInLine)}
            </tspan>
          );
          lineCharIndex += segIndexInLine;
        }
        
        // Add the styled segment
        elements.push(
          <tspan 
            key={`${lineIndex}-${lineCharIndex}-seg`}
            fill={segment.style?.colorToken || (segment.style?.emphasis ? tokens.colors.accent : undefined)}
            fontWeight={segment.style?.emphasis ? 700 : undefined}
          >
            {segmentText}
          </tspan>
        );
        lineCharIndex += segmentText.length;
      }
    }
    
    // Add any trailing text
    if (lineCharIndex < lineText.length) {
      elements.push(
        <tspan key={`${lineIndex}-${lineCharIndex}-post`}>
          {lineText.slice(lineCharIndex)}
        </tspan>
      );
    }
    
    return elements.length > 0 ? elements : lineText;
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
            {renderLineWithSegments(line.text, index)}
          </tspan>
        ))}
      </text>
    </svg>
  );
};
