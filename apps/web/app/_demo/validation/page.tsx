"use client";

import React, { useMemo } from 'react';
import { validateComposition, CompositionValidationConfig } from '@ai-content-manager/motion-components/src/validation';
import { ResolvedPlacement } from '@ai-content-manager/motion-components/src/placement';
import { SafeZoneDefinition } from '@ai-content-manager/motion-components/src/layout/layout.types';
import { getAnchorOffset } from '@ai-content-manager/motion-components/src/layout/layout.utils';

const CANVAS = { width: 1080, height: 1920 };

const SAFE_ZONES: SafeZoneDefinition[] = [
  { id: 'logo_zone', type: 'restricted', x: 50, y: 50, width: 200, height: 150 }
];

// Intentionally flawed placements to trigger the validation engine
const SCENARIO_PLACEMENTS: ResolvedPlacement[] = [
  // 1. Valid Element
  { id: 'title', assetId: 'title', x: 540, y: 400, width: 600, height: 150, anchor: 'center' },
  
  // 2. Duplicate ID (will error)
  { id: 'title', assetId: 'title2', x: 540, y: 600, width: 600, height: 150, anchor: 'center' },
  
  // 3. Overflowing Element (Auto-Repair will fix this!)
  { id: 'overflow_box', assetId: 'box', x: 1000, y: 1500, width: 300, height: 300, anchor: 'top-left' },
  
  // 4. Safe Zone Violation (Overlaps logo_zone)
  { id: 'bad_logo', assetId: 'logo', x: 100, y: 100, width: 200, height: 200, anchor: 'center' },
  
  // 5. Collision (Overlaps with title2)
  { id: 'colliding_box', assetId: 'box', x: 540, y: 650, width: 200, height: 200, anchor: 'center' }
];

const CONFIG: CompositionValidationConfig = {
  autoRepair: true,
  repairOverflow: true,
  allowClamping: true
};

export default function ValidationDemo() {
  
  const result = useMemo(() => {
    return validateComposition(SCENARIO_PLACEMENTS, CANVAS, CONFIG, [], SAFE_ZONES);
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', gap: 40 }}>
      
      {/* Controls & Diagnostics */}
      <div style={{ width: 450, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1>Validation & Auto-Repair</h1>
        
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          This visualizer executes the <b>Render Gate Validation Engine</b>. It scans the layout for mathematical errors, duplicate IDs, collisions, and safe-zone violations.
        </p>

        {/* Validation Status */}
        <div style={{ 
          padding: 20, 
          borderRadius: 8, 
          backgroundColor: result.valid ? '#ecfdf5' : '#fef2f2',
          border: `2px solid ${result.valid ? '#10b981' : '#ef4444'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 15
        }}>
          <span style={{ fontSize: 32 }}>{result.valid ? '✅' : '❌'}</span>
          <div>
            <h2 style={{ margin: 0, color: result.valid ? '#065f46' : '#991b1b' }}>
              {result.valid ? 'Safe to Render' : 'Render Blocked'}
            </h2>
            <div style={{ fontSize: 14, color: result.valid ? '#047857' : '#b91c1c', marginTop: 4 }}>
              canRenderComposition(result) === {result.valid.toString()}
            </div>
          </div>
        </div>

        {/* Diagnostics List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {result.diagnostics.map((d, i) => {
            const isError = d.severity === 'error';
            const isInfo = d.severity === 'info';
            return (
              <div key={i} style={{ 
                padding: 12, 
                borderRadius: 6, 
                backgroundColor: isError ? '#fef2f2' : isInfo ? '#eff6ff' : '#fffbeb',
                border: `1px solid ${isError ? '#fecaca' : isInfo ? '#bfdbfe' : '#fde68a'}`,
                fontSize: 13,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                <div style={{ fontWeight: 'bold', color: isError ? '#991b1b' : isInfo ? '#1e3a8a' : '#92400e' }}>
                  [{d.severity.toUpperCase()}] {d.type}
                </div>
                <div style={{ color: isError ? '#b91c1c' : isInfo ? '#2563eb' : '#b45309' }}>
                  {d.message}
                </div>
              </div>
            )
          })}
        </div>

      </div>

      {/* Canvas View */}
      <div style={{ 
        position: 'relative', 
        width: CANVAS.width * 0.4,
        height: CANVAS.height * 0.4,
        backgroundColor: '#fff',
        border: '2px solid #ccc',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        
        {/* Draw Restricted Safe Zones */}
        {SAFE_ZONES.map(zone => (
          <div key={zone.id} style={{
            position: 'absolute',
            left: zone.x * 0.4,
            top: zone.y * 0.4,
            width: zone.width * 0.4,
            height: zone.height * 0.4,
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '2px dashed #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            fontWeight: 'bold',
            fontSize: 12
          }}>
            Restricted Zone
          </div>
        ))}

        {/* Draw Placements */}
        {result.placements.map((p, index) => {
          const offset = getAnchorOffset(p.width, p.height, p.anchor);
          const absoluteX = p.x + offset.x;
          const absoluteY = p.y + offset.y;
          
          // Check if this specific element had an error/warning
          const hasError = result.diagnostics.some(d => d.severity === 'error' && d.elementIds?.includes(p.id));
          const hasWarning = result.diagnostics.some(d => d.severity === 'warning' && d.elementIds?.includes(p.id));
          
          // Check if it was auto-repaired
          const wasRepaired = result.repairs.some(r => r.elementId === p.id);

          const bgColor = hasError ? 'rgba(239, 68, 68, 0.3)' : hasWarning ? 'rgba(245, 158, 11, 0.3)' : wasRepaired ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.2)';
          const borderColor = hasError ? '#ef4444' : hasWarning ? '#f59e0b' : wasRepaired ? '#10b981' : '#3b82f6';

          return (
            <div 
              key={`${p.id}_${index}`}
              style={{
                position: 'absolute',
                left: absoluteX * 0.4,
                top: absoluteY * 0.4,
                width: p.width * 0.4,
                height: p.height * 0.4,
                backgroundColor: bgColor,
                border: `2px solid ${borderColor}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: borderColor,
                fontWeight: 'bold',
                fontSize: 14,
                textAlign: 'center'
              }}
            >
              <div>{p.id}</div>
              {wasRepaired && <div style={{ fontSize: 10, marginTop: 4 }}>✨ Auto-Repaired</div>}
            </div>
          );
        })}
      </div>

    </div>
  );
}
