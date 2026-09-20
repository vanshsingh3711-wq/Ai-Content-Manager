// A DeepPartial utility specifically for tokens, to allow safe overrides
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export interface DesignTokens {
  colors: {
    background: string;
    surface: string;
    surfaceElevated: string;
    surfaceMuted: string;

    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;

    accent: string;
    accentMuted: string;

    success: string;
    warning: string;
    danger: string;
    info: string;

    border: string;
    divider: string;
  };

  spacing: {
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };

  radius: {
    none: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };

  borderWidth: {
    hairline: number;
    thin: number;
    medium: number;
    thick: number;
  };

  opacity: {
    subtle: number;
    muted: number;
    disabled: number;
    overlay: number;
  };

  shadow: {
    none: string;
    sm: string;
    md: string;
    lg: string;
  };

  zIndex: {
    background: number;
    content: number;
    overlay: number;
    foreground: number;
    debug: number;
  };
}
