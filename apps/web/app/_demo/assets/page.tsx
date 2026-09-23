"use client";

import React, { useMemo, useEffect } from 'react';
import { 
  registerAsset, 
  clearRegistry, 
  selectAsset, 
  AssetRequest 
} from '@ai-content-manager/motion-components/src/assets';

// 1. Register Mock Assets
const setupRegistry = () => {
  clearRegistry();
  
  registerAsset({
    id: 'phone_standard',
    type: 'object',
    categories: ['technology', 'communication'],
    tags: ['mobile', 'smartphone'],
    capabilities: ['shake', 'highlight', 'scale'],
  });

  registerAsset({
    id: 'bar_chart_finance',
    type: 'chart',
    categories: ['finance', 'data', 'business'],
    tags: ['comparison', 'statistics'],
    capabilities: ['draw', 'highlight', 'scale'],
  });

  registerAsset({
    id: 'line_chart_generic',
    type: 'chart',
    categories: ['data'],
    tags: ['trends'],
    capabilities: ['draw', 'scale'],
  });

  registerAsset({
    id: 'credit_card',
    type: 'object',
    categories: ['finance', 'shopping', 'business'],
    tags: ['payment', 'money'],
    capabilities: ['flip', 'highlight'],
  });
};

// 2. Define Example AI Requests
const DEMO_REQUESTS: { title: string, request: AssetRequest }[] = [
  {
    title: "Request: technology + mobile",
    request: {
      type: "object",
      categories: ["technology"],
      tags: ["mobile"]
    }
  },
  {
    title: "Request: business + comparison + chart",
    request: {
      type: "chart",
      categories: ["business"],
      tags: ["comparison"]
    }
  },
  {
    title: "Request: data + draw",
    request: {
      type: "chart",
      categories: ["data"],
      capabilities: ["draw"]
    }
  },
  {
    title: "Request: unknown capability (explode)",
    request: {
      type: "chart",
      capabilities: ["explode"]
    }
  },
  {
    title: "Request: No Type, just needs 'flip'",
    request: {
      capabilities: ["flip"]
    }
  }
];

export default function AssetSelectionDemo() {
  
  useEffect(() => {
    // Setup registry purely on the client for the demo
    setupRegistry();
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 30 }}>Asset Selection Pipeline</h1>
      
      <p style={{ marginBottom: 40, color: '#475569', maxWidth: 800, lineHeight: 1.6 }}>
        This demo shows how abstract AI scene requirements (left) are mathematically evaluated against the central Asset Registry to deterministically resolve the optimal visual component (right).
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {DEMO_REQUESTS.map((demo, i) => {
          
          // Perform the deterministic selection!
          const result = selectAsset(demo.request);

          const isSuccess = !!result.asset;
          const cardColor = isSuccess ? '#ecfdf5' : '#fef2f2';
          const borderColor = isSuccess ? '#10b981' : '#ef4444';

          return (
            <div key={i} style={{ 
              display: 'flex', 
              gap: 30, 
              padding: 20, 
              backgroundColor: 'white', 
              borderRadius: 8, 
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}>
              
              {/* Request Column */}
              <div style={{ flex: 1 }}>
                <h3 style={{ marginTop: 0, color: '#334155' }}>{demo.title}</h3>
                <pre style={{ 
                  backgroundColor: '#f1f5f9', 
                  padding: 15, 
                  borderRadius: 6, 
                  fontSize: 13,
                  overflowX: 'auto',
                  border: '1px solid #cbd5e1'
                }}>
                  {JSON.stringify(demo.request, null, 2)}
                </pre>
              </div>

              {/* Resolution Column */}
              <div style={{ flex: 1, borderLeft: '2px solid #e2e8f0', paddingLeft: 30 }}>
                <h3 style={{ marginTop: 0, color: '#334155' }}>Resolution Result</h3>
                
                <div style={{ 
                  backgroundColor: cardColor, 
                  border: `2px solid ${borderColor}`,
                  padding: 20, 
                  borderRadius: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}>
                  {isSuccess ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 24 }}>✅</span>
                        <span style={{ fontWeight: 'bold', fontSize: 20, color: '#065f46' }}>
                          {result.asset!.id}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#047857' }}>
                        Selected due to scoring weight.<br/>
                        Type: {result.asset!.type}
                      </div>
                      {result.diagnostics && result.diagnostics.length > 0 && (
                        <div style={{ marginTop: 10, fontSize: 12, color: '#b45309', backgroundColor: '#fef3c7', padding: 8, borderRadius: 4 }}>
                          Warning: {result.diagnostics[0].message}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 24 }}>❌</span>
                        <span style={{ fontWeight: 'bold', fontSize: 20, color: '#991b1b' }}>
                          No Match Found
                        </span>
                      </div>
                      {result.diagnostics && (
                        <div style={{ fontSize: 13, color: '#b91c1c' }}>
                          Diagnostic: {result.diagnostics[0].message}
                        </div>
                      )}
                    </>
                  )}
                </div>

              </div>

            </div>
          )
        })}
      </div>
    </div>
  );
}
