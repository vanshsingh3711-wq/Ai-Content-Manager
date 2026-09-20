export type TypographyRole = 
  | 'display'
  | 'hero'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodySmall'
  | 'label'
  | 'caption'
  | 'kpi'
  | 'kpiLabel'
  | 'quote';

export type TextAlignment = 'left' | 'center' | 'right';
export type VerticalAlignment = 'top' | 'middle' | 'bottom';
export type TextBackground = 'none' | 'surface' | 'pill' | 'highlight';

export interface TypographyStyle {
  role: TypographyRole;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  colorToken?: string;
  alignment?: TextAlignment;
  maxLines?: number;
}

export interface TextSegment {
  text: string;
  style?: {
    role?: TypographyRole;
    emphasis?: boolean;
    colorToken?: string;
  };
}

export interface TextLayoutConfig {
  role?: TypographyRole; // High-level semantic role (falls back to body)
  
  // Explicit overrides
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
  
  align?: TextAlignment;
  verticalAlign?: VerticalAlignment;
  
  maxLines?: number;
  maxWidth?: number;
  
  fit?: 'none' | 'shrink';
  minFontSize?: number;
  
  background?: TextBackground;
}

export interface TextLine {
  text: string;
  width: number;
}

export interface TextMeasurementResult {
  width: number;
  height: number;
  lineCount: number;
  lines: TextLine[];
  fits: boolean;
  fontSize: number; // The final resolved font size (may differ from input if shrunk)
  reason?: 'max_lines_exceeded' | 'max_width_exceeded';
}
