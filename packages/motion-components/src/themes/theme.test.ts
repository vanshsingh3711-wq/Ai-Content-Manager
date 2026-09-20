import { describe, it, expect } from 'vitest';
import { resolveTheme, premiumDarkTheme, editorialTheme } from './theme.registry';

describe('Theme & Style System', () => {
  it('resolves known themes correctly', () => {
    const theme = resolveTheme('editorial');
    expect(theme.id).toBe('editorial');
    expect(theme.colors.background).toBe(editorialTheme.colors.background);
  });

  it('falls back to premium_dark when an unknown theme is requested', () => {
    const theme = resolveTheme('unknown_theme_123');
    expect(theme.id).toBe('premium_dark');
    expect(theme.colors.background).toBe(premiumDarkTheme.colors.background);
  });

  it('falls back to premium_dark when undefined is requested', () => {
    const theme = resolveTheme();
    expect(theme.id).toBe('premium_dark');
  });

  it('allows safe deterministic overrides without mutating the base theme', () => {
    const overrideColor = '#FF00FF';
    const theme = resolveTheme('premium_dark', {
      colors: {
        background: overrideColor
      }
    });

    expect(theme.colors.background).toBe(overrideColor);
    // Base theme must not be mutated
    expect(premiumDarkTheme.colors.background).not.toBe(overrideColor);
  });

  it('deep merges overrides correctly', () => {
    const theme = resolveTheme('clean_light', {
      colors: {
        accent: '#123456'
      },
      typography: {
        headingScale: 5.0
      }
    });

    expect(theme.colors.accent).toBe('#123456');
    // Ensure sibling properties are preserved
    expect(theme.colors.background).toBeDefined();
    expect(theme.typography.headingScale).toBe(5.0);
    expect(theme.typography.bodyScale).toBeDefined();
  });
});
