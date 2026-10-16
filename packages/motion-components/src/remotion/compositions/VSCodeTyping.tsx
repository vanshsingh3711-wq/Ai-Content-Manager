import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame } from 'remotion';
import { COLORS, FONT, useExitFade } from '../shared';

interface Props { title: string; activeFile: string; code: string; language?: string; personality?: string; }

export const VSCodeTyping: React.FC<Props> = ({ title, activeFile, code, language = 'python' }) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const exit = useExitFade(durationInFrames);
  const lines = code.split('\n');
  // Reveal 1 char per frame after frame 10
  const totalChars = code.length;
  const visibleChars = Math.min(totalChars, Math.max(0, (frame - 10) * 3));
  let charCount = 0;
  const renderedLines = lines.map((line, lineIdx) => {
    const lineStart = charCount;
    charCount += line.length + 1;
    const visible = Math.max(0, Math.min(line.length, visibleChars - lineStart));
    return { line, visible, lineIdx };
  });

  return (
    <AbsoluteFill style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, ...exit }}>
      <div style={{ width: '100%', borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.9)' }}>
        {/* VS Code titlebar */}
        <div style={{ background: '#3c3c3c', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
          {['#ff5f57','#febc2e','#28c840'].map((c,i)=>(<div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />))}
          <span style={{ fontFamily: FONT.mono, fontSize: 18, color: 'rgba(255,255,255,0.5)', marginLeft: 12 }}>{title} — {activeFile}</span>
        </div>
        {/* Tab bar */}
        <div style={{ background: '#252526', padding: '0 20px', display: 'flex' }}>
          <div style={{ padding: '10px 20px', fontFamily: FONT.mono, fontSize: 18, color: 'rgba(255,255,255,0.8)', background: '#1e1e1e', borderTop: `2px solid ${COLORS.accent}` }}>
            {activeFile}
          </div>
        </div>
        {/* Editor */}
        <div style={{ background: '#1e1e1e', padding: '28px 0', minHeight: 400 }}>
          {renderedLines.map(({ line, visible, lineIdx }) => (
            <div key={lineIdx} style={{ display: 'flex', padding: '2px 32px', fontFamily: FONT.mono, fontSize: 28, lineHeight: 1.8 }}>
              <span style={{ color: '#6e6e6e', minWidth: 48, textAlign: 'right', marginRight: 28, userSelect: 'none' }}>{lineIdx + 1}</span>
              <span style={{ color: '#ce9178' }}>{line.slice(0, visible)}</span>
              {visible < line.length && <span style={{ display: 'inline-block', width: 2, height: 28, background: COLORS.accent, marginLeft: 2 }} />}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
