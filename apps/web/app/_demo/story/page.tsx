'use client';

import React, { useState, useMemo } from 'react';
import { DeterministicStoryPlanner } from '@motion/story/story.planner';
import { StoryPlanRequest, StoryPlan } from '@motion/story/story.types';

export default function StoryDemoPage() {
  const [topic, setTopic] = useState('Explain why credit card debt grows quickly.');
  const [maxBeats, setMaxBeats] = useState<number | ''>('');
  const [duration, setDuration] = useState<number | ''>('');

  const planner = useMemo(() => new DeterministicStoryPlanner(), []);

  const plan = useMemo<StoryPlan | null>(() => {
    if (!topic.trim()) return null;
    
    try {
      const request: StoryPlanRequest = { topic };
      if (maxBeats && typeof maxBeats === 'number' && maxBeats > 0) {
        request.constraints = { maxBeats };
      }
      if (duration && typeof duration === 'number' && duration > 0) {
        request.durationInFrames = duration;
      }
      return planner.plan(request);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [topic, maxBeats, duration, planner]);

  const presetTopics = [
    'Explain why credit card debt grows quickly.',
    'Explain how APIs work.',
    'React vs Vue: which is better?',
    'Teach beginners how to bake bread.',
    'Why startup product-market fit matters.'
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-8 text-gray-100 font-sans flex flex-col md:flex-row gap-8">
      {/* Left Column: Controls */}
      <div className="w-full md:w-1/3 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Story Planner</h1>
          <p className="text-gray-400">
            Converts a high-level topic into a deterministic sequence of narrative beats.
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

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Max Beats</label>
              <input 
                type="number" 
                min="2"
                placeholder="Unlimited"
                value={maxBeats}
                onChange={e => setMaxBeats(e.target.value ? parseInt(e.target.value, 10) : '')}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Duration (Frames)</label>
              <input 
                type="number" 
                min="30"
                placeholder="Not assigned"
                value={duration}
                onChange={e => setDuration(e.target.value ? parseInt(e.target.value, 10) : '')}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Visualization */}
      <div className="w-full md:w-2/3 flex flex-col gap-6">
        <h2 className="text-xl font-semibold border-b border-gray-800 pb-2">Generated Narrative Beats</h2>
        
        {!plan ? (
          <div className="text-gray-500 italic">Enter a topic to generate a plan.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {plan.beats.map((beat, i) => (
              <div 
                key={beat.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3 shadow-md relative overflow-hidden"
              >
                {/* Decorative side bar matching priority */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  beat.importance === 'high' ? 'bg-red-500' :
                  beat.importance === 'medium' ? 'bg-blue-500' : 'bg-gray-600'
                }`} />

                <div className="flex justify-between items-start ml-2">
                  <div className="flex items-center gap-3">
                    <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase border border-gray-700">
                      {beat.type}
                    </span>
                    <span className="text-gray-500 text-sm font-mono">#{i + 1}</span>
                  </div>
                  
                  {beat.suggestedDurationInFrames && (
                    <div className="text-xs font-mono bg-blue-900/30 text-blue-300 px-2 py-1 rounded border border-blue-800/50">
                      {beat.suggestedDurationInFrames} frames
                    </div>
                  )}
                </div>

                <div className="ml-2 mt-1">
                  <h3 className="text-lg font-medium text-white mb-1">{beat.message}</h3>
                  <p className="text-gray-400 text-sm">Purpose: {beat.purpose}</p>
                </div>
              </div>
            ))}

            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Raw JSON Output</h3>
              <pre className="bg-gray-900 border border-gray-800 p-4 rounded-lg overflow-x-auto text-xs text-gray-300 font-mono shadow-inner">
                {JSON.stringify(plan, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
