"use client";

import React, { useMemo } from 'react';
import { resolveRelationships, CompositionRelationship } from '@ai-content-manager/motion-components/src/relationships';
import { ResolvedPlacement } from '@ai-content-manager/motion-components/src/placement';
import { getAnchorOffset } from '@ai-content-manager/motion-components/src/layout/layout.utils';

// Mock initial placements representing absolute positions before the graph solver runs
const INITIAL_PLACEMENTS: ResolvedPlacement[] = [
  { id: 'title', assetId: 'title', x: 540, y: 150, width: 400, height: 80, anchor: 'center' },
  { id: 'chart', assetId: 'chart', x: 0, y: 0, width: 600, height: 400, anchor: 'top-left' },
  { id: 'caption', assetId: 'caption', x: 0, y: 0, width: 400, height: 60, anchor: 'top-left' },
  { id: 'arrow', assetId: 'arrow', x: 0, y: 0, width: 50, height: 50, anchor: 'top-left' },
  { id: 'phone', assetId: 'phone', x: 900, y: 500, width: 200, height: 400, anchor: 'center' },
  { id: 'kpi', assetId: 'kpi', x: 0, y: 0, width: 150, height: 80, anchor: 'top-left' }
];

// Relationships declaring how elements should attach to one another
const RELATIONSHIPS: CompositionRelationship[] = [
  // Chain: Title -> Chart -> Caption
  { sourceId: 'chart', targetId: 'title', relation: 'below', gap: 40 },
  { sourceId: 'caption', targetId: 'chart', relation: 'below', gap: 20 },
  // Attach KPI to the left of the Chart
  { sourceId: 'kpi', targetId: 'chart', relation: 'left', gap: 30 },
  // Center an Arrow perfectly inside the Phone
  { sourceId: 'arrow', targetId: 'phone', relation: 'inside' }
];

export default function RelationshipsDemo() {
  
  const { placements, diagnostics, resolvedOrder } = useMemo(() => {
    return resolveRelationships(INITIAL_PLACEMENTS, RELATIONSHIPS);
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', gap: 40 }}>
      
      {/* Controls & Diagnostics */}
      <div style={{ width: 400, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1>Relationships Graph Solver</h1>
        
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          This visualizer executes the <b>Composition Relationships</b> engine. It uses a Directed Acyclic Graph (DAG) and topological sorting to resolve declarative relationships (e.g., <i>"caption below chart"</i>) into deterministic absolute coordinates without infinite loops.
        </p>

        <div style={{ backgroundColor: '#e0f2fe', padding: 20, borderRadius: 8, border: '1px solid #7dd3fc' }}>
          <h3 style={{ marginTop: 0, color: '#0369a1' }}>Topological Resolution Order</h3>
          <div style={{ color: '#0c4a6e', fontSize: 14 }}>
            {resolvedOrder.join(' ➔ ')}
          </div>
        </div>

        {diagnostics.length > 0 && (
          <div style={{ backgroundColor: '#fef2f2', padding: 20, borderRadius: 8, border: '1px solid #f87171' }}>
            <h3 style={{ marginTop: 0, color: '#991b1b' }}>Diagnostics (Cycles)</h3>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#b91c1c', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {diagnostics.map((d, i) => (
                <li key={i}><strong>{d.reason}:</strong> {d.message}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div style={{ backgroundColor: '#e2e8f0', padding: 20, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Input Relationships:</h3>
          <pre style={{ fontSize: 12, overflowX: 'auto', margin: 0 }}>
            {JSON.stringify(RELATIONSHIPS, null, 2)}
          </pre>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ 
        position: 'relative', 
        width: 1080 * 0.4, // scaled down for web
        height: 1920 * 0.4,
        backgroundColor: '#fff',
        border: '2px solid #ccc',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        
        {/* Draw Placements */}
        {placements.map(p => {
          // Convert internal anchored coords to CSS top-left for rendering
          const offset = getAnchorOffset(p.width, p.height, p.anchor);
          const absoluteX = p.x + offset.x;
          const absoluteY = p.y + offset.y;
          
          return (
            <div 
              key={p.id}
              style={{
                position: 'absolute',
                left: absoluteX * 0.4,
                top: absoluteY * 0.4,
                width: p.width * 0.4,
                height: p.height * 0.4,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                border: '2px solid #3b82f6',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1d4ed8',
                fontWeight: 'bold',
                fontSize: 14,
                textAlign: 'center'
              }}
            >
              <div>{p.id.toUpperCase()}</div>
              
              {/* Draw Anchor Point Dot */}
              <div style={{
                position: 'absolute',
                left: (p.x - absoluteX) * 0.4,
                top: (p.y - absoluteY) * 0.4,
                width: 8,
                height: 8,
                backgroundColor: '#ef4444',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 0 2px white'
              }} title={`Anchor: ${p.anchor}`} />
            </div>
          );
        })}
      </div>

    </div>
  );
}
