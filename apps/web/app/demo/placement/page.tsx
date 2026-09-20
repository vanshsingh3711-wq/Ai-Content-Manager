"use client";

import React, { useMemo } from 'react';
import { resolvePlacement, PlacementContext, PlacementRequest, ResolvedPlacement } from '@ai-content-manager/motion-components/src/placement';
import { getAnchorOffset } from '@ai-content-manager/motion-components/src/layout/layout.utils';

// Mock context with predefined intrinsic assets and a restricted safe zone
const MOCK_CONTEXT: PlacementContext = {
  canvas: { width: 1080, height: 1920 },
  assets: [
    { id: 'title_asset', type: 'text', intrinsicSize: { width: 600, height: 100 } },
    { id: 'chart_asset', type: 'chart', intrinsicSize: { width: 800, height: 600 } },
    { id: 'phone_asset', type: 'object', intrinsicSize: { width: 300, height: 600 } },
    { id: 'arrow_asset', type: 'object', intrinsicSize: { width: 100, height: 100 } },
  ],
  existingPlacements: [],
  safeZones: [
    { id: 'logo_zone', type: 'restricted', x: 0, y: 0, width: 200, height: 200 },
    { id: 'watermark_zone', type: 'restricted', x: 880, y: 1720, width: 200, height: 200 }
  ]
};

// Abstract requests simulating the AI's composition intent
const PLACEMENT_REQUESTS: PlacementRequest[] = [
  {
    assetId: 'title_asset',
    position: { x: 540, y: 300 },
    anchor: 'center'
  },
  {
    assetId: 'chart_asset',
    position: { x: 540, y: 960 },
    anchor: 'center'
  },
  {
    // Place an arrow BELOW the title, with a gap of 50px
    assetId: 'arrow_asset',
    relativeTo: 'title_asset',
    relation: 'below',
    gap: 50
  },
  {
    // Try to place a phone in the top left, but it will collide with the logo zone!
    assetId: 'phone_asset',
    position: { x: 0, y: 0 },
    anchor: 'top-left'
  },
];

export default function PlacementCompositionDemo() {
  
  const { placements, diagnostics } = useMemo(() => {
    // Sequentially resolve placements so relative targets can build on each other
    const resolved: ResolvedPlacement[] = [];
    const allDiagnostics: { elId: string; d: any }[] = [];

    const context = { ...MOCK_CONTEXT, existingPlacements: resolved };

    for (const req of PLACEMENT_REQUESTS) {
      const result = resolvePlacement(req, context);
      resolved.push(result);
      
      if (result.diagnostics) {
        result.diagnostics.forEach(d => allDiagnostics.push({ elId: result.assetId, d }));
      }
    }

    return { placements: resolved, diagnostics: allDiagnostics };
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', gap: 40 }}>
      
      {/* Controls & Diagnostics */}
      <div style={{ width: 400, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1>Placement & Composition</h1>
        
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          This visualizer executes the <b>Asset Placement System</b>. It processes requests (like "place arrow below title"), computes intrinsic aspect ratios, resolves base <code>x,y</code> geometries, and validates collisions and safe zones.
        </p>

        {diagnostics.length > 0 && (
          <div style={{ backgroundColor: '#fef2f2', padding: 20, borderRadius: 8, border: '1px solid #f87171' }}>
            <h3 style={{ marginTop: 0, color: '#991b1b' }}>Diagnostics (Collisions)</h3>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#b91c1c', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {diagnostics.map((item, i) => (
                <li key={i}>
                  <strong>{item.elId}:</strong> {item.d.message}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div style={{ backgroundColor: '#e2e8f0', padding: 20, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Computed Base Geometry:</h3>
          <pre style={{ fontSize: 12, overflowX: 'auto' }}>
            {JSON.stringify(placements, null, 2)}
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
        
        {/* Draw Restricted Safe Zones */}
        {MOCK_CONTEXT.safeZones.map(zone => (
          <div key={zone.id} style={{
            position: 'absolute',
            left: zone.x * 0.4,
            top: zone.y * 0.4,
            width: zone.width * 0.4,
            height: zone.height * 0.4,
            backgroundColor: 'rgba(239, 68, 68, 0.2)', // red transparent
            border: '2px dashed #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            fontWeight: 'bold',
            fontSize: 12
          }}>
            Restricted
          </div>
        ))}

        {/* Draw Resolved Placements */}
        {placements.map(p => {
          // Convert internal anchored coords to CSS top-left for rendering
          const offset = getAnchorOffset(p.width, p.height, p.anchor);
          const absoluteX = p.x + offset.x;
          const absoluteY = p.y + offset.y;
          
          const hasError = p.diagnostics && p.diagnostics.length > 0;

          return (
            <div 
              key={p.id}
              style={{
                position: 'absolute',
                left: absoluteX * 0.4,
                top: absoluteY * 0.4,
                width: p.width * 0.4,
                height: p.height * 0.4,
                backgroundColor: hasError ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                border: `2px solid ${hasError ? '#f59e0b' : '#3b82f6'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: hasError ? '#d97706' : '#1d4ed8',
                fontWeight: 'bold',
                fontSize: 14,
                textAlign: 'center'
              }}
            >
              <div>
                {p.id}<br/>
                <span style={{ fontSize: 10, fontWeight: 'normal' }}>
                  w: {p.width} h: {p.height}
                </span>
              </div>
              
              {/* Draw Anchor Point Dot */}
              <div style={{
                position: 'absolute',
                left: (p.x - absoluteX) * 0.4,
                top: (p.y - absoluteY) * 0.4,
                width: 6,
                height: 6,
                backgroundColor: '#ef4444',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)'
              }} />
            </div>
          );
        })}
      </div>

    </div>
  );
}
