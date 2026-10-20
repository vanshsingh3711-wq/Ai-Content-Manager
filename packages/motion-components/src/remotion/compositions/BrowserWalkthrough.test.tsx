import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserWalkthrough } from './BrowserWalkthrough';

vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style }: any) => <div data-testid="absolute-fill" style={style}>{children}</div>,
  Img: ({ src, alt, style }: any) => <img data-testid="remotion-img" src={src} alt={alt} style={style} />,
  useCurrentFrame: () => 15,
  useVideoConfig: () => ({ fps: 30, durationInFrames: 120, width: 1080, height: 1920 }),
  interpolate: (f: number) => 1,
  spring: () => 1,
}));

describe('BrowserWalkthrough Remotion Composition', () => {
  it('renders with screenshot image when screenshotUrl is provided', () => {
    const { getByText, getByTestId } = render(
      <BrowserWalkthrough
        url="https://techcrunch.com/article"
        tabTitle="TechCrunch Article"
        highlightText="AI Video Launch"
        screenshotUrl="https://example.com/screenshot.png"
      />
    );

    expect(getByText('TechCrunch Article')).toBeDefined();
    expect(getByText('https://techcrunch.com/article')).toBeDefined();
    expect(getByText('LIVE WEB')).toBeDefined();
    expect(getByText('AI Video Launch')).toBeDefined();

    const img = getByTestId('remotion-img') as HTMLImageElement;
    expect(img).toBeDefined();
    expect(img.src).toBe('https://example.com/screenshot.png');
  });

  it('renders wireframe placeholder fallback when screenshotUrl is omitted', () => {
    const { getByText, getAllByText, queryByTestId } = render(
      <BrowserWalkthrough
        url="https://docs.saas.io/api"
        tabTitle="SaaS API Docs"
      />
    );

    expect(getAllByText('SaaS API Docs').length).toBeGreaterThanOrEqual(1);
    expect(getByText('https://docs.saas.io/api')).toBeDefined();
    expect(queryByTestId('remotion-img')).toBeNull();
  });
});
