import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { CardView } from '../../templates/cooked_templates/src/StyleEdit';
import { resolveLook, useFonts } from '../../templates/cooked_templates/src/look';
import { pickMotion } from '../../templates/cooked_templates/src/motion';

export interface CookedMotionCardProps {
  type: string; // e.g. "likes", "terminal", "social_post", "chat", "notes", "progress", "flow", "curve", "toasts", "logo_cluster"
  props: Record<string, any>;
  box?: [number, number, number, number]; // [x, y, w, h] in % (default: [8, 15, 84, 45])
  look?: any;
  motion?: string;
  light?: boolean;
}

function normalizeCookedProps(type: string, inputProps: Record<string, any> = {}): Record<string, any> {
  const p = { ...inputProps };

  switch (type) {
    case 'likes': {
      if (!p.counts && (p.to !== undefined || p.count !== undefined || p.metric !== undefined)) {
        const fromN = Number(p.from ?? 0);
        const toN = Number(String(p.to ?? p.count ?? p.metric ?? 1000).replace(/[^\d.-]/g, '')) || 1000;
        p.counts = [{ n: fromN }, { n: toN }];
      } else if (!p.counts) {
        p.counts = [{ n: 0 }, { n: 10000 }];
      }
      if (Array.isArray(p.comments)) {
        p.comments = p.comments.map((c: any) =>
          typeof c === 'string' ? { user: 'Viewer', text: c } : c
        );
      }
      break;
    }
    case 'terminal': {
      if (!p.lines && (p.command || p.code || p.output)) {
        const cmd = p.command || p.code || 'npm start';
        const out = p.output || 'Process completed successfully.';
        p.lines = [
          { kind: 'cmd', text: String(cmd) },
          { kind: 'out', text: String(out) }
        ];
      } else if (Array.isArray(p.lines)) {
        p.lines = p.lines.map((l: any) =>
          typeof l === 'string'
            ? { kind: l.startsWith('$') ? 'cmd' : 'out', text: l.replace(/^\$\s*/, '') }
            : l
        );
      }
      break;
    }
    case 'chat': {
      if (!p.app) p.app = 'AI Assistant';
      if (!p.messages && (p.question || p.answer || p.text)) {
        p.messages = [
          { from: 'user', text: String(p.question || 'How does this work?') },
          { from: 'app', text: String(p.answer || p.text || 'It is fully automated with AI.') }
        ];
      } else if (Array.isArray(p.messages)) {
        p.messages = p.messages.map((m: any) => ({
          ...m,
          from: (m.from === 'user' || m.from === 'me') ? 'user' : 'app',
          text: String(m.text || '')
        }));
      }
      break;
    }
    case 'notes': {
      if (!p.lines && (p.items || p.steps)) {
        const items = p.items || p.steps;
        p.lines = (Array.isArray(items) ? items : [items]).map((item: any) =>
          typeof item === 'string' ? { text: item } : item
        );
      } else if (Array.isArray(p.lines)) {
        p.lines = p.lines.map((l: any) =>
          typeof l === 'string' ? { text: l } : l
        );
      }
      if (!p.title) p.title = 'Key Notes';
      break;
    }
    case 'progress': {
      if (p.to === undefined && (p.progress !== undefined || p.value !== undefined)) {
        const val = Number(String(p.progress ?? p.value ?? 100).replace(/[^\d.-]/g, ''));
        p.to = isNaN(val) ? 100 : val;
      }
      if (!p.label) p.label = 'Progress';
      break;
    }
    case 'toasts': {
      if (!p.items && (p.title || p.message || p.body)) {
        p.items = [{
          app: String(p.app || 'Notification'),
          title: String(p.title || 'Update'),
          body: String(p.message || p.body || '')
        }];
      }
      break;
    }
    case 'social_post': {
      if (!p.name) p.name = p.author || 'Creator';
      if (!p.handle) p.handle = `@${p.name.toLowerCase().replace(/\s+/g, '')}`;
      if (!p.text) p.text = p.headline || p.quote || 'This changed everything.';
      break;
    }
    case 'flow': {
      if (Array.isArray(p.nodes)) {
        p.nodes = p.nodes.map((n: any) =>
          typeof n === 'string' ? { label: n } : n
        );
      } else if (p.steps && Array.isArray(p.steps)) {
        p.nodes = p.steps.map((s: any) =>
          typeof s === 'string' ? { label: s } : { label: s.title || s.label || String(s) }
        );
      }
      break;
    }
  }

  return p;
}

export const CookedMotionCard: React.FC<CookedMotionCardProps> = ({
  type = 'likes',
  props = {},
  box = [8, 15, 84, 45],
  look: rawLook,
  motion: motionName = 'snappy',
  light = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const dur = durationInFrames / fps;

  const look = resolveLook(rawLook);
  const fonts = useFonts(look);
  const m = pickMotion(motionName);

  const normalizedProps = normalizeCookedProps(type, props);

  const card = {
    anim: {
      type,
      props: normalizedProps,
    },
    start: 0,
    end: dur,
    box,
    entrance: 'pop' as const,
  };

  return (
    <AbsoluteFill style={{ background: 'transparent' }}>
      {fonts.ready ? (
        <CardView
          card={card}
          t={t}
          covered={false}
          light={light}
          look={look}
          m={m}
          fonts={fonts}
        />
      ) : null}
    </AbsoluteFill>
  );
};
