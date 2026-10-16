import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  Img,
  useCurrentFrame,
} from 'remotion';
import {
  Mic,
  Plus,
  Slash,
  Zap,
  ArrowUp,
  Square,
  Check,
  Search,
  LayoutGrid,
  Folder,
  Settings,
  FileText,
  Braces,
  Image as ImageIcon,
  Info,
  MoreHorizontal,
  Files,
  GitBranch,
  Play,
} from 'lucide-react';
import {
  COLORS,
  EASINGS,
  RADIUS,
  SHADOW,
  FONT_DISPLAY,
  FONT_BODY,
  FONT_MONO,
  FONT_SERIF,
} from '../themes/brandTokens';

export const CLAMP = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

// Brand backdrop: paper + soft color glow + faint dotted grid
export const BrandBg: React.FC<{ glow?: string }> = ({ glow = COLORS.accent }) => (
  <>
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }} />
    <AbsoluteFill
      style={{
        background: `radial-gradient(1300px 700px at 50% -12%, ${glow}22, transparent 60%)`,
      }}
    />
    <AbsoluteFill
      style={{
        backgroundImage: `radial-gradient(${COLORS.line} 1.5px, transparent 1.5px)`,
        backgroundSize: '46px 46px',
        opacity: 0.45,
      }}
    />
  </>
);

// rise-in (fade + translateY) driven by frame
export const useRise = () => {
  const frame = useCurrentFrame();
  return (start: number, dist = 24, dur = 14) => ({
    opacity: interpolate(frame, [start, start + dur], [0, 1], {
      ...CLAMP,
      easing: EASINGS.easeOut,
    }),
    transform: `translateY(${interpolate(
      frame,
      [start, start + dur],
      [dist, 0],
      { ...CLAMP, easing: EASINGS.easeOut }
    )}px)`,
  });
};

export const CC = {
  bg: '#1c1b19',
  input: '#242220',
  border: '#38342e',
  coral: '#cd8064',
  coralSend: '#c8785b',
  text: '#ebe8e3',
  muted: '#8f8981',
  faint: '#6d675f',
} as const;

export const Sunburst: React.FC<{ size: number; color?: string }> = ({
  size,
  color = CC.coral,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      fill={color}
      d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"
    />
  </svg>
);

// Level / Chapter Title Card
export const LevelTitleShot: React.FC<{
  n: string;
  title: string;
  subtitle: string;
  color?: string;
}> = ({ n, title, subtitle, color = COLORS.accent }) => {
  const rise = useRise();
  return (
    <AbsoluteFill style={{ fontFamily: FONT_BODY }}>
      <BrandBg glow={color} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            ...rise(4, 16),
            fontFamily: FONT_MONO,
            fontSize: 28,
            letterSpacing: 6,
            color,
            marginBottom: 16,
          }}
        >
          CHAPTER
        </div>
        <div
          style={{
            ...rise(8),
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 280,
            lineHeight: 0.9,
            color,
            margin: 0,
          }}
        >
          {n}
        </div>
        <div
          style={{
            ...rise(16),
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 84,
            color: COLORS.ink,
            marginTop: 6,
          }}
        >
          {title}
        </div>
        <div
          style={{
            ...rise(24),
            fontSize: 34,
            color: COLORS.muted,
            marginTop: 16,
          }}
        >
          {subtitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Stat Card / Badge (e.g. for finance/growth highlights)
export const StatCard: React.FC<{
  stat: string;
  label: string;
  delta?: string;
  appearAt?: number;
  box?: { x: number; y: number; w?: number };
}> = ({ stat, label, delta, appearAt = 0, box = { x: 80, y: 80, w: 420 } }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [appearAt, appearAt + 12], [0, 1], CLAMP);
  const y = interpolate(frame, [appearAt, appearAt + 14], [20, 0], CLAMP);

  return (
    <div
      style={{
        position: 'absolute',
        left: box.x,
        top: box.y,
        width: box.w,
        background: '#ffffff',
        border: `1px solid ${COLORS.line}`,
        borderRadius: RADIUS.card,
        boxShadow: SHADOW.card,
        padding: '24px 30px',
        opacity: op,
        transform: `translateY(${y}px)`,
        fontFamily: FONT_BODY,
      }}
    >
      <div style={{ fontSize: 18, color: COLORS.muted, fontWeight: 500, marginBottom: 8 }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: 54,
          color: COLORS.ink,
          lineHeight: 1.1,
        }}
      >
        {stat}
      </div>
      {delta && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 12,
            background: `${COLORS.signal}18`,
            color: '#1e786b',
            borderRadius: RADIUS.pill,
            padding: '4px 12px',
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {delta}
        </div>
      )}
    </div>
  );
};

// VS Code theme colors and dimensions
export const V = {
  chrome: '#181818',
  editor: '#1e1e1e',
  sidebar: '#181818',
  border: '#2b2b2b',
  text: '#cccccc',
  dim: '#8b8b8b',
  faint: '#6e6e6e',
  blue: '#3794ff',
  green: '#4ec98f',
  coral: '#cd8064',
  input: '#242424',
  inputBorder: '#3a3a3a',
} as const;

export const VSC = {
  TITLE_H: 44,
  ACT_W: 54,
  SB_X: 54,
  SB_W: 372,
  ED_X: 426,
  ED_W: 1494,
  ED_CX: 426 + 747,
} as const;
