import { describe, it, expect } from 'vitest';
import { resolveDesignTokens, validateDesignTokens } from './tokens.resolver';
import { premiumDarkTheme, cleanLightTheme, editorialTheme } from './theme.registry';

describe('Design Tokens System', () => {
  describe('Resolution', () => {
    it('maps premium_dark correctly', () => {
      const tokens = resolveDesignTokens(premiumDarkTheme);
      expect(tokens.colors.background).toBe(premiumDarkTheme.colors.background);
      expect(tokens.colors.surface).toBe(premiumDarkTheme.colors.surface);
      expect(tokens.spacing.md).toBe(premiumDarkTheme.spacing.md);
      expect(tokens.radius.sm).toBe(premiumDarkTheme.radius.sm);
    });

    it('maps clean_light correctly', () => {
      const tokens = resolveDesignTokens(cleanLightTheme);
      expect(tokens.colors.accent).toBe(cleanLightTheme.colors.accent);
    });

    it('applies overrides without mutating the base theme or tokens', () => {
      const overrideTokens = resolveDesignTokens(editorialTheme, {
        colors: {
          surface: '#111222'
        },
        spacing: {
          xl: 999
        }
      });

      expect(overrideTokens.colors.surface).toBe('#111222');
      expect(overrideTokens.spacing.xl).toBe(999);
      
      // Sibling properties are preserved
      expect(overrideTokens.colors.background).toBe(editorialTheme.colors.background);
      
      // Base theme is not mutated
      expect(editorialTheme.colors.surface).not.toBe('#111222');
    });

    it('produces deterministic output for the same input', () => {
      const tokens1 = resolveDesignTokens(premiumDarkTheme);
      const tokens2 = resolveDesignTokens(premiumDarkTheme);
      
      expect(tokens1).toEqual(tokens2);
    });
  });

  describe('Validation', () => {
    it('passes valid tokens without errors', () => {
      const tokens = resolveDesignTokens(premiumDarkTheme);
      const diagnostics = validateDesignTokens(tokens);
      expect(diagnostics.length).toBe(0);
    });

    it('flags negative spacing', () => {
      const tokens = resolveDesignTokens(premiumDarkTheme, {
        spacing: {
          md: -10
        }
      });
      const diagnostics = validateDesignTokens(tokens);
      expect(diagnostics.length).toBe(1);
      expect(diagnostics[0].type).toBe('token-invalid-spacing');
    });

    it('flags opacity out of range', () => {
      const tokens = resolveDesignTokens(premiumDarkTheme, {
        opacity: {
          muted: 1.5
        }
      });
      const diagnostics = validateDesignTokens(tokens);
      expect(diagnostics.length).toBe(1);
      expect(diagnostics[0].type).toBe('token-invalid-opacity');
    });

    it('flags missing required colors', () => {
      const tokens = resolveDesignTokens(premiumDarkTheme);
      // Forcefully remove surface
      (tokens.colors as any).surface = undefined;
      const diagnostics = validateDesignTokens(tokens);
      expect(diagnostics.length).toBe(1);
      expect(diagnostics[0].type).toBe('token-missing-color');
    });
  });
});
