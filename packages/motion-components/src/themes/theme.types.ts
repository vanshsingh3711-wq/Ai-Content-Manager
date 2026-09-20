// Utility type for deep partial overrides
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export interface VideoTheme {
  id: string;
  name: string;

  colors: {
    background: string;
    surface: string;
    surfaceSecondary: string;

    textPrimary: string;
    textSecondary: string;
    textMuted: string;

    accent: string;
    accentSecondary: string;

    success: string;
    warning: string;
    danger: string;
    info: string;

    border: string;
    shadow: string;
  };

  typography: {
    fontFamily: string;
    headingWeight: string | number;
    bodyWeight: string | number;
    labelWeight: string | number;

    headingScale: number;
    bodyScale: number;
    labelScale: number;
  };

  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };

  radius: {
    sm: number;
    md: number;
    lg: number;
    pill: number;
  };

  effects: {
    shadowIntensity: number;
    blurIntensity: number;
  };

  style: {
    density: 'compact' | 'comfortable' | 'spacious';
    contrast: 'low' | 'medium' | 'high';
    visualStyle: string;
  };
}
