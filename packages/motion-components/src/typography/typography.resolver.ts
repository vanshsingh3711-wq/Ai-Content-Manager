import { TypographyRole, TypographyStyle } from './typography.types';
import { DesignTokens } from '../themes/tokens.types';
import { CompositionDiagnostic } from '../validation/validation.types';

export function resolveTypography(
  role: TypographyRole | undefined,
  tokens: DesignTokens,
  overrides?: Partial<TypographyStyle>
): TypographyStyle {
  // Base default is standard body text
  let style: TypographyStyle = {
    role: role || 'body',
    fontFamily: 'sans-serif',
    fontSize: tokens.spacing.md * 2, // 24 * 2 = 48px
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: 0,
    colorToken: tokens.colors.textPrimary,
    alignment: 'left',
  };

  // Map roles to tokens/scales
  switch (role) {
    case 'display':
      style = {
        ...style,
        fontSize: tokens.spacing.xxl * 2, // 96 * 2 = 192px
        fontWeight: 800,
        lineHeight: 1.1,
        letterSpacing: -0.02,
      };
      break;
    case 'hero':
      style = {
        ...style,
        fontSize: tokens.spacing.xxl * 1.25, // 96 * 1.25 = 120px
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: -0.01,
      };
      break;
    case 'heading':
      style = {
        ...style,
        fontSize: tokens.spacing.xl * 1.5, // 64 * 1.5 = 96px
        fontWeight: 600,
        lineHeight: 1.3,
      };
      break;
    case 'subheading':
      style = {
        ...style,
        fontSize: tokens.spacing.lg * 1.5, // 48 * 1.5 = 72px
        fontWeight: 500,
        lineHeight: 1.4,
        colorToken: tokens.colors.textSecondary,
      };
      break;
    case 'body':
      style = {
        ...style,
        fontSize: tokens.spacing.md * 2, // 48px
        fontWeight: 400,
        lineHeight: 1.5,
      };
      break;
    case 'bodySmall':
      style = {
        ...style,
        fontSize: tokens.spacing.sm,
        fontWeight: 400,
        lineHeight: 1.5,
        colorToken: tokens.colors.textSecondary,
      };
      break;
    case 'label':
      style = {
        ...style,
        fontSize: tokens.spacing.sm * 2.5, // 16 * 2.5 = 40px
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: 0.05,
        textTransform: 'uppercase',
      };
      break;
    case 'caption':
      style = {
        ...style,
        fontSize: tokens.spacing.xs,
        fontWeight: 400,
        lineHeight: 1.4,
        colorToken: tokens.colors.textMuted,
      };
      break;
    case 'kpi':
      style = {
        ...style,
        fontSize: tokens.spacing.xxl * 1.2,
        fontWeight: 700,
        lineHeight: 1,
        colorToken: tokens.colors.textPrimary,
      };
      break;
    case 'kpiLabel':
      style = {
        ...style,
        fontSize: tokens.spacing.sm,
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: 0.05,
        textTransform: 'uppercase',
        colorToken: tokens.colors.textSecondary,
      };
      break;
    case 'quote':
      style = {
        ...style,
        fontSize: tokens.spacing.lg,
        fontWeight: 400,
        lineHeight: 1.6,
        colorToken: tokens.colors.textSecondary,
        fontFamily: 'serif', // Simple default differentiation
      };
      break;
  }

  // Apply explicit overrides
  if (overrides) {
    style = { ...style, ...overrides };
  }

  return style;
}

export function validateTextLayout(style: TypographyStyle): CompositionDiagnostic[] {
  const diagnostics: CompositionDiagnostic[] = [];

  if (style.fontSize <= 0) {
    diagnostics.push({
      type: 'invalid-font-size',
      severity: 'error',
      message: `Font size must be greater than 0, got ${style.fontSize}`
    });
  }

  if (style.lineHeight <= 0) {
    diagnostics.push({
      type: 'invalid-line-height',
      severity: 'error',
      message: `Line height must be greater than 0, got ${style.lineHeight}`
    });
  }

  return diagnostics;
}
