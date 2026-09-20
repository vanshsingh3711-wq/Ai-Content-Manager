'use client';

import React, { useState, useEffect } from 'react';
import { 
  instantiateTemplate, 
  listTemplates, 
  TemplateInput 
} from '@ai-content-manager/motion-components/src/templates';
import { 
  SceneResolutionContext, 
  resolveSceneGraph 
} from '@ai-content-manager/motion-components/src/scene';
import { getAnchorOffset } from '@ai-content-manager/motion-components/src/layout/layout.utils';
import { registerAsset, clearRegistry } from '@ai-content-manager/motion-components/src/assets/assets.registry';

export default function TemplatesDemoPage() {
  const [activeTemplate, setActiveTemplate] = useState<string>('hero_statement');
  const [sceneGraph, setSceneGraph] = useState<any>(null);

  const templates = listTemplates();

  useEffect(() => {
    // 1. Setup Environment (Mock Asset Registry)
    clearRegistry();
    registerAsset({ id: 'title_asset', type: 'text', tags: ['headline'], capabilities: [], intrinsicSize: { width: 800, height: 100 } });
    registerAsset({ id: 'caption_asset', type: 'text', tags: ['caption'], capabilities: [], intrinsicSize: { width: 600, height: 60 } });
    registerAsset({ id: 'chart_asset', type: 'image', tags: ['data'], capabilities: [], intrinsicSize: { width: 600, height: 400 } });
    registerAsset({ id: 'mockup_asset', type: 'image', tags: ['ui'], capabilities: [], intrinsicSize: { width: 300, height: 600 } });
    registerAsset({ id: 'icon_asset', type: 'image', tags: ['icon'], capabilities: [], intrinsicSize: { width: 100, height: 100 } });

    // 2. Mock inputs for different templates
    const mockInputs: Record<string, TemplateInput> = {
      hero_statement: {
        templateId: 'hero_statement',
        slots: {
          title: { assetRequest: { type: 'text', tags: ['headline'] } },
          visual: { assetRequest: { type: 'image', tags: ['ui'] } }
        }
      },
      single_focus: {
        templateId: 'single_focus',
        slots: {
          visual: { assetRequest: { type: 'image', tags: ['ui'] } },
          caption: { assetRequest: { type: 'text', tags: ['caption'] } }
        }
      },
      text_visual: {
        templateId: 'text_visual',
        config: { direction: 'horizontal', alignment: 'start' },
        slots: {
          text: { assetRequest: { type: 'text', tags: ['caption'] } },
          visual: { assetRequest: { type: 'image', tags: ['ui'] } }
        }
      },
      chart_insight: {
        templateId: 'chart_insight',
        slots: {
          insight: { assetRequest: { type: 'text', tags: ['headline'] } },
          chart: { assetRequest: { type: 'image', tags: ['data'] } }
        }
      },
      comparison: {
        templateId: 'comparison',
        slots: {
          left: { assetRequest: { type: 'image', tags: ['ui'] } },
          right: { assetRequest: { type: 'image', tags: ['ui'] } },
          label: { assetRequest: { type: 'text', tags: ['caption'] } }
        }
      },
      before_after: {
        templateId: 'before_after',
        slots: {
          before: { assetRequest: { type: 'image', tags: ['data'] } },
          after: { assetRequest: { type: 'image', tags: ['data'] } }
        }
      },
      step_by_step: {
        templateId: 'step_by_step',
        config: { stepCount: 4, direction: 'vertical' },
        slots: {
          step_1: { assetRequest: { type: 'text', tags: ['caption'] } },
          step_2: { assetRequest: { type: 'text', tags: ['caption'] } },
          step_3: { assetRequest: { type: 'text', tags: ['caption'] } },
          step_4: { assetRequest: { type: 'text', tags: ['caption'] } }
        }
      },
      timeline: {
        templateId: 'timeline',
        config: { stepCount: 5 },
        slots: {
          point_1: { assetRequest: { type: 'image', tags: ['icon'] } },
          point_2: { assetRequest: { type: 'image', tags: ['icon'] } },
          point_3: { assetRequest: { type: 'image', tags: ['icon'] } },
          point_4: { assetRequest: { type: 'image', tags: ['icon'] } },
          point_5: { assetRequest: { type: 'image', tags: ['icon'] } }
        }
      },
      kpi_visual: {
        templateId: 'kpi_visual',
        slots: {
          kpi: { assetRequest: { type: 'text', tags: ['headline'] } },
          visual: { assetRequest: { type: 'image', tags: ['data'] } }
        }
      },
      full_screen_quote: {
        templateId: 'full_screen_quote',
        slots: {
          quote: { assetRequest: { type: 'text', tags: ['headline'] } },
          attribution: { assetRequest: { type: 'text', tags: ['caption'] } }
        }
      }
    };

    const activeInput = mockInputs[activeTemplate];

    // 3. Pipeline: Template -> SceneDefinition -> ResolvedSceneGraph
    const { scene } = instantiateTemplate(activeInput);
    
    if (scene) {
      const context: SceneResolutionContext = {
        canvas: { width: 1080, height: 1920 },
        fps: 30,
        autoRepair: true
      };
      const resolved = resolveSceneGraph(scene, context);
      setSceneGraph(resolved);
    }

  }, [activeTemplate]);

  return (
    <div className="p-8 bg-gray-950 min-h-screen text-gray-100 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-white tracking-tight">Scene Templates & Composition Patterns</h1>
        <p className="text-gray-400 mb-8 max-w-2xl text-lg">
          Select a declarative template. The system dynamically builds the structural scene graph (relationships, anchors, constraints), 
          runs it through the Asset Selector and Layout Engine, and renders the mathematical output.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Template Selection Sidebar */}
          <div className="col-span-1 bg-gray-900 rounded-xl p-4 border border-gray-800 shadow-md h-min">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 px-2">Core Templates</h2>
            <div className="flex flex-col gap-2">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTemplate(t.id)}
                  className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTemplate === t.id 
                      ? 'bg-indigo-600 text-white' 
                      : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{t.name}</span>
                    <span className="text-[10px] uppercase opacity-50">{t.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Canvas visualization */}
          <div className="col-span-1 lg:col-span-2 flex justify-center items-center bg-black/20 rounded-2xl p-8 border border-gray-800/50">
            {sceneGraph ? (
              <div className="relative border-4 border-gray-800 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl transition-all" 
                   style={{ width: '360px', height: `${360 * (1920/1080)}px` }}>
                
                {/* Render Resolved Elements */}
                {sceneGraph.elements.map((el: any) => {
                  const scale = 360 / 1080;
                  
                  // Convert anchored geometry to absolute top-left for the DOM
                  const offset = getAnchorOffset(el.geometry.width, el.geometry.height, el.anchor);
                  const absoluteLeft = el.geometry.x + offset.x;
                  const absoluteTop = el.geometry.y + offset.y;

                  return (
                    <div
                      key={el.id}
                      className="absolute border border-indigo-500/50 bg-indigo-500/20 backdrop-blur-sm rounded flex flex-col items-center justify-center p-2 shadow-lg transition-all duration-700 ease-out"
                      style={{
                        left: absoluteLeft * scale,
                        top: absoluteTop * scale,
                        width: el.geometry.width * scale,
                        height: el.geometry.height * scale,
                      }}
                    >
                      <span className="font-bold text-xs tracking-wide text-indigo-100">{el.id}</span>
                      <span className="text-[10px] opacity-75 font-mono mt-1 text-indigo-300">{el.assetId}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-500 animate-pulse">Processing Template...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
