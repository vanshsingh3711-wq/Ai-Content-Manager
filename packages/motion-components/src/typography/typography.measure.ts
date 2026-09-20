import { TypographyStyle, TextMeasurementResult, TextLine, TextLayoutConfig } from './typography.types';

// Singleton canvas context for performance, to avoid recreating it on every measure
let sharedContext: CanvasRenderingContext2D | null = null;

function getCanvasContext(): CanvasRenderingContext2D | null {
  if (sharedContext) return sharedContext;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    sharedContext = canvas.getContext('2d');
    return sharedContext;
  }
  return null;
}

function getFontString(style: TypographyStyle, fontSizeOverride?: number): string {
  const size = fontSizeOverride ?? style.fontSize;
  return `${style.fontWeight} ${size}px ${style.fontFamily}`;
}

/**
 * Deterministically measures and wraps text given a set of constraints.
 */
export function measureText(
  text: string,
  style: TypographyStyle,
  maxWidth?: number,
  maxLines?: number,
  fontSizeOverride?: number
): TextMeasurementResult {
  const ctx = getCanvasContext();
  const activeFontSize = fontSizeOverride ?? style.fontSize;

  if (!ctx) {
    // Naive fallback for non-DOM environments (e.g., simplistic node test runner without JSDOM)
    // Assumes average character width is ~0.6 of font size.
    const approxCharWidth = activeFontSize * 0.6;
    const approxLineHeight = activeFontSize * style.lineHeight;
    const charsPerLine = maxWidth ? Math.max(1, Math.floor(maxWidth / approxCharWidth)) : text.length;
    
    // Very naive wrapping
    const lines: TextLine[] = [];
    const words = text.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + word).length <= charsPerLine || currentLine === '') {
        currentLine += (currentLine === '' ? '' : ' ') + word;
      } else {
        lines.push({ text: currentLine, width: currentLine.length * approxCharWidth });
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push({ text: currentLine, width: currentLine.length * approxCharWidth });
    }

    const fitsLines = maxLines ? lines.length <= maxLines : true;
    let finalLines = lines;
    if (maxLines && lines.length > maxLines) {
      finalLines = lines.slice(0, maxLines);
    }

    return {
      width: Math.max(...finalLines.map(l => l.width)),
      height: finalLines.length * approxLineHeight,
      lineCount: finalLines.length,
      lines: finalLines,
      fits: fitsLines,
      fontSize: activeFontSize,
      reason: fitsLines ? undefined : 'max_lines_exceeded'
    };
  }

  // Proper DOM Canvas Measurement
  ctx.font = getFontString(style, activeFontSize);
  const approxLineHeight = activeFontSize * style.lineHeight;

  if (!maxWidth) {
    // Single line measurement
    const metrics = ctx.measureText(text);
    const width = metrics.width;
    const fits = maxLines !== undefined ? maxLines >= 1 : true;
    return {
      width,
      height: approxLineHeight,
      lineCount: 1,
      lines: [{ text, width }],
      fits,
      fontSize: activeFontSize,
      reason: fits ? undefined : 'max_lines_exceeded'
    };
  }

  // Wrapping logic
  const words = text.split(' ');
  const lines: TextLine[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine === '' ? word : `${currentLine} ${word}`;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine !== '') {
      // Current word pushes line over max width, push current line and start new
      lines.push({ text: currentLine, width: ctx.measureText(currentLine).width });
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push({ text: currentLine, width: ctx.measureText(currentLine).width });
  }

  const fitsLines = maxLines ? lines.length <= maxLines : true;
  let finalLines = lines;
  if (maxLines && lines.length > maxLines) {
    finalLines = lines.slice(0, maxLines);
  }

  return {
    width: Math.max(...finalLines.map(l => l.width), 0),
    height: finalLines.length * approxLineHeight,
    lineCount: finalLines.length,
    lines: finalLines,
    fits: fitsLines,
    fontSize: activeFontSize,
    reason: fitsLines ? undefined : 'max_lines_exceeded'
  };
}

/**
 * Applies optional 'shrink' fitting logic to deterministically reduce font size if text overflows.
 */
export function fitText(
  text: string,
  style: TypographyStyle,
  config: TextLayoutConfig
): TextMeasurementResult {
  let currentSize = style.fontSize;
  let measurement = measureText(text, style, config.maxWidth, config.maxLines, currentSize);

  if (config.fit !== 'shrink' || measurement.fits) {
    return measurement;
  }

  const minSize = config.minFontSize ?? 12;
  const step = 2; // Pixel step to shrink down by

  // Downsize loop
  while (!measurement.fits && currentSize > minSize) {
    currentSize -= step;
    if (currentSize < minSize) currentSize = minSize;
    measurement = measureText(text, style, config.maxWidth, config.maxLines, currentSize);
  }

  return measurement;
}
