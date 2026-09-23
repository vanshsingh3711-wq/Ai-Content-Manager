"use client";

import React, { useMemo, useState } from 'react';
import { applyAutoPositioning, resolveSceneLayout, SceneLayout, AutoPositionConfig } from '@ai-content-manager/motion-components/src/layout';

export default function AutoPositionDemoPage() {
  const [config, setConfig] = useState<AutoPositionConfig>({
    direction: 'vertical',
    alignment: 'center',
    gap: 20,
    padding: { top: 40, bottom: 40, left: 40, right: 40 }
  });

  // 1. Unprocessed Scene Definition with mixed absolute and auto elements
  const scene: SceneLayout = useMemo(() => ({
    width: 800,
    height: 600,
    elements: [
      {
        id: 'absolute-title',
        positionMode: 'absolute', // Will not be moved by Auto Positioning
        x: 400,
        y: 30,
        width: 300,
        height: 40,
        anchor: 'top-center'
      },
      // The rest are auto-positioned
      { id: 'auto-1', positionMode: 'auto', x: 0, y: 0, width: 200, height: 100 },
      { id: 'auto-2', positionMode: 'auto', x: 0, y: 0, width: 300, height: 80 },
      { id: 'auto-3', positionMode: 'auto', x: 0, y: 0, width: 150, height: 120 },
      { id: 'auto-4', positionMode: 'auto', x: 0, y: 0, width: 250, height: 60 }
    ]
  }), []);

  // 2. Pre-process the scene layout through Auto Positioning
  const { layout: autoLayout, diagnostics } = useMemo(() => {
    return applyAutoPositioning(scene, config);
  }, [scene, config]);

  // 3. Resolve the layout into absolute CSS pixel coordinates
  const resolvedLayout = useMemo(() => {
    return resolveSceneLayout(autoLayout);
  }, [autoLayout]);

  // Helper to draw a resolved box
  const renderBox = (id: string, color: string, label: string) => {
    const box = resolvedLayout.get(id);
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
          border: '1px solid rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: 14,
          opacity: 0.9,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        {label}
      </div>
    );
  };

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1>Auto Positioning Demo</h1>
      
      <div style={{ marginBottom: 20, display: 'flex', gap: 20, alignItems: 'center' }}>
        <label>
          <strong>Direction:</strong>
          <select value={config.direction} onChange={e => setConfig(c => ({...c, direction: e.target.value as any}))} style={{ marginLeft: 10 }}>
            <option value="vertical">Vertical</option>
            <option value="horizontal">Horizontal</option>
          </select>
        </label>

        <label>
          <strong>Alignment:</strong>
          <select value={config.alignment} onChange={e => setConfig(c => ({...c, alignment: e.target.value as any}))} style={{ marginLeft: 10 }}>
            <option value="start">Start</option>
            <option value="center">Center</option>
            <option value="end">End</option>
          </select>
        </label>

        <label>
          <strong>Gap (px):</strong>
          <input type="range" min="0" max="100" value={config.gap} onChange={e => setConfig(c => ({...c, gap: parseInt(e.target.value)}))} style={{ marginLeft: 10 }} />
          <span> {config.gap}</span>
        </label>
      </div>
      
      <div 
        style={{ 
          position: 'relative', 
          width: 800, 
          height: 600, 
          backgroundColor: '#fff', 
          border: diagnostics.overflow ? '2px solid red' : '2px solid #ccc',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          overflow: 'hidden' // We hide overflow visually to show what fits in the canvas
        }}
      >
        {/* Render padding guide */}
        <div style={{
          position: 'absolute',
          top: config.padding?.top,
          right: config.padding?.right,
          bottom: config.padding?.bottom,
          left: config.padding?.left,
          border: '1px dashed #cbd5e1',
          pointerEvents: 'none'
        }} />

        {/* Render Absolute Element */}
        {renderBox('absolute-title', '#8b5cf6', 'Absolute Element (Fixed)')}
        
        {/* Render Auto Elements */}
        {renderBox('auto-1', '#3b82f6', 'Auto 1')}
        {renderBox('auto-2', '#10b981', 'Auto 2')}
        {renderBox('auto-3', '#f59e0b', 'Auto 3')}
        {renderBox('auto-4', '#ef4444', 'Auto 4')}
      </div>

      <div style={{ marginTop: 20, fontSize: 13, color: '#64748b', maxWidth: 800 }}>
        {diagnostics.overflow && (
          <div style={{ color: 'red', fontWeight: 'bold', marginBottom: 10 }}>
            ⚠️ Overflow detected in the {diagnostics.overflowDirection} direction! The elements have safely maintained their size, but exceed the canvas.
          </div>
        )}
        <strong>Notice:</strong><br />
        - The Purple box is set to <code>positionMode: 'absolute'</code>. It completely ignores the layout flow.<br />
        - The other four boxes are set to <code>positionMode: 'auto'</code>. They dynamically stack based on direction and gap, safely preventing collisions.<br />
        - The dashed inner border represents the padding area calculated by the engine.<br />
        - This Auto Positioning pass mathematically computes <code>x</code> and <code>y</code> coordinates BEFORE the layout resolver maps them to the DOM.
      </div>
    </div>
  );
}
