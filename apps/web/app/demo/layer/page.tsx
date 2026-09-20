"use client";

import React, { useMemo, useState } from 'react';
import { 
  SceneLayout, 
  resolveLayerOrder, 
  bringToFront, 
  sendToBack, 
  bringForward, 
  sendBackward 
} from '@ai-content-manager/motion-components/src/layout';

export default function LayerDemoPage() {
  // We use state for the layout so we can mutate it interactively
  const [scene, setScene] = useState<SceneLayout>({
    width: 800,
    height: 600,
    elements: [
      { id: 'background', x: 0, y: 0, width: 800, height: 600, layer: 0 },
      { id: 'circle', x: 200, y: 200, width: 200, height: 200, layer: 10 },
      { id: 'card', x: 300, y: 250, width: 300, height: 200, layer: 20 },
      { id: 'text', x: 320, y: 270, width: 260, height: 160, layer: 30 },
      { 
        id: 'group', 
        x: 100, y: 100, width: 200, height: 200, 
        layer: 15, // Renders between Circle and Card
        children: [
          { id: 'group-bg', x: 10, y: 10, width: 180, height: 180, layer: 5 }, // Layer inside group
          { id: 'group-text', x: 20, y: 20, width: 160, height: 160, layer: 10 }
        ] 
      }
    ]
  });

  // Resolve the flat rendering array natively
  const sortedElements = useMemo(() => resolveLayerOrder(scene.elements), [scene]);

  const handleAction = (action: 'front' | 'back' | 'forward' | 'backward', id: string) => {
    setScene(prev => {
      switch (action) {
        case 'front': return bringToFront(prev, id);
        case 'back': return sendToBack(prev, id);
        case 'forward': return bringForward(prev, id);
        case 'backward': return sendBackward(prev, id);
      }
    });
  };

  // Dummy renderer just to visualize SVG ordering natively
  const renderElement = (el: any) => {
    if (el.children) {
      return (
        <g key={el.id} transform={`translate(${el.x}, ${el.y})`}>
          {el.children.map(renderElement)}
        </g>
      );
    }
    
    // Style mapped strictly based on ID for demo visualization
    let fill = '#cbd5e1';
    let label = el.id;
    if (el.id === 'background') fill = '#f8fafc';
    if (el.id === 'circle') fill = '#ef4444';
    if (el.id === 'card') fill = '#3b82f6';
    if (el.id === 'text') fill = '#f59e0b';
    if (el.id === 'group-bg') fill = '#10b981';
    if (el.id === 'group-text') fill = '#8b5cf6';

    const isCircle = el.id === 'circle';

    return (
      <g key={el.id}>
        {isCircle ? (
          <circle cx={el.x + el.width/2} cy={el.y + el.height/2} r={el.width/2} fill={fill} stroke="#000" strokeWidth="2" />
        ) : (
          <rect x={el.x} y={el.y} width={el.width} height={el.height} fill={fill} stroke="#000" strokeWidth="2" rx={el.id === 'card' ? 10 : 0} />
        )}
        <text x={el.x + 20} y={el.y + 40} fill="#fff" fontWeight="bold" style={{ pointerEvents: 'none' }}>
          {label} (L: {el.layer})
        </text>
      </g>
    );
  };

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1>Layer Management Demo</h1>
      
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <div>
          <strong>Modify 'Card':</strong><br/>
          <button onClick={() => handleAction('front', 'card')}>Bring to Front</button>
          <button onClick={() => handleAction('back', 'card')}>Send to Back</button>
          <button onClick={() => handleAction('forward', 'card')}>Bring Forward (+)</button>
          <button onClick={() => handleAction('backward', 'card')}>Send Backward (-)</button>
        </div>
        <div>
          <strong>Modify 'Circle':</strong><br/>
          <button onClick={() => handleAction('front', 'circle')}>Bring to Front</button>
          <button onClick={() => handleAction('back', 'circle')}>Send to Back</button>
          <button onClick={() => handleAction('forward', 'circle')}>Bring Forward (+)</button>
          <button onClick={() => handleAction('backward', 'circle')}>Send Backward (-)</button>
        </div>
        <div>
          <strong>Modify 'Group':</strong><br/>
          <button onClick={() => handleAction('front', 'group')}>Bring to Front</button>
          <button onClick={() => handleAction('back', 'group')}>Send to Back</button>
          <button onClick={() => handleAction('forward', 'group')}>Bring Forward (+)</button>
          <button onClick={() => handleAction('backward', 'group')}>Send Backward (-)</button>
        </div>
      </div>
      
      <div style={{ position: 'relative', width: 800, height: 600, border: '2px solid #ccc', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <svg width="800" height="600" viewBox="0 0 800 600">
          {/* Natively relying on array document order. NO z-index used here! */}
          {sortedElements.map(renderElement)}
        </svg>
      </div>

      <div style={{ marginTop: 20, fontSize: 13, color: '#64748b', maxWidth: 800 }}>
        <strong>Notice:</strong><br />
        - This demo completely ignores CSS <code>z-index</code>. The shapes are painted strictly based on the order returned by <code>resolveLayerOrder()</code>, proving it works flawlessly for deterministic SVG rendering.<br />
        - The 'Group' acts as an isolated stacking context. Its children (group-bg, group-text) sort themselves internally, but the entire group renders at its global layer relative to the other shapes.<br />
        - Watch the <code>(L: X)</code> label on the shapes update dynamically as you use the modifier buttons!
      </div>
    </div>
  );
}
