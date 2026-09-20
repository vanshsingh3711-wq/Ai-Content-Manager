import { describe, it, expect } from 'vitest';
import { resolveTypography, validateTextLayout } from './typography.resolver';
import { measureText, fitText } from './typography.measure';
import { premiumDarkTheme } from '../themes/theme.registry';
import { resolveDesignTokens } from '../themes/tokens.resolver';

const tokens = resolveDesignTokens(premiumDarkTheme);

describe('Typography System', () => {
  describe('Resolver', () => {
    it('resolves default body role correctly', () => {
      const style = resolveTypography('body', tokens);
      expect(style.role).toBe('body');
      expect(style.fontSize).toBe(tokens.spacing.xl);
      expect(style.fontWeight).toBe(400);
      expect(style.colorToken).toBe(tokens.colors.textPrimary);
    });

    it('resolves hero role with large scale', () => {
      const style = resolveTypography('hero', tokens);
      expect(style.fontSize).toBe(tokens.spacing.xxl);
      expect(style.fontWeight).toBe(700);
    });

    it('applies overrides', () => {
      const style = resolveTypography('heading', tokens, {
        alignment: 'center',
        colorToken: tokens.colors.accent,
      });
      expect(style.alignment).toBe('center');
      expect(style.colorToken).toBe(tokens.colors.accent);
    });
  });

  describe('Validation', () => {
    it('validates correct styles', () => {
      const style = resolveTypography('body', tokens);
      const diags = validateTextLayout(style);
      expect(diags.length).toBe(0);
    });

    it('flags negative font size', () => {
      const style = resolveTypography('body', tokens, { fontSize: -10 });
      const diags = validateTextLayout(style);
      expect(diags.length).toBe(1);
      expect(diags[0].type).toBe('invalid-font-size');
    });
  });

  describe('Measurement & Wrapping', () => {
    const style = resolveTypography('body', tokens);
    
    it('measures single line without max width', () => {
      const text = "Hello World";
      const result = measureText(text, style);
      expect(result.lineCount).toBe(1);
      expect(result.lines[0].text).toBe(text);
      expect(result.width).toBeGreaterThan(0);
      expect(result.fits).toBe(true);
    });

    it('wraps text when exceeding max width', () => {
      const text = "This is a very long string that should wrap into multiple lines";
      // Force it to wrap by setting a very small max width
      const result = measureText(text, style, 50);
      expect(result.lineCount).toBeGreaterThan(1);
      expect(result.fits).toBe(true);
    });

    it('flags max_lines_exceeded when wrapping produces too many lines', () => {
      const text = "This is a very long string that should wrap into multiple lines";
      const result = measureText(text, style, 50, 2);
      expect(result.lineCount).toBe(2); // Should slice the rest
      expect(result.fits).toBe(false);
      expect(result.reason).toBe('max_lines_exceeded');
    });
  });

  describe('Fitting (Shrink)', () => {
    const style = resolveTypography('body', tokens, { fontSize: 40 });
    
    it('does not shrink if it already fits', () => {
      const text = "Short";
      const result = fitText(text, style, { fit: 'shrink', maxWidth: 1000 });
      expect(result.fontSize).toBe(40);
      expect(result.fits).toBe(true);
    });

    it('shrinks font size to fit constraints deterministically', () => {
      const text = "Very long text that will not fit at size 40 inside a 50px box without exceeding 1 line";
      const result = fitText(text, style, { fit: 'shrink', maxWidth: 50, maxLines: 1, minFontSize: 10 });
      expect(result.fontSize).toBeLessThan(40);
    });

    it('stops shrinking at minFontSize', () => {
      const text = "Incredibly long text".repeat(10);
      const result = fitText(text, style, { fit: 'shrink', maxWidth: 10, maxLines: 1, minFontSize: 20 });
      expect(result.fontSize).toBe(20);
      expect(result.fits).toBe(false); // Still doesn't fit even at min size
    });
  });
});
