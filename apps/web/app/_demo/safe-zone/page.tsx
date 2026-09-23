"use client";

import React, { useMemo, useState } from 'react';
import { 
  SceneLayout, 
  applyAutoPositioning, 
  resolveSceneLayout,
  validateSceneSafeZones,
  resolveSafeZoneBounds,
  SafeZoneDefinition
} from '@ai-content-manager/motion-components/src/layout';

export default function SafeZoneDemoPage() {
  const safeZones: SafeZoneDefinition[] = useMemo(() => [
    { id: 'main', type: 'safe', x: 0.1, y: 0.1, width: 0.8, height: 0.8 }, // 10% padding
    { id: 'top-nav', type: 'restricted', x: 0, y: 0, width: 1, height: 120 }, // Fixed top bar
    { id: 'bottom-ui', type: 'restricted', x: 0, y: 0.8, width: 1, height: 0.2 }, // Bottom 20%
    { id: 'side-buttons', type: 'restricted', x: 0.85, y: 0.4, width: 0.15, height: 0.3 } // Side UI
  ], []);

  const [scene] = useState<SceneLayout>({
    width: 600,
    height: 1000,
    safeZones,
    elements: [
      { id: 'auto-title', positionMode: 'auto', safeZoneId: 'main', priority: 10, x: 0, y: 0, width: 400, height: 80 },
      { id: 'auto-subtitle', positionMode: 'auto', safeZoneId: 'main', priority: 5, x: 0, y: 0, width: 350, height: 40 },
      { id: 'auto-block', positionMode: 'auto', safeZoneId: 'main', priority: 1, x: 0, y: 0, width: 450, height: 300 },
      // This absolute element intentionally overlaps the restricted bottom-ui
      { id: 'rogue-watermark', positionMode: 'absolute', x: 200, y: 850, width: 200, height: 100 }
    ]
  });

  // 1. Process Auto Positioning (dodging restricted zones)
  const { layout: autoLayout, diagnostics: autoDiag } = useMemo(() => {
    return applyAutoPositioning(scene, { direction: 'vertical', alignment: 'center', gap: 30 });
  }, [scene]);

  // 2. Resolve to absolute geometry
  const resolvedElements = useMemo(() => resolveSceneLayout(autoLayout), [autoLayout]);

  // 3. Validate entire scene (including the rogue absolute element)
  const diagnostics = useMemo(() => validateSceneSafeZones(autoLayout), [autoLayout]);

  const renderZone = (zone: SafeZoneDefinition) => {
    const bounds = resolveSafeZoneBounds(zone, scene.width, scene.height);
    const isSafe = zone.type === 'safe';
    return (
      <div
        key={zone.id}
        style={{
          position: 'absolute',
          left: bounds.x,
          top: bounds.y,
          width: bounds.width,
          height: bounds.height,
          border: isSafe ? '2px dashed #10b981' : 'none',
          backgroundColor: isSafe ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isSafe ? '#059669' : '#b91c1c',
          fontWeight: 'bold',
          fontSize: 14,
          pointerEvents: 'none'
        }}
      >
        {zone.id} ({zone.type})
      </div>
    );
  };

  const renderElement = (id: string, color: string) => {
    const box = resolvedElements.get(id);
    if (!box) return null;

    const error = diagnostics.find(d => d.elementId === id);

    return (
      <div 
        key={id}
        style={{
          position: 'absolute',
          left: box.x,
          top: box.y,
          width: box.width,
          height: box.height,
          backgroundColor: color,
          border: error ? '3px solid red' : '1px solid rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: 14,
          opacity: 0.9,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        {id}
        {error && <span style={{ fontSize: 10, color: '#fee2e2' }}>({error.reason})</span>}
      </div>
    );
  };

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh', display: 'flex', gap: 40 }}>
      
      <div>
        <h1>Safe Zone Demo</h1>
        
        <div style={{ position: 'relative', width: scene.width, height: scene.height, backgroundColor: '#fff', border: '2px solid #ccc', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          {/* Render Zones */}
          {safeZones.map(renderZone)}

          {/* Render Elements */}
          {renderElement('auto-title', '#3b82f6')}
          {renderElement('auto-subtitle', '#3b82f6')}
          {renderElement('auto-block', '#f59e0b')}
          {renderElement('rogue-watermark', '#8b5cf6')}
        </div>
      </div>

      <div style={{ maxWidth: 400 }}>
        <h3>Diagnostics Output:</h3>
        
        <div style={{ padding: 15, backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(diagnostics, null, 2)}
        </div>

        <div style={{ marginTop: 20, fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
          <strong>Notice:</strong><br />
          - The <strong>top-nav</strong> restricted zone forces the Auto Positioning engine to dodge it! Even though the stack is set to vertically center, it mathematically calculates that `auto-title` would intersect `top-nav`, and jumps below it.<br/><br/>
          - The <strong>rogue-watermark</strong> is an absolute element. Auto Positioning ignores it, but the Safe Zone Validation pass catches it intersecting the restricted `bottom-ui` zone and flags it with an error in the diagnostics array.<br/><br/>
          - The <strong>main</strong> safe zone uses normalized bounds (10% padding). The auto elements use this as their container bounds, rather than the raw canvas width.
        </div>
      </div>
    </div>
  );
}
