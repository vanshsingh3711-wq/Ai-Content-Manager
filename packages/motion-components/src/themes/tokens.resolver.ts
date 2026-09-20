import { VideoTheme } from './theme.types';
import { DesignTokens, DeepPartial } from './tokens.types';
import { CompositionDiagnostic } from '../validation/validation.types';

// Deep merge utility for token overrides
function deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      const sourceKey = key as keyof DeepPartial<T>;
      const targetKey = key as keyof T;
      
      if (isObject(source[sourceKey])) {
        if (!(targetKey in target)) {
          Object.assign(output, { [key]: source[sourceKey] });
        } else {
          output[targetKey] = deepMerge(target[targetKey] as any, source[sourceKey] as any);
        }
      } else if (source[sourceKey] !== undefined) {
        Object.assign(output, { [key]: source[sourceKey] });
      }
    });
  }
  return output;
}

function isObject(item: any): boolean {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deterministically resolves a theme into a full set of strict Design Tokens.
 * This separates visual primitives from high-level visual identity mapping.
 */
export function resolveDesignTokens(theme: VideoTheme, overrides?: DeepPartial<DesignTokens>): DesignTokens {
  
  const baseTokens: DesignTokens = {
    colors: {
      background: theme.colors.background,
      surface: theme.colors.surface,
      surfaceElevated: theme.colors.surfaceSecondary,
      surfaceMuted: theme.colors.surfaceSecondary,
      
      textPrimary: theme.colors.textPrimary,
      textSecondary: theme.colors.textSecondary,
      textMuted: theme.colors.textMuted,
      textInverse: theme.colors.background, // Naive inverse for now, sufficient for most overlays
      
      accent: theme.colors.accent,
      accentMuted: theme.colors.accentSecondary,
      
      success: theme.colors.success,
      warning: theme.colors.warning,
      danger: theme.colors.danger,
      info: theme.colors.info,
      
      border: theme.colors.border,
      divider: theme.colors.border,
    },

    spacing: {
      xxs: theme.spacing.xs / 2,
      xs: theme.spacing.xs,
      sm: theme.spacing.sm,
      md: theme.spacing.md,
      lg: theme.spacing.lg,
      xl: theme.spacing.xl,
      xxl: theme.spacing.xl * 1.5,
    },

    radius: {
      none: 0,
      sm: theme.radius.sm,
      md: theme.radius.md,
      lg: theme.radius.lg,
      xl: theme.radius.lg * 1.5,
      pill: theme.radius.pill,
    },

    borderWidth: {
      hairline: 1,
      thin: 2,
      medium: 4,
      thick: 8,
    },

    opacity: {
      subtle: 0.1,
      muted: 0.5,
      disabled: 0.3,
      overlay: 0.8,
    },

    shadow: {
      none: 'none',
      sm: `0 1px 2px ${theme.colors.shadow}`,
      md: `0 4px 6px ${theme.colors.shadow}`,
      lg: `0 10px ${theme.effects.blurIntensity}px ${theme.colors.shadow}`,
    },

    zIndex: {
      background: -1,
      content: 0,
      overlay: 10,
      foreground: 20,
      debug: 9999,
    }
  };

  if (overrides) {
    return deepMerge(baseTokens, overrides);
  }

  return baseTokens;
}

/**
 * Validates design tokens for logical correctness.
 * Returns an array of diagnostics. Empty if valid.
 */
export function validateDesignTokens(tokens: DesignTokens): CompositionDiagnostic[] {
  const diagnostics: CompositionDiagnostic[] = [];

  // Check required colors
  if (!tokens.colors || !tokens.colors.background || !tokens.colors.surface) {
    diagnostics.push({
      type: 'token-missing-color',
      severity: 'error',
      message: 'Design tokens must include required background and surface colors.'
    });
  }

  // Check spacing for negative values
  if (tokens.spacing) {
    for (const [key, val] of Object.entries(tokens.spacing)) {
      if (typeof val === 'number' && val < 0) {
        diagnostics.push({
          type: 'token-invalid-spacing',
          severity: 'error',
          message: `Spacing token '${key}' cannot be negative (value: ${val}).`
        });
      }
    }
  }

  // Check opacity for 0-1 range
  if (tokens.opacity) {
    for (const [key, val] of Object.entries(tokens.opacity)) {
      if (typeof val === 'number' && (val < 0 || val > 1)) {
        diagnostics.push({
          type: 'token-invalid-opacity',
          severity: 'error',
          message: `Opacity token '${key}' must be between 0 and 1 (value: ${val}).`
        });
      }
    }
  }

  return diagnostics;
}
