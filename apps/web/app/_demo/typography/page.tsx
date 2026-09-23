"use client";

import React, { useMemo } from 'react';
import { 
  SceneDefinition, 
  resolveSceneGraph 
} from '@ai-content-manager/motion-components/src/scene';
import { Typography } from '@ai-content-manager/motion-components/src/elements/Typography';

export default function TypographyDemo() {
  const scene: SceneDefinition = useMemo(() => {
    return {
      id: 'typo-demo',
      themeId: 'premium_dark', // Use our base dark theme
      elements: [
        {
          id: 'hero',
          type: 'text',
          textContent: 'Revolutionize Your Content',
          textConfig: { role: 'hero', align: 'center' },
          placement: { positionMode: 'auto' }
        },
        {
          id: 'heading',
          type: 'text',
          textContent: 'Introduction to Typography',
          textConfig: { role: 'heading', align: 'center' },
          placement: { positionMode: 'auto' }
        },
        {
          id: 'body-text',
          type: 'text',
          textContent: 'This is a long body paragraph that will automatically wrap into multiple lines because it has a maxWidth constraint applied during layout.',
          textConfig: { role: 'body', align: 'center', maxWidth: 600 },
          placement: { positionMode: 'auto' }
        },
        {
          id: 'shrink-text',
          type: 'text',
          textContent: 'This oversized text shrinks to fit a small box automatically without breaking layout.',
          textConfig: { 
            role: 'display', 
            maxWidth: 500, 
            maxLines: 1, 
            fit: 'shrink', 
            minFontSize: 16,
            background: 'surface'
          },
          placement: { positionMode: 'auto' }
        },
        {
          id: 'label',
          type: 'text',
          textContent: 'High Priority',
          textConfig: { role: 'label', background: 'pill' },
          placement: { positionMode: 'auto' }
        },
        {
          id: 'quote',
          type: 'text',
          textContent: '"Design is not just what it looks like, design is how it works."',
          textConfig: { role: 'quote', align: 'center', maxWidth: 500, background: 'highlight' },
          placement: { positionMode: 'auto' }
        }
      ]
    };
  }, []);

  const resolvedGraph = useMemo(() => {
    return resolveSceneGraph(scene, {
      canvas: { width: 1080, height: 1920 },
      fps: 30
    });
  }, [scene]);

  return (
    <div style={{ padding: 40, background: '#111', minHeight: '100vh', display: 'flex', gap: 40, color: 'white' }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Typography System</h1>
        
        <div style={{ 
          position: 'relative', 
          width: 1080 / 2, 
          height: 1920 / 2, 
          background: resolvedGraph.tokens.colors.background, 
          border: '1px solid #333',
          overflow: 'hidden',
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }}>
          {/* We scale the inner container to fit our 50% mock viewport */}
          <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: 1080, height: 1920 }}>
            {resolvedGraph.elements.map(el => {
              if (el.type !== 'text') return null;
              
              return (
                <div 
                  key={el.id}
                  style={{
                    position: 'absolute',
                    left: el.geometry.x,
                    top: el.geometry.y,
                    width: el.geometry.width,
                    height: el.geometry.height,
                    // Border to visualize the precise mathematical bounding box passed down by layout engine
                    border: '1px dashed rgba(255,255,255,0.2)' 
                  }}
                >
                  <Typography element={el} tokens={resolvedGraph.tokens} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 500 }}>
        <h3>Layout Diagnostics</h3>
        <pre style={{ background: '#222', padding: 20, borderRadius: 8, fontSize: 12, overflow: 'auto' }}>
          {JSON.stringify(resolvedGraph.diagnostics, null, 2)}
        </pre>
        
        <h3 style={{ marginTop: 20 }}>Resolved Elements</h3>
        <pre style={{ background: '#222', padding: 20, borderRadius: 8, fontSize: 12, overflow: 'auto', maxHeight: 600 }}>
          {JSON.stringify(resolvedGraph.elements.map(e => ({
            id: e.id,
            geometry: e.geometry,
            measurement: e.textMeasurement,
          })), null, 2)}
        </pre>
      </div>
    </div>
  );
}
