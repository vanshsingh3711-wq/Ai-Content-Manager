import { describe, it, expect } from 'vitest';
import { resolveImageMedia } from './image.resolver';
import { ImageMediaConfig } from './image.types';

describe('Image Media Resolver', () => {
  it('returns an error if config is undefined', () => {
    const { resolved, diagnostics } = resolveImageMedia(undefined, 'el-1');
    expect(resolved).toBeUndefined();
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].severity).toBe('error');
    expect(diagnostics[0].message).toContain('missing');
  });

  it('returns an error if src is missing or empty', () => {
    const { resolved, diagnostics } = resolveImageMedia({ src: '' }, 'el-1');
    expect(resolved).toBeUndefined();
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].severity).toBe('error');
    expect(diagnostics[0].message).toContain('empty');
  });

  it('applies explicit defaults for valid minimal config', () => {
    const config: ImageMediaConfig = { src: 'https://example.com/img.png' };
    const { resolved, diagnostics } = resolveImageMedia(config, 'el-1');
    
    expect(diagnostics).toHaveLength(0);
    expect(resolved).toBeDefined();
    expect(resolved?.fit).toBe('contain'); // default
    expect(resolved?.position).toEqual({ x: 0.5, y: 0.5 }); // default
    expect(resolved?.opacity).toBe(1); // default
  });

  it('preserves valid explicit config values', () => {
    const config: ImageMediaConfig = {
      src: 'https://example.com/img.png',
      fit: 'cover',
      position: { x: 0, y: 1 },
      opacity: 0.5,
      alt: 'Test Image',
      metadata: { width: 1920, height: 1080 }
    };
    
    const { resolved, diagnostics } = resolveImageMedia(config, 'el-1');
    expect(diagnostics).toHaveLength(0);
    expect(resolved).toEqual({
      src: 'https://example.com/img.png',
      fit: 'cover',
      position: { x: 0, y: 1 },
      opacity: 0.5,
      alt: 'Test Image',
      metadata: { width: 1920, height: 1080 }
    });
  });

  it('clamps invalid position values and flags warnings', () => {
    const config: ImageMediaConfig = {
      src: 'https://example.com/img.png',
      position: { x: -1, y: 2 }
    };
    
    const { resolved, diagnostics } = resolveImageMedia(config, 'el-1');
    
    expect(resolved?.position).toEqual({ x: 0, y: 1 });
    expect(diagnostics.filter(d => d.severity === 'warning').length).toBe(2);
  });

  it('clamps invalid opacity values and flags warnings', () => {
    const config: ImageMediaConfig = {
      src: 'https://example.com/img.png',
      opacity: 1.5
    };
    
    const { resolved, diagnostics } = resolveImageMedia(config, 'el-1');
    
    expect(resolved?.opacity).toBe(1);
    expect(diagnostics[0].severity).toBe('warning');
    expect(diagnostics[0].message).toContain('opacity');
  });

  it('falls back to contain if fit is invalid', () => {
    const config: ImageMediaConfig = {
      src: 'https://example.com/img.png',
      fit: 'invalid_fit' as any
    };
    
    const { resolved, diagnostics } = resolveImageMedia(config, 'el-1');
    
    expect(resolved?.fit).toBe('contain');
    expect(diagnostics[0].severity).toBe('warning');
    expect(diagnostics[0].message).toContain('fit mode');
  });

  it('flags errors for negative metadata dimensions', () => {
    const config: ImageMediaConfig = {
      src: 'https://example.com/img.png',
      metadata: { width: -100, height: 0 }
    };
    
    const { resolved, diagnostics } = resolveImageMedia(config, 'el-1');
    
    expect(resolved?.metadata?.width).toBe(-100); // we keep it but flag it
    const errorDiagnostics = diagnostics.filter(d => d.severity === 'error');
    expect(errorDiagnostics.length).toBe(2); // one for width, one for height
  });
});
