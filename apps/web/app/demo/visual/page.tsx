'use client';

import React, { useState, useMemo } from 'react';
import { DeterministicStoryPlanner } from '@motion/story/story.planner';
import { DeterministicVisualPlanner } from '@motion/visual/visual.planner';
import { StoryPlanRequest } from '@motion/story/story.types';
import { VisualPlan } from '@motion/visual/visual.types';

export default function VisualDemoPage() {
  const [topic, setTopic] = useState('Explain how compound interest works.');

  const storyPlanner = useMemo(() => new DeterministicStoryPlanner(), []);
  const visualPlanner = useMemo(() => new DeterministicVisualPlanner(), []);

  const visualPlan = useMemo<VisualPlan | null>(() => {
    if (!topic.trim()) return null;
    
    try {
      const request: StoryPlanRequest = { topic };
      const storyPlan = storyPlanner.plan(request);
      return visualPlanner.plan(storyPlan);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [topic, storyPlanner, visualPlanner]);

  const presetTopics = [
    'Explain how compound interest works.',
    'Explain why startup product-market fit matters.',
    'Teach beginners how APIs work.',
    'React vs Vue: which is better?',
    'Why is paying minimum balances on credit cards bad?'
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-8 text-gray-100 font-sans flex flex-col gap-8">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Visual Planner</h1>
          <p className="text-gray-400">
            Converts a semantic Story Plan into structural Visual Intent assigning Scene Templates.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-4 shadow-lg">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Topic</label>
            <input 
              type="text" 
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Presets</label>
            <div className="flex flex-wrap gap-2">
              {presetTopics.map(t => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className="bg-gray-800 hover:bg-gray-700 text-xs px-3 py-1.5 rounded-full transition-colors border border-gray-700 hover:border-gray-600 text-left"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold border-b border-gray-800 pb-2 mt-4">Visual Scene Sequence</h2>
        
        {!visualPlan ? (
          <div className="text-gray-500 italic">Enter a topic to generate a plan.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visualPlan.scenes.map((scene, i) => (
              <div 
                key={scene.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4 shadow-md"
              >
                <div className="flex justify-between items-start border-b border-gray-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-blue-900/40 text-blue-300 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border border-blue-800/50">
                        {scene.visualType}
                      </span>
                      <span className="text-gray-500 text-xs">Scene #{i + 1}</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-2">{scene.purpose}</p>
                    <p className="text-gray-300 text-sm italic mt-1">&quot;{scene.visualDescription}&quot;</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Visual Elements</h4>
                  <div className="flex flex-col gap-2">
                    {scene.elements.map(el => (
                      <div key={el.id} className="bg-gray-950 border border-gray-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${
                            el.importance === 'high' ? 'bg-red-500' :
                            el.importance === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                          }`} />
                          <span className="text-xs font-medium text-gray-300">{el.role}</span>
                          <span className="text-gray-600 text-xs px-1">•</span>
                          <span className="text-xs text-gray-400 font-mono">{el.semanticType}</span>
                        </div>
                        <p className="text-sm text-gray-200 ml-4">{el.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {scene.attention && scene.attention.length > 0 && (
                  <div className="mt-2 bg-purple-900/20 border border-purple-800/30 p-3 rounded-lg">
                    <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">Attention Intent</h4>
                    {scene.attention.map((att, idx) => (
                      <div key={idx} className="text-sm text-purple-200 flex items-center gap-2">
                        <span>⚡</span>
                        <span>{att.type} on <code>{att.targetId}</code></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
