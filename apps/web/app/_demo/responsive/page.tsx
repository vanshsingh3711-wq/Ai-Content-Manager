"use client";

import React, { useMemo, useState } from 'react';
import { 
  SceneLayout, 
  applyResponsiveScaling, 
  resolveSceneLayout,
  ResponsiveConfig
} from '@ai-content-manager/motion-components/src/layout';

export default function ResponsiveDemoPage() {
  const [config, setConfig] = useState<ResponsiveConfig>({
    designWidth: 1080,
    designHeight: 1920,
    targetWidth: 720,
    targetHeight: 1280,
    mode: 'contain'
  });

  // Base authored scene
  const baseScene: SceneLayout = useMemo(() => ({
    width: 1080,
    height: 1920,
    elements: [
      { id: 'bg-pattern', x: 0, y: 0, width: 1080, height: 1920 },
      { id: 'title', x: 540, y: 400, width: 800, height: 150, anchor: 'center' },
      { id: 'video-box', x: 540, y: 960, width: 900, height: 900, anchor: 'center' },
      { id: 'footer', x: 540, y: 1700, width: 600, height: 80, anchor: 'center' }
    ]
  }), []);

  // 1. Transform Responsive scaling first
  const scaledScene = useMemo(() => applyResponsiveScaling(baseScene, config), [baseScene, config]);

  // 2. Resolve layout (handles anchors perfectly on the new transformed coordinates)
  const resolvedElements = useMemo(() => resolveSceneLayout(scaledScene), [scaledScene]);

  const renderElement = (id: string, color: string, isText = false) => {
    const box = resolvedElements.get(id);
    if (!box) return null;

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
          border: '2px solid rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: isText ? box.height * 0.4 : 14, // Scale font visually based on box height for demo
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
        }}
      >
        {id}
      </div>
    );
  };

  const setTarget = (w: number, h: number) => setConfig(c => ({...c, targetWidth: w, targetHeight: h}));

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', backgroundColor: '#f1f5f9', minHeight: '100vh', display: 'flex', gap: 40 }}>
      
      {/* Controls */}
      <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1>Responsive Scaling</h1>
        
        <div>
          <strong>Target Canvas:</strong><br/>
          <button onClick={() => setTarget(1080, 1920)}>1080 x 1920 (Native)</button><br/>
          <button onClick={() => setTarget(720, 1280)}>720 x 1280 (Small Portrait)</button><br/>
          <button onClick={() => setTarget(1920, 1080)}>1920 x 1080 (Landscape)</button><br/>
          <button onClick={() => setTarget(1080, 1080)}>1080 x 1080 (Square)</button>
        </div>

        <div>
          <strong>Mode:</strong><br/>
          <select value={config.mode} onChange={e => setConfig(c => ({...c, mode: e.target.value as any}))} style={{ padding: 5, width: '100%' }}>
            <option value="contain">Contain (Letterbox)</option>
            <option value="cover">Cover (Crop)</option>
            <option value="stretch">Stretch (Distort)</option>
          </select>
        </div>
        
        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, backgroundColor: '#e2e8f0', padding: 15, borderRadius: 8 }}>
          <strong>Notice:</strong><br/>
          - The scene geometry mathematically resizes to exactly fit the target bounding box.<br/>
          - Notice how the elements stay perfectly centered despite the resolution changing, because the underlying base geometry scales perfectly alongside the layout resolver's <code>anchor: 'center'</code> offset math.
        </div>
      </div>

      {/* Target Canvas Container (The Player Window) */}
      <div style={{ 
        position: 'relative', 
        width: config.targetWidth * 0.4, // scaled down strictly for web viewability 
        height: config.targetHeight * 0.4,
        border: '4px solid #334155',
        backgroundColor: '#cbd5e1',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          position: 'absolute',
          transform: `scale(0.4)`,
          transformOrigin: 'top left',
          width: config.targetWidth,
          height: config.targetHeight,
        }}>
          {renderElement('bg-pattern', '#94a3b8')}
          {renderElement('title', '#3b82f6', true)}
          {renderElement('video-box', '#f59e0b')}
          {renderElement('footer', '#10b981', true)}
        </div>
      </div>

    </div>
  );
}
