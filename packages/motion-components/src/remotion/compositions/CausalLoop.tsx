import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate } from 'remotion';
import { FONT, useExitFade } from '../shared';

export interface CausalNode {
  num?: string | number;
  stageBadge?: string;
  title: string;
  desc?: string;
  metric?: string;
  icon?: string;
  color?: string;
}

export interface CausalLoopProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  loopType?: 'reinforcing' | 'vicious' | 'balancing';
  centerLabel?: string;
  centerSub?: string;
  synthesis?: string;
  // Node props
  node1Title?: string;
  node1Desc?: string;
  node1Badge?: string;
  node1Metric?: string;
  node2Title?: string;
  node2Desc?: string;
  node2Badge?: string;
  node2Metric?: string;
  node3Title?: string;
  node3Desc?: string;
  node3Badge?: string;
  node3Metric?: string;
  node4Title?: string;
  node4Desc?: string;
  node4Badge?: string;
  node4Metric?: string;
  nodes?: CausalNode[];
  accentColor?: string;
  colorTheme?: string;
  [key: string]: any;
}

const DEFAULT_NODES: CausalNode[] = [
  {
    num: '01',
    stageBadge: 'TRIGGER CAUSE',
    title: 'Aggressive Capital Injection',
    desc: 'Unprecedented stimulus liquidity floods market sectors.',
    metric: '+$5.2T EXPANSION',
    color: '#38BDF8',
  },
  {
    num: '02',
    stageBadge: 'AMPLIFICATION',
    title: 'Asset Price Inflation',
    desc: 'Equities and real estate valuations decouple from fundamentals.',
    metric: '+48% RUN-UP',
    color: '#818CF8',
  },
  {
    num: '03',
    stageBadge: 'SECONDARY SHOCK',
    title: 'Aggressive Rate Hikes',
    desc: 'Central banks overtighten into overleveraged balance sheets.',
    metric: '+525 BPS SURGE',
    color: '#F43F5E',
  },
  {
    num: '04',
    stageBadge: 'FEEDBACK CLOSURE',
    title: 'Cascading Liquidity Crunch',
    desc: 'Forced deleveraging triggers emergency bailout demands.',
    metric: 'CYCLE RE-IGNITED',
    color: '#F59E0B',
  },
];

export const CausalLoop: React.FC<CausalLoopProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width = 1920, height = 1080 } = useVideoConfig();
  const exit = useExitFade(durationInFrames);

  const isVertical = height > width;

  // Header Titles
  const title =
    props.title ||
    props.headline ||
    props.header ||
    'THE SYSTEMIC FEEDBACK LOOP';

  const subtitle =
    props.subtitle ||
    props.subtext ||
    props.supporting ||
    'HOW TRIGGER ACTIONS AMPLIFY CASCADING SECOND-ORDER CONSEQUENCES';

  const loopType = props.loopType || (props.title?.toLowerCase().includes('trap') || props.title?.toLowerCase().includes('death') || props.title?.toLowerCase().includes('collapse') ? 'vicious' : 'reinforcing');

  const defaultBadge =
    loopType === 'vicious'
      ? '⚠️ VICIOUS COLLAPSE SPIRAL (-)'
      : loopType === 'balancing'
      ? '⚖️ BALANCING EQUILIBRIUM'
      : '🔄 REINFORCING FLYWHEEL (+)';

  const badge = props.badge || props.tag || defaultBadge;

  const centerLabel =
    props.centerLabel ||
    (loopType === 'vicious'
      ? 'VICIOUS CYCLE'
      : loopType === 'balancing'
      ? 'EQUILIBRIUM'
      : 'REINFORCING LOOP');

  const centerSub =
    props.centerSub ||
    (loopType === 'vicious'
      ? 'AMPLIFYING LOSS'
      : 'COMPOUNDING DRIFT');

  const synthesis =
    props.synthesis ||
    props.verdict ||
    'Each phase intensifies the subsequent shock, locking the architecture into an accelerating trajectory.';

  // Nodes Extraction
  let nodes: CausalNode[] = [];
  if (Array.isArray(props.nodes) && props.nodes.length > 0) {
    nodes = props.nodes;
  } else {
    const raw: CausalNode[] = [
      {
        num: '01',
        title: props.node1Title || props.step1Title || props.point1 || '',
        desc: props.node1Desc || props.step1Desc || '',
        stageBadge: props.node1Badge || 'TRIGGER',
        metric: props.node1Metric || 'ACTIVE',
        color: '#38BDF8',
      },
      {
        num: '02',
        title: props.node2Title || props.step2Title || props.point2 || '',
        desc: props.node2Desc || props.step2Desc || '',
        stageBadge: props.node2Badge || 'ACCELERATE',
        metric: props.node2Metric || 'COMPOUNDING',
        color: '#818CF8',
      },
      {
        num: '03',
        title: props.node3Title || props.step3Title || props.point3 || '',
        desc: props.node3Desc || props.step3Desc || '',
        stageBadge: props.node3Badge || 'PRESSURE',
        metric: props.node3Metric || 'CRITICAL',
        color: loopType === 'vicious' ? '#F43F5E' : '#34D399',
      },
      {
        num: '04',
        title: props.node4Title || props.step4Title || props.point4 || '',
        desc: props.node4Desc || props.step4Desc || '',
        stageBadge: props.node4Badge || 'FEEDBACK',
        metric: props.node4Metric || 'LOOP COMPLETE',
        color: '#F59E0B',
      },
    ].filter((n) => Boolean(n.title && n.title.trim().length > 0));

    nodes = raw.length >= 2 ? raw : DEFAULT_NODES;
  }

  // Accent Colors
  const themeAccent =
    props.accentColor ||
    (loopType === 'vicious'
      ? '#F43F5E'
      : props.colorTheme === 'emerald'
      ? '#34D399'
      : props.colorTheme === 'amber'
      ? '#F59E0B'
      : '#00E5FF');

  // Entrance spring
  const headerSpring = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.7, stiffness: 140 },
  });

  // Center core rotation (smooth constant rotation)
  const rotationDeg = (frame * 1.2) % 360;

  // Pulse wave animation around the 4 stages
  const cycleFrame = frame % 72;
  const activeSector = Math.floor(cycleFrame / 18); // 0, 1, 2, 3

  return (
    <AbsoluteFill
      style={{
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isVertical ? '48px 30px' : '36px 60px',
        ...exit,
      }}
    >
      {/* Obsidian Glass Canvas */}
      <div
        style={{
          width: '100%',
          maxWidth: isVertical ? 980 : 1720,
          background: 'rgba(8, 8, 12, 0.95)',
          backdropFilter: 'blur(32px)',
          borderRadius: 24,
          padding: isVertical ? '40px 32px' : '44px 54px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: `0 30px 80px rgba(0, 0, 0, 0.95), 0 0 50px ${themeAccent}18, inset 0 1px 1px rgba(255, 255, 255, 0.15)`,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top Ambient Glow Line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            right: '10%',
            height: 2,
            background: `linear-gradient(to right, transparent, ${themeAccent}, transparent)`,
            boxShadow: `0 0 20px ${themeAccent}`,
          }}
        />

        {/* Top Header Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
            transform: `translateY(${(1 - headerSpring) * -20}px)`,
            opacity: headerSpring,
          }}
        >
          {/* Badge Pill with Beacon */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 16px',
              borderRadius: 999,
              background: `${themeAccent}18`,
              border: `1px solid ${themeAccent}44`,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: themeAccent,
                boxShadow: `0 0 10px ${themeAccent}`,
                display: 'inline-block',
                transform: `scale(${1 + Math.sin(frame * 0.2) * 0.2})`,
              }}
            />
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: 3,
                color: themeAccent,
                textTransform: 'uppercase',
              }}
            >
              {badge}
            </span>
          </div>

          {/* Telemetry Indicator */}
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.45)',
              letterSpacing: 2,
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span>CLOSED-LOOP SYSTEM</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
            <span style={{ color: themeAccent }}>● SELF-AMPLIFYING</span>
          </div>
        </div>

        {/* Main Title & Subtitle */}
        <div
          style={{
            marginBottom: isVertical ? 22 : 28,
            transform: `translateY(${(1 - headerSpring) * -15}px)`,
            opacity: headerSpring,
          }}
        >
          <h2
            style={{
              fontFamily: FONT.display,
              fontWeight: 900,
              fontSize: isVertical ? 38 : 46,
              lineHeight: 1.15,
              letterSpacing: -0.5,
              color: '#FFFFFF',
              textTransform: 'uppercase',
              margin: '0 0 6px 0',
              textShadow: '0 2px 20px rgba(0,0,0,0.8)',
            }}
          >
            {title}
          </h2>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: isVertical ? 14 : 16,
              color: 'rgba(255, 255, 255, 0.6)',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* 2x2 Causal Grid with Center Hub on 16:9, or Sequential Flow on 9:16 */}
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: isVertical ? '1fr' : '1fr 1fr',
            gap: isVertical ? 14 : 36,
            marginBottom: isVertical ? 20 : 24,
          }}
        >
          {nodes.map((node, i) => {
            const nodeDelay = 6 + i * 12;
            const nodeSpring = spring({
              frame: frame - nodeDelay,
              fps,
              config: { damping: 13, mass: 0.6, stiffness: 140 },
            });

            const isActiveWave = activeSector === i && frame > 45;
            const nodeColor = node.color || themeAccent;

            return (
              <div
                key={i}
                style={{
                  background: 'rgba(18, 18, 26, 0.75)',
                  borderRadius: 18,
                  padding: isVertical ? '18px 20px' : '22px 26px',
                  border: `1px solid ${isActiveWave ? nodeColor : 'rgba(255, 255, 255, 0.08)'}`,
                  boxShadow: isActiveWave
                    ? `0 0 30px ${nodeColor}25, inset 0 0 20px ${nodeColor}10`
                    : '0 8px 24px rgba(0,0,0,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  transform: `scale(${Math.min(1, nodeSpring)}) translateY(${(1 - nodeSpring) * 20}px)`,
                  opacity: nodeSpring,
                  transition: 'border 0.3s ease, box-shadow 0.3s ease',
                }}
              >
                {/* Active Accent Top Indicator */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(to right, transparent, ${nodeColor}, transparent)`,
                    opacity: isActiveWave ? 1 : 0.4,
                  }}
                />

                <div>
                  {/* Step Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: FONT.mono,
                          fontSize: 14,
                          fontWeight: 900,
                          color: nodeColor,
                          background: `${nodeColor}18`,
                          border: `1px solid ${nodeColor}40`,
                          borderRadius: 6,
                          padding: '2px 8px',
                        }}
                      >
                        {node.num || `0${i + 1}`}
                      </span>
                      <span
                        style={{
                          fontFamily: FONT.mono,
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: 2,
                          color: 'rgba(255, 255, 255, 0.5)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {node.stageBadge || `NODE 0${i + 1}`}
                      </span>
                    </div>

                    {/* Metric Tag */}
                    <div
                      style={{
                        fontFamily: FONT.mono,
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: 1.5,
                        color: nodeColor,
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '3px 8px',
                        borderRadius: 6,
                      }}
                    >
                      {node.metric || 'AMPLIFIED'}
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontFamily: FONT.display,
                      fontWeight: 800,
                      fontSize: isVertical ? 20 : 22,
                      lineHeight: 1.25,
                      color: '#FFFFFF',
                      margin: '0 0 6px 0',
                    }}
                  >
                    {node.title}
                  </h3>

                  {/* Description */}
                  {node.desc && (
                    <p
                      style={{
                        fontFamily: FONT.body,
                        fontSize: 14,
                        lineHeight: 1.45,
                        color: 'rgba(255, 255, 255, 0.65)',
                        margin: 0,
                      }}
                    >
                      {node.desc}
                    </p>
                  )}
                </div>

                {/* Flow Direction Indicator */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 6,
                    marginTop: 12,
                    fontFamily: FONT.mono,
                    fontSize: 12,
                    fontWeight: 800,
                    color: isActiveWave ? nodeColor : 'rgba(255, 255, 255, 0.3)',
                    letterSpacing: 1.5,
                  }}
                >
                  <span>{i < 3 ? `AMPLIFIES STAGE 0${i + 2}` : 'RE-INJECTS INTO STAGE 01'}</span>
                  <span>▶</span>
                </div>
              </div>
            );
          })}

          {/* Central Rotating Core Badge (16:9 Landscape Only) */}
          {!isVertical && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 128,
                height: 128,
                borderRadius: '50%',
                background: 'rgba(8, 8, 14, 0.96)',
                border: `1.5px solid ${themeAccent}70`,
                boxShadow: `0 0 35px ${themeAccent}30, inset 0 0 20px ${themeAccent}20`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '6px 8px',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            >
              {/* Rotating Dashed Orbital Ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: -6,
                  borderRadius: '50%',
                  border: `1.5px dashed ${themeAccent}50`,
                  transform: `rotate(${rotationDeg}deg)`,
                }}
              />
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: 1.5,
                  color: themeAccent,
                  textTransform: 'uppercase',
                  marginBottom: 1,
                  lineHeight: 1.2,
                }}
              >
                {centerLabel}
              </span>
              <span
                style={{
                  fontSize: 18,
                  margin: '1px 0',
                }}
              >
                🔄
              </span>
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: 1,
                  color: 'rgba(255, 255, 255, 0.55)',
                  textTransform: 'uppercase',
                  lineHeight: 1.2,
                }}
              >
                {centerSub}
              </span>
            </div>
          )}
        </div>

        {/* Synthesis Takeaway Footer Bar */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontFamily: FONT.mono,
            fontSize: isVertical ? 12 : 14,
            color: 'rgba(255, 255, 255, 0.75)',
          }}
        >
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 6,
              background: `${themeAccent}20`,
              border: `1px solid ${themeAccent}50`,
              color: themeAccent,
              fontWeight: 900,
              fontSize: 11,
              letterSpacing: 2,
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            VERDICT
          </span>
          <span style={{ lineHeight: 1.4 }}>{synthesis}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
