import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import { EASINGS, COLORS } from '../themes/brandTokens';
import { WebBrowserFrame } from '../devices/WebBrowserFrame';
import { BrandBg, CLAMP } from '../ui/MotionKit';

const DRIFT = 0.02;

export type ScreencastPage = {
  img?: string;
  node?: React.ReactNode;
  url: string;
  tabTitle: string;
  favicon?: React.ReactNode;
  enterAt: number;
  transition?: 'cut' | 'crossfade';
  transitionFrames?: number;
  scroll?: { to: number; range: [number, number]; from?: number };
  zoom?: { from: number; to: number; fx: number; fy: number; range: [number, number] };
  drift?: number;
};

export type CursorKey = { frame: number; x: number; y: number };

export const sampleCursor = (frame: number, keys: CursorKey[]) => {
  if (!keys.length) return { x: 0.5, y: 0.5 };
  if (frame <= keys[0].frame) return { x: keys[0].x, y: keys[0].y };
  const last = keys[keys.length - 1];
  if (frame >= last.frame) return { x: last.x, y: last.y };
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1].frame <= frame) i++;
  const a = keys[i],
    b = keys[i + 1];
  const t = interpolate(frame, [a.frame, b.frame], [0, 1], {
    ...CLAMP,
    easing: EASINGS.easeInOut,
  });
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
};

export const CursorPointer: React.FC<{ size?: number; press?: number }> = ({
  size = 28,
  press = 1,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{
      transform: `scale(${press})`,
      transformOrigin: '16% 10%',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))',
      display: 'block',
    }}
  >
    <path
      d="M4.2 2.6 L4.2 18.9 L8.7 14.7 L11.9 21.6 L14.6 20.3 L11.4 13.6 L17.6 13.6 Z"
      fill="#111318"
      stroke="#ffffff"
      strokeWidth={1.4}
      strokeLinejoin="round"
    />
  </svg>
);

export const Screencast: React.FC<{
  pages: ScreencastPage[];
  cursor?: CursorKey[];
  clicks?: number[];
  box?: { x: number; y: number; w: number; h: number };
  glow?: string;
  appearAt?: number;
  favicon?: React.ReactNode;
}> = ({
  pages,
  cursor = [],
  clicks = [],
  box = { x: 80, y: 44, w: 1760, h: 992 },
  glow = COLORS.accent,
  appearAt = 0,
  favicon,
}) => {
  const frame = useCurrentFrame();

  let activeIdx = 0;
  for (let i = 0; i < pages.length; i++) {
    if (frame >= pages[i].enterAt) activeIdx = i;
  }
  const curPage = pages[activeIdx];
  const cursorPos = sampleCursor(frame, cursor);

  // Check clicks for pulse animation
  let clickScale = 1;
  let clickRipple = 0;
  for (const c of clicks) {
    if (frame >= c && frame < c + 14) {
      clickScale = interpolate(frame, [c, c + 3, c + 8], [1, 0.85, 1], CLAMP);
      clickRipple = interpolate(frame, [c, c + 14], [0, 1], CLAMP);
    }
  }

  // Viewport dimensions
  const viewW = box.w;
  const viewH = box.h - (46 + 56);

  return (
    <AbsoluteFill>
      <BrandBg glow={glow} />
      <WebBrowserFrame
        url={curPage?.url || 'https://localhost:3000'}
        tabTitle={curPage?.tabTitle || 'Demo'}
        box={box}
        appearAt={appearAt}
        favicon={favicon}
      >
        <div style={{ position: 'relative', width: viewW, height: viewH }}>
          {pages.map((p, idx) => {
            const isTop = idx === activeIdx;
            if (!isTop && frame >= p.enterAt) return null;
            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: isTop ? 'block' : 'none',
                }}
              >
                {p.node ? (
                  p.node
                ) : p.img ? (
                  <Img src={p.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : null}
              </div>
            );
          })}

          {/* Animated Cursor */}
          {cursor.length > 0 && (
            <div
              style={{
                position: 'absolute',
                left: cursorPos.x * viewW,
                top: cursorPos.y * viewH,
                pointerEvents: 'none',
                zIndex: 99,
              }}
            >
              <CursorPointer press={clickScale} />
              {clickRipple > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: 2,
                    width: 32 * clickRipple,
                    height: 32 * clickRipple,
                    borderRadius: '50%',
                    border: `2px solid ${COLORS.accent}`,
                    opacity: 1 - clickRipple,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              )}
            </div>
          )}
        </div>
      </WebBrowserFrame>
    </AbsoluteFill>
  );
};
