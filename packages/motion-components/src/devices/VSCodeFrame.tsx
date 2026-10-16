import React from 'react';
import { AbsoluteFill, interpolate, Img, useCurrentFrame } from 'remotion';
import {
  Files,
  Search,
  GitBranch,
  Play,
  LayoutGrid,
  Folder,
  FolderOpen,
  Settings,
  FileText,
  Braces,
  Image as ImageIcon,
  Info,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Clock,
  Plus,
  X,
  SplitSquareHorizontal,
} from 'lucide-react';
import { FONT_BODY, FONT_MONO } from '../themes/brandTokens';
import { V, VSC, CLAMP, Sunburst } from '../ui/MotionKit';

export type ExplorerRow = {
  name: string;
  kind: 'folder' | 'file';
  depth?: number;
  open?: boolean;
  icon?: 'settings' | 'file' | 'braces' | 'image' | 'info';
  iconColor?: string;
  mark?: string | null;
  dot?: boolean;
  appearAt?: number;
  highlightAt?: number;
};

const FILE_ICONS = {
  settings: { Icon: Settings, color: V.dim },
  file: { Icon: FileText, color: V.dim },
  braces: { Icon: Braces, color: '#c9a26b' },
  image: { Icon: ImageIcon, color: '#4ec98f' },
  info: { Icon: Info, color: '#4a9ee6' },
} as const;

export const baseExplorer = (opts?: {
  expand?: string;
  insertAfter?: string;
  inserted?: ExplorerRow[];
}): ExplorerRow[] => {
  const folders = ['src', 'components', 'services', 'styles'];
  const files: ExplorerRow[] = [
    { name: '.env.local', kind: 'file', icon: 'settings' },
    { name: 'package.json', kind: 'file', icon: 'braces' },
    { name: 'README.md', kind: 'file', icon: 'info' },
  ];
  const rows: ExplorerRow[] = [];
  for (const f of folders) {
    rows.push({ name: f, kind: 'folder', open: opts?.expand === f, dot: true });
    if (opts?.insertAfter === f && opts.inserted) rows.push(...opts.inserted);
  }
  rows.push(...files);
  return rows;
};

export const ExplorerRowView: React.FC<{ row: ExplorerRow; frame: number }> = ({ row, frame }) => {
  const op =
    row.appearAt === undefined
      ? 1
      : interpolate(frame, [row.appearAt, row.appearAt + 8], [0, 1], CLAMP);
  const hi =
    row.highlightAt === undefined
      ? 0
      : interpolate(frame, [row.highlightAt, row.highlightAt + 8], [0, 1], CLAMP);
  const depth = row.depth ?? 0;
  const fi = row.icon ? FILE_ICONS[row.icon] : FILE_ICONS.file;
  const Icon = fi.Icon;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: `4px 14px 4px ${(row.kind === 'folder' ? 18 : 34) + depth * 14}px`,
        opacity: op,
      }}
    >
      {hi > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(205,128,100,${0.22 * hi})`,
            borderLeft: `3px solid ${V.coral}`,
            opacity: hi,
          }}
        />
      )}
      {row.kind === 'folder' ? (
        <>
          {row.open ? (
            <ChevronDown size={14} color={V.dim} />
          ) : (
            <ChevronRight size={14} color={V.dim} />
          )}
          {row.open ? (
            <FolderOpen size={15} color="#c0a06a" strokeWidth={1.8} />
          ) : (
            <Folder size={15} color="#c0a06a" strokeWidth={1.8} />
          )}
        </>
      ) : (
        <Icon size={15} color={row.iconColor ?? fi.color} strokeWidth={1.8} />
      )}
      <span
        style={{
          fontSize: 15,
          color: hi > 0.5 ? '#ffffff' : V.text,
          fontWeight: hi > 0.5 ? 600 : 400,
          flex: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {row.name}
      </span>
      {row.mark && (
        <span style={{ fontSize: 13, color: V.green, fontWeight: 600 }}>{row.mark}</span>
      )}
    </div>
  );
};

export const VSCodeShell: React.FC<{
  title?: string;
  explorerRows?: ExplorerRow[];
  activeFile?: string;
  children?: React.ReactNode;
}> = ({
  title = 'AI Content Studio',
  explorerRows = baseExplorer(),
  activeFile = 'index.ts',
  children,
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: V.editor, fontFamily: FONT_BODY }}>
      {/* Title bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: VSC.TITLE_H,
          background: V.chrome,
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${V.border}`,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
          </div>
          {['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal'].map((m) => (
            <span key={m} style={{ fontSize: 14, color: V.text, opacity: 0.85 }}>
              {m}
            </span>
          ))}
        </div>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: 480,
            height: 28,
            background: '#2a2a2a',
            border: `1px solid ${V.border}`,
            borderRadius: 6,
            justifyContent: 'center',
          }}
        >
          <Search size={14} color={V.faint} />
          <span style={{ fontSize: 14, color: V.dim }}>{title}</span>
        </div>
      </div>

      {/* Activity bar */}
      <div
        style={{
          position: 'absolute',
          top: VSC.TITLE_H,
          left: 0,
          width: VSC.ACT_W,
          bottom: 0,
          background: V.chrome,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
          paddingBottom: 14,
          zIndex: 9,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
          <div
            style={{
              width: '100%',
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderLeft: `2px solid ${V.text}`,
            }}
          >
            <Files size={22} color={V.text} strokeWidth={1.8} />
          </div>
          <div
            style={{
              width: '100%',
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Search size={22} color={V.faint} strokeWidth={1.8} />
          </div>
          <div
            style={{
              width: '100%',
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GitBranch size={22} color={V.faint} strokeWidth={1.8} />
          </div>
        </div>
        <Settings size={22} color={V.faint} strokeWidth={1.8} />
      </div>

      {/* Explorer Sidebar */}
      <div
        style={{
          position: 'absolute',
          top: VSC.TITLE_H,
          left: VSC.SB_X,
          width: VSC.SB_W,
          bottom: 0,
          background: V.sidebar,
          borderRight: `1px solid ${V.border}`,
          paddingTop: 8,
          zIndex: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px 10px',
          }}
        >
          <span style={{ fontSize: 13, letterSpacing: 1, color: V.dim, fontWeight: 600 }}>
            EXPLORER
          </span>
          <MoreHorizontal size={16} color={V.dim} />
        </div>

        {explorerRows.map((row, i) => (
          <ExplorerRowView key={`${row.name}-${i}`} row={row} frame={frame} />
        ))}
      </div>

      {/* Editor Content Area */}
      <div
        style={{
          position: 'absolute',
          top: VSC.TITLE_H,
          left: VSC.ED_X,
          right: 0,
          bottom: 0,
          background: V.editor,
          overflow: 'hidden',
        }}
      >
        {/* Editor Tab bar */}
        <div
          style={{
            height: 38,
            background: V.chrome,
            borderBottom: `1px solid ${V.border}`,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              height: '100%',
              background: V.editor,
              borderRight: `1px solid ${V.border}`,
              borderTop: `2px solid ${V.coral}`,
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <FileText size={15} color={V.coral} />
            <span style={{ fontSize: 14, color: V.text }}>{activeFile}</span>
          </div>
        </div>

        {/* Code / Editor pane */}
        <div style={{ padding: 24, fontFamily: FONT_MONO }}>{children}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- Typed Code Editor Pane
export type CodeSeg = [text: string, color: string];
export type CodeLine = CodeSeg[];

export const GROUP_TOP = VSC.TITLE_H + 40 + 34;

export const CodeEditorPane: React.FC<{
  lines: CodeLine[];
  typeStart?: number;
  cps?: number;
  fontSize?: number;
  appearAt?: number;
}> = ({ lines, typeStart = 10, cps = 30, fontSize = 22, appearAt = 0 }) => {
  const frame = useCurrentFrame();
  const paneOp = interpolate(frame, [appearAt, appearAt + 8], [0, 1], CLAMP);
  const shown = Math.max(0, Math.floor((frame - typeStart) * (cps / 30)));
  let used = 0;
  const lineH = fontSize * 1.65;
  const done = shown >= lines.reduce((n, l) => n + l.reduce((m, s) => m + s[0].length, 0), 0);
  const cursorOn = Math.floor(frame / 14) % 2 === 0;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: V.editor,
        padding: '16px 0',
        opacity: paneOp,
        overflow: 'hidden',
      }}
    >
      {lines.map((line, li) => {
        const chars = line.reduce((n, s) => n + s[0].length, 0);
        const from = used;
        used += chars;
        const visible = Math.max(0, Math.min(chars, shown - from));
        let left = visible;
        const isCursorLine = !done && shown >= from && shown < from + chars + 1;

        return (
          <div key={li} style={{ display: 'flex', height: lineH, alignItems: 'center' }}>
            <span
              style={{
                width: 60,
                textAlign: 'right',
                paddingRight: 20,
                fontFamily: FONT_MONO,
                fontSize: fontSize - 5,
                color: '#5a5a5a',
                flexShrink: 0,
              }}
            >
              {li + 1}
            </span>
            <span style={{ fontFamily: FONT_MONO, fontSize, whiteSpace: 'pre' }}>
              {line.map((seg, si) => {
                const take = Math.max(0, Math.min(seg[0].length, left));
                left -= take;
                return (
                  <span key={si} style={{ color: seg[1] }}>
                    {seg[0].slice(0, take)}
                  </span>
                );
              })}
              {isCursorLine && <span style={{ color: V.coral, opacity: cursorOn ? 1 : 0 }}>▌</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
};
