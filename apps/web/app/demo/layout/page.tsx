"use client";

import React, { useMemo, useState } from 'react';
import { resolveSceneLayout, SceneLayout } from '@ai-content-manager/motion-components/src/layout';

export default function LayoutDemoPage() {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // 1. Scene Definition
  // We define the abstract elements and their relative/anchored positions.
  const scene: SceneLayout = useMemo(() => ({
    width: canvasSize.width,
    height: canvasSize.height,
    elements: [
      {
        id: 'title',
        x: canvasSize.width / 2,
        y: 50,
        width: 300,
        height: 50,
        anchor: 'top-center'
      },
      {
        id: 'chart-group',
        x: canvasSize.width / 2,
        y: 200,
        width: 400,
        height: 300,
        anchor: 'top-center',
        children: [
          {
            id: 'chart-body',
            x: 0, y: 0, width: 400, height: 300, anchor: 'top-left' // fills the group
          },
          {
            id: 'chart-label',
            x: 200, // Center of group width
            y: 150, // Center of group height
            width: 100, height: 30,
            anchor: 'center'
          }
        ]
      },
      {
        id: 'supporting-text',
        // Relative to the chart group!
        relativeTo: 'chart-group',
        relativeAnchor: 'bottom-center', // Pin to the bottom center of the chart
        anchor: 'top-center', // The text's own top-center touches the relative point
        offsetX: 0,
        offsetY: 40, // 40px gap below the chart
        x: 0,
        y: 0,
        width: 200,
        height: 20
      },
      // Demonstrate absolute anchors independently
      { id: 'box-tl', x: 50, y: 50, width: 40, height: 40, anchor: 'top-left' },
      { id: 'box-c', x: 50, y: 50, width: 40, height: 40, anchor: 'center' },
      { id: 'box-br', x: 50, y: 50, width: 40, height: 40, anchor: 'bottom-right' },
    ]
  }), [canvasSize]);

  // 2. Resolve the layout into absolute top-left CSS pixel coordinates
  const resolvedLayout = useMemo(() => {
    return resolveSceneLayout(scene);
  }, [scene]);

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
          fontSize: 12,
          opacity: 0.8
        }}
      >
        {label}
      </div>
    );
  };

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1>Scene Layout Engine Demo</h1>
      <p>
        Toggle Canvas Size: 
        <button onClick={() => setCanvasSize({ width: 800, height: 600 })} style={{ marginLeft: 10 }}>800x600</button>
        <button onClick={() => setCanvasSize({ width: 400, height: 600 })} style={{ marginLeft: 10 }}>400x600 (Mobile)</button>
        <button onClick={() => setCanvasSize({ width: 1000, height: 400 })} style={{ marginLeft: 10 }}>1000x400 (Wide)</button>
      </p>
      
      <div 
        style={{ 
          position: 'relative', 
          width: canvasSize.width, 
          height: canvasSize.height, 
          backgroundColor: '#fff', 
          border: '2px solid #ccc',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          marginTop: 20,
          transition: 'all 0.3s ease'
        }}
      >
        {/* Render Anchor Demo (Fixed at 50,50) */}
        <div style={{ position: 'absolute', left: 50, top: 50, width: 4, height: 4, backgroundColor: 'red', borderRadius: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }} title="Anchor Point (50,50)" />
        {renderBox('box-tl', '#10b981', 'TL')}
        {renderBox('box-c', '#3b82f6', 'C')}
        {renderBox('box-br', '#f59e0b', 'BR')}

        {/* Render Main Scene */}
        {renderBox('title', '#8b5cf6', 'TITLE (Centered at X)')}
        {renderBox('chart-body', '#cbd5e1', 'CHART BACKGROUND (Group Child)')}
        {renderBox('chart-label', '#ef4444', 'CHART LABEL (Group Child Centered)')}
        {renderBox('supporting-text', '#14b8a6', 'SUPPORTING TEXT (Relative to Chart)')}

      </div>

      <div style={{ marginTop: 20, fontSize: 12, color: '#64748b' }}>
        <strong>Notice:</strong><br />
        - The small overlapping colored squares demonstrate anchors. All three are placed at exactly (x: 50, y: 50) but render differently based on their anchor (top-left, center, bottom-right). The red dot is the target coordinate.<br />
        - The Chart Background and Chart Label are in a Group, so their positions are relative to the group's origin.<br />
        - The Supporting Text is entirely dynamically positioned relative to the bottom of the Chart group.
      </div>
    </div>
  );
}
