import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame } from 'remotion';
import { COLORS, FONT, useExitFade } from '../shared';

export interface TodoListProps {
  title?: string;
  badge?: string;
  format?: 'todo' | 'sequence' | 'bullet'; // Checkbox, 01/02/03, or bullet
  point1?: string;
  point2?: string;
  point3?: string;
  point4?: string;
  items?: string[];
  personality?: string;
  colorTheme?: string;
  accentColor?: string;
  [key: string]: any;
}

export const TodoList: React.FC<TodoListProps> = (props) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const exit = useExitFade(durationInFrames);

  // Extract bold header
  const title =
    props.title ||
    props.headline ||
    props.header ||
    'EXECUTION DIRECTIVES';

  const badge =
    props.badge ||
    props.category ||
    props.tag ||
    '📋 SYSTEM CHECKLIST';

  // Extract points list (supporting both array and individual point/step props)
  let rawPoints: string[] = [];
  if (Array.isArray(props.items) && props.items.length > 0) {
    rawPoints = props.items.map(String);
  } else {
    rawPoints = [
      props.point1 || props.step1 || props.item1 || '',
      props.point2 || props.step2 || props.item2 || '',
      props.point3 || props.step3 || props.item3 || '',
      props.point4 || props.step4 || props.item4 || '',
    ].filter((p): p is string => Boolean(p && String(p).trim().length > 0));
  }

  // Fallback points if none provided
  if (rawPoints.length === 0) {
    rawPoints = [
      'Automate Diagnostic Friction Audits',
      'Deploy Scoped Autonomous Agents',
      'Anchor to Deterministic Verification Gates',
    ];
  }

  // Determine format (todo checkbox vs numbered sequence vs bullet)
  let format = props.format;
  if (!format) {
    const hasNumbers = rawPoints.some((p) => /^\d+[\.\)]\s*/.test(p.trim()));
    format = hasNumbers ? 'sequence' : 'todo';
  }

  // Clean point text: if user wants clean display, strip leading "1.", "2." when rendering numbers separately
  const points = rawPoints.map((p) => p.replace(/^\d+[\.\)]\s*/, '').trim());

  // Accent theme
  const themeAccent =
    props.accentColor ||
    (props.colorTheme === 'blue' || props.colorTheme === 'cyan'
      ? '#38bdf8'
      : props.colorTheme === 'emerald' || props.colorTheme === 'green'
      ? '#34d399'
      : props.colorTheme === 'amber' || props.colorTheme === 'yellow'
      ? '#f59e0b'
      : props.colorTheme === 'rose' || props.colorTheme === 'red'
      ? '#f43f5e'
      : '#38bdf8');

  // Compute typewriter schedules per point
  let currentStart = 8; // Header lands, point 1 begins typing at frame 8
  const schedules = points.map((p) => {
    const start = currentStart;
    const dur = Math.min(26, Math.max(14, Math.round(p.length * 0.6)));
    currentStart = start + dur + 6; // 6 frames pause before next point begins
    return { start, dur, end: start + dur };
  });

  return (
    <AbsoluteFill
      style={{
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 60px',
        ...exit,
      }}
    >
      {/* Black Canvas Todo Container */}
      <div
        style={{
          width: '100%',
          maxWidth: 1680,
          background: 'rgba(8, 8, 12, 0.95)',
          backdropFilter: 'blur(32px)',
          borderRadius: 24,
          padding: '52px 64px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: `0 30px 80px rgba(0, 0, 0, 0.95), 0 0 40px ${themeAccent}20, inset 0 1px 1px rgba(255, 255, 255, 0.15)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Ambient Accent Glow Line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            right: '10%',
            height: 2,
            background: `linear-gradient(to right, transparent, ${themeAccent}, transparent)`,
            boxShadow: `0 0 16px ${themeAccent}`,
          }}
        />

        {/* Top Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
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
                boxShadow: `0 0 8px ${themeAccent}`,
              }}
            />
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: 3,
                color: themeAccent,
                textTransform: 'uppercase',
              }}
            >
              {badge}
            </span>
          </div>

          {/* Item Count Pill */}
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.45)',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            {points.length} DIRECTIVES
          </div>
        </div>

        {/* Bold Headline */}
        <h2
          style={{
            fontFamily: FONT.display,
            fontWeight: 900,
            fontSize: 56,
            lineHeight: 1.15,
            letterSpacing: -0.5,
            color: '#ffffff',
            textTransform: 'uppercase',
            marginBottom: 28,
            textShadow: '0 2px 20px rgba(0,0,0,0.8)',
          }}
        >
          {title}
        </h2>

        {/* Divider bar */}
        <div
          style={{
            width: '100%',
            height: 1,
            background: 'linear-gradient(to right, rgba(255,255,255,0.15), rgba(255,255,255,0.03))',
            marginBottom: 36,
          }}
        />

        {/* List of Points */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          {points.map((text, idx) => {
            const sched = schedules[idx];
            const hasStarted = frame >= sched.start;
            const progress = Math.min(1, Math.max(0, (frame - sched.start) / sched.dur));
            const visibleCharCount = Math.floor(progress * text.length);
            const typedText = text.slice(0, visibleCharCount);
            const remainingText = text.slice(visibleCharCount);
            const isTyping = hasStarted && visibleCharCount < text.length;

            // Cursor visibility
            const doneFrames = frame - sched.end;
            const showCursor =
              isTyping ||
              (idx === points.length - 1 &&
                visibleCharCount >= text.length &&
                doneFrames >= 0 &&
                doneFrames < 22 &&
                Math.floor(frame / 5) % 2 === 0);

            // Item completed state (for checkboxes or sequence glow)
            const isCompleted = visibleCharCount >= text.length;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 24,
                  opacity: hasStarted ? 1 : 0.35,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {/* Point Symbol: Checkbox, Numbered Badge, or Bullet */}
                {format === 'todo' ? (
                  /* Todo Checkbox */
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      border: isCompleted
                        ? `2px solid ${themeAccent}`
                        : '2px solid rgba(255, 255, 255, 0.25)',
                      backgroundColor: isCompleted ? `${themeAccent}25` : 'rgba(255, 255, 255, 0.03)',
                      boxShadow: isCompleted ? `0 0 16px ${themeAccent}44` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                      transition: 'all 0.25s ease',
                    }}
                  >
                    {isCompleted ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M5 13L9.5 17.5L19 7"
                          stroke={themeAccent}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        }}
                      />
                    )}
                  </div>
                ) : format === 'sequence' ? (
                  /* Sequence Number (01, 02, 03) */
                  <div
                    style={{
                      minWidth: 46,
                      height: 44,
                      padding: '0 12px',
                      borderRadius: 12,
                      border: isCompleted
                        ? `1px solid ${themeAccent}77`
                        : '1px solid rgba(255, 255, 255, 0.2)',
                      backgroundColor: isCompleted ? `${themeAccent}20` : 'rgba(255, 255, 255, 0.04)',
                      boxShadow: isCompleted ? `0 0 14px ${themeAccent}30` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: FONT.mono,
                      fontWeight: 800,
                      fontSize: 20,
                      color: isCompleted ? themeAccent : 'rgba(255, 255, 255, 0.5)',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                ) : (
                  /* Bullet Point */
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: isCompleted ? themeAccent : 'rgba(255, 255, 255, 0.3)',
                      boxShadow: isCompleted ? `0 0 12px ${themeAccent}` : 'none',
                      flexShrink: 0,
                      marginTop: 16,
                    }}
                  />
                )}

                {/* Point Text with Typewriter Effect */}
                <div
                  style={{
                    fontFamily: FONT.display,
                    fontSize: 36,
                    fontWeight: 600,
                    color: isCompleted ? '#ffffff' : hasStarted ? '#e2e8f0' : 'rgba(255, 255, 255, 0.3)',
                    lineHeight: 1.35,
                    flex: 1,
                    position: 'relative',
                  }}
                >
                  <span>{typedText}</span>
                  {showCursor && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: 4,
                        height: '0.85em',
                        backgroundColor: themeAccent,
                        marginLeft: 4,
                        verticalAlign: '-0.05em',
                        borderRadius: 2,
                        boxShadow: `0 0 10px ${themeAccent}`,
                      }}
                    />
                  )}
                  {/* Invisible trailing text to ensure zero layout shift */}
                  <span style={{ opacity: 0, userSelect: 'none' }}>{remainingText}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
