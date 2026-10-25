import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate } from 'remotion';
import { FONT, useExitFade } from '../shared';

export interface PipelineStage {
  num?: number | string;
  badge?: string;
  title: string;
  desc?: string;
  metric?: string;
  icon?: string;
  color?: string;
}

export interface ArchitecturePipelineProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  stages?: PipelineStage[];
  // Individual stage props for blueprint compatibility
  stage1Title?: string;
  stage1Desc?: string;
  stage1Badge?: string;
  stage1Metric?: string;
  stage2Title?: string;
  stage2Desc?: string;
  stage2Badge?: string;
  stage2Metric?: string;
  stage3Title?: string;
  stage3Desc?: string;
  stage3Badge?: string;
  stage3Metric?: string;
  stage4Title?: string;
  stage4Desc?: string;
  stage4Badge?: string;
  stage4Metric?: string;
  accentColor?: string;
  colorTheme?: string;
  [key: string]: any;
}

const DEFAULT_STAGES: PipelineStage[] = [
  {
    num: '01',
    badge: 'INGEST',
    title: 'Multimodal Telemetry',
    desc: 'Parallel ingestion of streaming logs, user signals, and system metrics.',
    metric: '100K EVT/S',
    icon: '⚡',
    color: '#38BDF8',
  },
  {
    num: '02',
    badge: 'EMBED & RAG',
    title: 'Vector Knowledge Core',
    desc: 'Dense hybrid retrieval anchoring contextual relevance with sub-millisecond lookups.',
    metric: '4.2ms LATENCY',
    icon: '🧠',
    color: '#818CF8',
  },
  {
    num: '03',
    badge: 'REASONING',
    title: 'Recursive Agent Loop',
    desc: 'Autonomous multi-hop hypothesis testing and self-correcting tool execution.',
    metric: '99.4% RELIABILITY',
    icon: '🔄',
    color: '#34D399',
  },
  {
    num: '04',
    badge: 'VERIFY',
    title: 'Deterministic Gate',
    desc: 'Zero-regression assertion barrier validating compliance prior to production release.',
    metric: '100% AUDIT PASS',
    icon: '🛡️',
    color: '#F59E0B',
  },
];

export const ArchitecturePipeline: React.FC<ArchitecturePipelineProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width = 1920, height = 1080 } = useVideoConfig();
  const exit = useExitFade(durationInFrames);

  const isVertical = height > width;

  // Extract Title & Subtitle
  const title =
    props.title ||
    props.headline ||
    props.header ||
    'AUTONOMOUS REASONING ARCHITECTURE';

  const subtitle =
    props.subtitle ||
    props.subtext ||
    props.supporting ||
    'END-TO-END DATA FLOW & VERIFICATION ENGINE';

  const badge =
    props.badge ||
    props.tag ||
    props.category ||
    '⚡ SYSTEM ARCHITECTURE';

  // Extract Stages from array or individual props
  let stages: PipelineStage[] = [];
  if (Array.isArray(props.stages) && props.stages.length > 0) {
    stages = props.stages;
  } else {
    const raw: PipelineStage[] = [
      {
        num: '01',
        title: props.stage1Title || props.step1Title || props.point1 || '',
        desc: props.stage1Desc || props.step1Desc || '',
        badge: props.stage1Badge || 'INGEST',
        metric: props.stage1Metric || 'ACTIVE',
        color: '#38BDF8',
      },
      {
        num: '02',
        title: props.stage2Title || props.step2Title || props.point2 || '',
        desc: props.stage2Desc || props.step2Desc || '',
        badge: props.stage2Badge || 'TRANSFORM',
        metric: props.stage2Metric || 'STEADY',
        color: '#818CF8',
      },
      {
        num: '03',
        title: props.stage3Title || props.step3Title || props.point3 || '',
        desc: props.stage3Desc || props.step3Desc || '',
        badge: props.stage3Badge || 'REASON',
        metric: props.stage3Metric || 'AUTONOMOUS',
        color: '#34D399',
      },
      {
        num: '04',
        title: props.stage4Title || props.step4Title || props.point4 || '',
        desc: props.stage4Desc || props.step4Desc || '',
        badge: props.stage4Badge || 'VERIFY',
        metric: props.stage4Metric || 'PASSED',
        color: '#F59E0B',
      },
    ].filter((s) => Boolean(s.title && s.title.trim().length > 0));

    stages = raw.length >= 2 ? raw : DEFAULT_STAGES;
  }

  // Accent Theme
  const themeAccent =
    props.accentColor ||
    (props.colorTheme === 'emerald'
      ? '#34D399'
      : props.colorTheme === 'violet'
      ? '#A78BFA'
      : props.colorTheme === 'amber'
      ? '#F59E0B'
      : props.colorTheme === 'rose'
      ? '#FB7185'
      : '#00E5FF');

  // Header Animation
  const headerSpring = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.7, stiffness: 140 },
  });

  // Calculate packet flow progress between consecutive stages (looping after initial entrance)
  const busLoopFrame = frame % 60;
  const packetProgress = interpolate(busLoopFrame, [0, 50], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isVertical ? '48px 32px' : '40px 60px',
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
          padding: isVertical ? '44px 36px' : '48px 56px',
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

        {/* Header Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            transform: `translateY(${(1 - headerSpring) * -20}px)`,
            opacity: headerSpring,
          }}
        >
          {/* Badge Pill with Pulsing Beacon */}
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
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: 3,
                color: themeAccent,
                textTransform: 'uppercase',
              }}
            >
              {badge}
            </span>
          </div>

          {/* System Telemetry Metadata */}
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.45)',
              letterSpacing: 2,
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <span>{stages.length} PIPELINE NODES</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
            <span style={{ color: '#34D399' }}>● ZERO BOTTLENECK</span>
          </div>
        </div>

        {/* Main Title & Subtitle */}
        <div
          style={{
            marginBottom: isVertical ? 28 : 36,
            transform: `translateY(${(1 - headerSpring) * -15}px)`,
            opacity: headerSpring,
          }}
        >
          <h2
            style={{
              fontFamily: FONT.display,
              fontWeight: 900,
              fontSize: isVertical ? 42 : 50,
              lineHeight: 1.15,
              letterSpacing: -0.5,
              color: '#FFFFFF',
              textTransform: 'uppercase',
              margin: '0 0 8px 0',
              textShadow: '0 2px 20px rgba(0,0,0,0.8)',
            }}
          >
            {title}
          </h2>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: isVertical ? 15 : 18,
              color: 'rgba(255, 255, 255, 0.6)',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Divider Conduit Bar */}
        <div
          style={{
            width: '100%',
            height: 1,
            background: 'linear-gradient(to right, rgba(255,255,255,0.02), rgba(255,255,255,0.15), rgba(255,255,255,0.02))',
            marginBottom: isVertical ? 24 : 32,
          }}
        />

        {/* Stages Layout: Horizontal Row on 16:9, Stacked Column on 9:16 */}
        <div
          style={{
            display: 'flex',
            flexDirection: isVertical ? 'column' : 'row',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            gap: isVertical ? 16 : 20,
            position: 'relative',
          }}
        >
          {stages.map((stage, i) => {
            // Staggered Spring Animation per Stage
            const stageDelay = 8 + i * 14;
            const stageSpring = spring({
              frame: frame - stageDelay,
              fps,
              config: { damping: 13, mass: 0.6, stiffness: 150 },
            });

            const isPassed = frame > stageDelay + 10;
            const stageColor = stage.color || themeAccent;

            // Packet pulse position for this segment
            const segStart = stageDelay + 6;
            const segProgress = interpolate(frame, [segStart, segStart + 16], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });

            return (
              <React.Fragment key={i}>
                {/* Stage Glass Card */}
                <div
                  style={{
                    flex: 1,
                    background: 'rgba(18, 18, 26, 0.75)',
                    borderRadius: 18,
                    padding: isVertical ? '20px 24px' : '28px 24px',
                    border: `1px solid ${isPassed ? `${stageColor}44` : 'rgba(255, 255, 255, 0.08)'}`,
                    boxShadow: isPassed
                      ? `0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px ${stageColor}10`
                      : '0 8px 24px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    transform: isVertical
                      ? `translateX(${(1 - stageSpring) * -30}px)`
                      : `translateY(${(1 - stageSpring) * 30}px)`,
                    opacity: stageSpring,
                    transition: 'border 0.3s ease',
                  }}
                >
                  {/* Active Top Glow Line for this Card */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: isPassed
                        ? `linear-gradient(to right, transparent, ${stageColor}, transparent)`
                        : 'transparent',
                      boxShadow: isPassed ? `0 0 12px ${stageColor}` : 'none',
                    }}
                  />

                  {/* Card Header: Stage Number & Badge */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 14,
                      }}
                    >
                      {/* Step Number Circle/Pill */}
                      <div
                        style={{
                          fontFamily: FONT.mono,
                          fontSize: 16,
                          fontWeight: 900,
                          color: isPassed ? stageColor : 'rgba(255, 255, 255, 0.4)',
                          background: `${stageColor}18`,
                          border: `1px solid ${isPassed ? stageColor : 'rgba(255, 255, 255, 0.1)'}`,
                          borderRadius: 8,
                          padding: '4px 10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span>{stage.num || `0${i + 1}`}</span>
                      </div>

                      {/* Micro Badge */}
                      <div
                        style={{
                          fontFamily: FONT.mono,
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: 2,
                          color: isPassed ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                          textTransform: 'uppercase',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 6,
                          padding: '4px 10px',
                        }}
                      >
                        {stage.badge || `PHASE 0${i + 1}`}
                      </div>
                    </div>

                    {/* Stage Title */}
                    <h3
                      style={{
                        fontFamily: FONT.display,
                        fontWeight: 800,
                        fontSize: isVertical ? 22 : 24,
                        lineHeight: 1.25,
                        color: '#FFFFFF',
                        margin: '0 0 10px 0',
                      }}
                    >
                      {stage.title}
                    </h3>

                    {/* Stage Description */}
                    {stage.desc && (
                      <p
                        style={{
                          fontFamily: FONT.body,
                          fontSize: isVertical ? 15 : 15,
                          lineHeight: 1.45,
                          color: 'rgba(255, 255, 255, 0.65)',
                          margin: '0 0 16px 0',
                        }}
                      >
                        {stage.desc}
                      </p>
                    )}
                  </div>

                  {/* Card Footer: Metric & Status Beacon */}
                  <div
                    style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      paddingTop: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontFamily: FONT.mono,
                      fontSize: 13,
                      letterSpacing: 1.5,
                      color: isPassed ? stageColor : 'rgba(255, 255, 255, 0.35)',
                    }}
                  >
                    <span>{stage.metric || 'NORMAL'}</span>
                    <span style={{ fontSize: 16 }}>{isPassed ? '✓' : '○'}</span>
                  </div>
                </div>

                {/* Animated Connection Conduit between cards (except last) */}
                {i < stages.length - 1 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      width: isVertical ? '100%' : 36,
                      height: isVertical ? 24 : 'auto',
                      flexShrink: 0,
                    }}
                  >
                    {/* Conduit Track Line */}
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.12)',
                        ...(isVertical
                          ? { width: 2, height: '100%', margin: '0 auto' }
                          : { width: '100%', height: 2 }),
                        position: 'relative',
                      }}
                    >
                      {/* Flowing Laser Packet */}
                      <div
                        style={{
                          position: 'absolute',
                          backgroundColor: stageColor,
                          boxShadow: `0 0 10px ${stageColor}, 0 0 18px ${stageColor}`,
                          borderRadius: '50%',
                          ...(isVertical
                            ? {
                                width: 8,
                                height: 8,
                                left: -3,
                                top: `${packetProgress * 100}%`,
                              }
                            : {
                                width: 8,
                                height: 8,
                                top: -3,
                                left: `${packetProgress * 100}%`,
                              }),
                          opacity: isPassed ? 1 : 0,
                        }}
                      />
                    </div>

                    {/* Arrow Glyph */}
                    <div
                      style={{
                        position: 'absolute',
                        color: isPassed ? stageColor : 'rgba(255, 255, 255, 0.2)',
                        fontSize: 16,
                        fontFamily: FONT.mono,
                        fontWeight: 900,
                        userSelect: 'none',
                        ...(isVertical
                          ? { transform: 'rotate(90deg)' }
                          : {}),
                      }}
                    >
                      ▶
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
