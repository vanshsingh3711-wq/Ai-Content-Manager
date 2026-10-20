import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { AppScreenUpload } from './AppScreenUpload';

let currentFrameMock = 0;
const videoConfigMock = {
  fps: 30,
  durationInFrames: 100,
  width: 1080,
  height: 1920,
};

vi.mock('remotion', () => ({
  AbsoluteFill: ({ children, style }: any) => <div data-testid="absolute-fill" style={style}>{children}</div>,
  useCurrentFrame: () => currentFrameMock,
  useVideoConfig: () => videoConfigMock,
  interpolate: (frame: number, inputRange: number[], outputRange: number[]) => {
    const [inMin, inMax] = inputRange;
    const [outMin, outMax] = outputRange;
    if (frame <= inMin) return outMin;
    if (frame >= inMax) return outMax;
    const ratio = (frame - inMin) / (inMax - inMin);
    return outMin + ratio * (outMax - outMin);
  },
  spring: ({ frame }: any) => (frame > 0 ? 1 : 0),
}));

describe('AppScreenUpload Remotion Composition', () => {
  beforeEach(() => {
    currentFrameMock = 0;
  });

  it('renders initial uploading state correctly with default props', () => {
    currentFrameMock = 10;
    const { getByText } = render(
      <AppScreenUpload
        title="VIDEO UPLOAD"
        appName="Video Studio Pro"
        fileName="demo_reel.mp4"
        fileSize="64.0 MB"
      />
    );

    expect(getByText('VIDEO UPLOAD')).toBeDefined();
    expect(getByText('Video Studio Pro')).toBeDefined();
    expect(getByText('demo_reel.mp4')).toBeDefined();
    expect(getByText('64.0 MB')).toBeDefined();
    expect(getByText('Uploading to cloud...')).toBeDefined();
  });

  it('renders intermediate upload progress dynamically', () => {
    // upload starts at frame 10, ends at 10 + 65 = 75. At frame 42.5, approx 50%
    currentFrameMock = 43;
    const { getByText } = render(
      <AppScreenUpload
        fileName="render_v2.mp4"
        progress={100}
      />
    );

    expect(getByText(/%/).textContent).toMatch(/5[0-2]%/);
    expect(getByText('Uploading to cloud...')).toBeDefined();
  });

  it('renders completed state with checkmark and READY badge when progress reaches 100%', () => {
    currentFrameMock = 80; // Past frame 75 -> 100% complete
    const { getByText } = render(
      <AppScreenUpload
        title="EXPORT SUCCESS"
        appName="FinalCut Cloud"
        fileName="final_edit.mp4"
        status="Upload Completed Successfully"
      />
    );

    expect(getByText('100%')).toBeDefined();
    expect(getByText('Upload Completed Successfully')).toBeDefined();
    expect(getByText('READY')).toBeDefined();
  });

  it('respects custom static progress values', () => {
    currentFrameMock = 90;
    const { getByText } = render(
      <AppScreenUpload
        fileName="draft_preview.mp4"
        progress={75}
      />
    );

    expect(getByText('75%')).toBeDefined();
  });
});
