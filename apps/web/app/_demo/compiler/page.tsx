'use client';

import React, { useState, useMemo } from 'react';
import { DeterministicStoryPlanner } from '@motion/story/story.planner';
import { DeterministicVisualPlanner } from '@motion/visual/visual.planner';
import { DeterministicSceneJsonGenerator } from '@motion/scene/scene-json.generator';
import { DeterministicSceneCompiler } from '@motion/scene/scene.compiler';
import { StoryPlanRequest } from '@motion/story/story.types';
import { SceneDefinition } from '@motion/scene/scene.types';

export default function SceneCompilerDemoPage() {
  const [topic, setTopic] = useState('Why does credit card debt grow quickly?');

  const storyPlanner = useMemo(() => new DeterministicStoryPlanner(), []);
  const visualPlanner = useMemo(() => new DeterministicVisualPlanner(), []);
  const sceneGenerator = useMemo(() => new DeterministicSceneJsonGenerator(), []);
  const compiler = useMemo(() => new DeterministicSceneCompiler(), []);

  const compiledScenes = useMemo<SceneDefinition[] | null>(() => {
    if (!topic.trim()) return null;
    
    try {
      const request: StoryPlanRequest = { topic };
      const storyPlan = storyPlanner.plan(request);
      const visualPlan = visualPlanner.plan(storyPlan);
      const sceneJsons = sceneGenerator.generate(storyPlan, visualPlan);
      
      // Compile each Scene JSON into a Scene Definition
      return sceneJsons.map(json => compiler.compile(json));
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [topic, storyPlanner, visualPlanner, sceneGenerator, compiler]);

  const presetTopics = [
    'Why does credit card debt grow quickly?',
    'How do APIs work?',
    'Explain compound interest.',
    'What is serverless computing?'
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-8 text-gray-100 font-sans flex flex-col gap-8">
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">AI → Scene Graph Compiler</h1>
          <p className="text-gray-400">
            Converts declarative SceneJSON into deterministic SceneDefinitions ready for the layout engine.
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

        <h2 className="text-xl font-semibold border-b border-gray-800 pb-2 mt-4">Compiled Scene Definitions</h2>
        
        {!compiledScenes ? (
          <div className="text-gray-500 italic">Enter a topic to generate definitions.</div>
        ) : (
          <div className="flex flex-col gap-6">
            {compiledScenes.map((scene, i) => (
              <div 
                key={scene.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-md"
              >
                <div className="bg-gray-800/50 px-5 py-3 border-b border-gray-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-mono text-sm">Compiled Scene {i + 1}</span>
                    <span className="bg-purple-900/30 text-purple-400 border border-purple-800/50 px-2 py-0.5 rounded text-xs font-mono">
                      {scene.id}
                    </span>
                  </div>
                </div>
                
                <div className="p-5 overflow-x-auto">
                  <pre className="text-sm font-mono text-gray-300">
                    {JSON.stringify(scene, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
