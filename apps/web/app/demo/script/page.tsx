'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEditorStore } from '@ai-content-manager/motion-components/src/editor';
import { DeterministicScriptAnalyzer } from '@ai-content-manager/motion-components/src/story/script.analyzer';
import { DeterministicTTSDirector } from '@ai-content-manager/motion-components/src/audio/tts.director';
import { DeterministicVisualPlanner } from '@ai-content-manager/motion-components/src/visual/visual.planner';
import { DeterministicSceneJsonGenerator } from '@ai-content-manager/motion-components/src/scene/scene-json.generator';
import { DeterministicSFXPlanner } from '@ai-content-manager/motion-components/src/audio/sfx.planner';
import { DeterministicSceneCompiler } from '@ai-content-manager/motion-components/src/scene/scene.compiler';
import { StoryPlan } from '@ai-content-manager/motion-components/src/story/story.types';
import { AudioTimeline } from '@ai-content-manager/motion-components/src/generation/generation.types';
import { SceneDefinition } from '@ai-content-manager/motion-components/src/scene/scene.types';
import { validateSceneJson } from '@ai-content-manager/motion-components/src/scene/scene-json.validation';

export default function ScriptStudioPage() {
  const router = useRouter();
  const store = useEditorStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [scriptText, setScriptText] = useState("Did you know honey never spoils?\n\nArchaeologists have found pots of honey in ancient Egyptian tombs that are over 3000 years old.\n\nAnd they are still perfectly safe to eat!");
  const [topic, setTopic] = useState("Honey Facts");
  const [isLoading, setIsLoading] = useState(false);

  // Agent State
  const [storyPlan, setStoryPlan] = useState<StoryPlan | null>(null);
  const [audioTimeline, setAudioTimeline] = useState<AudioTimeline | null>(null);

  // Agent Instances
  const analyzer = useMemo(() => new DeterministicScriptAnalyzer(), []);
  const ttsDirector = useMemo(() => new DeterministicTTSDirector(), []);
  const visualPlanner = useMemo(() => new DeterministicVisualPlanner(), []);
  const jsonGenerator = useMemo(() => new DeterministicSceneJsonGenerator(), []);
  const sfxPlanner = useMemo(() => new DeterministicSFXPlanner(), []);
  const sceneCompiler = useMemo(() => new DeterministicSceneCompiler(), []);

  const handleAnalyze = async () => {
    if (!scriptText.trim()) return;
    setIsLoading(true);
    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const plan = analyzer.analyze(scriptText, topic);
    setStoryPlan(plan);
    setStep(2);
    setIsLoading(false);
  };

  const handleGenerateAudio = async () => {
    if (!storyPlan) return;
    setIsLoading(true);
    // Simulate TTS API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const timeline = ttsDirector.generateAudioTimeline(storyPlan, 30);
    setAudioTimeline(timeline);
    setStep(3);
    setIsLoading(false);
  };

  const handleAssemble = async () => {
    if (!storyPlan || !audioTimeline) return;
    setIsLoading(true);
    // Simulate AI assembly
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Agent 3: Visuals
      const visualPlan = visualPlanner.plan(storyPlan);
      let sceneJsons = jsonGenerator.generate(storyPlan, visualPlan);
      
      // Agent 4: Sound Design
      sceneJsons = sfxPlanner.planSFX(sceneJsons, audioTimeline);

      // Compiler (Flatten graph)
      const masterElements = [];
      let currentFrame = 0;

      for (const sceneJson of sceneJsons) {
        validateSceneJson(sceneJson); // Throws if invalid
        const compiledScene = sceneCompiler.compile(sceneJson, { 
          viewport: { width: 1080, height: 1920 },
          fps: 30 
        });

        const duration = sceneJson.durationInFrames || 150;
        
        const offsetElements = compiledScene.elements.map(el => {
          const newEl = { ...el };
          if (newEl.timing) {
            newEl.timing = {
              ...newEl.timing,
              startFrame: (newEl.timing.startFrame || 0) + currentFrame
            };
          } else {
            newEl.timing = {
              startFrame: currentFrame,
              durationInFrames: duration
            };
          }
          return newEl;
        });

        masterElements.push(...offsetElements);
        currentFrame += duration;
      }

      const masterScene: SceneDefinition = {
        id: `script_gen_${Date.now()}`,
        durationInFrames: currentFrame,
        themeId: 'premium_dark',
        elements: masterElements,
      };

      store.applyGeneratedProject(masterScene);
      router.push('/demo/editor');

    } catch (err) {
      console.error(err);
      alert("Assembly failed. Check console.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="h-16 border-b border-gray-800 flex items-center px-6 shrink-0 bg-gray-900">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Script Studio (Multi-Agent Pipeline)
        </h1>
        <div className="ml-auto flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${step >= 1 ? 'bg-blue-600' : 'bg-gray-800'}`}>1. Ingestion</div>
          <div className="w-4 h-[1px] bg-gray-700"></div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${step >= 2 ? 'bg-blue-600' : 'bg-gray-800'}`}>2. Analysis</div>
          <div className="w-4 h-[1px] bg-gray-700"></div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${step >= 3 ? 'bg-blue-600' : 'bg-gray-800'}`}>3. Audio</div>
          <div className="w-4 h-[1px] bg-gray-700"></div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${step >= 4 ? 'bg-green-600' : 'bg-gray-800'}`}>4. Assembly</div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Controls */}
        <div className="w-[500px] border-r border-gray-800 p-6 flex flex-col bg-gray-900/50">
          {step === 1 && (
            <div className="flex-1 flex flex-col gap-4">
              <h2 className="text-2xl font-bold">Paste Your Script</h2>
              <p className="text-gray-400 text-sm">Agent 1 (The Dramaturg) will analyze your text to extract narrative beats and tone.</p>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Video Topic</label>
                <input 
                  type="text" 
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Script Content</label>
                <textarea 
                  value={scriptText}
                  onChange={e => setScriptText(e.target.value)}
                  className="w-full flex-1 bg-gray-950 border border-gray-800 rounded p-4 text-white focus:border-blue-500 outline-none transition-colors resize-none font-mono text-sm leading-relaxed"
                />
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={isLoading || !scriptText}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : null}
                Run Agent 1: Analyze Script
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-green-400">Analysis Complete!</h2>
              <p className="text-gray-400 text-sm">
                Agent 1 has broken your script into <strong className="text-white">{storyPlan?.beats.length} Narrative Beats</strong>. 
                <br/><br/>
                Next, Agent 2 (The Voice Director) needs to generate the audio so Agent 3 knows exactly how many frames each scene requires.
              </p>
              <div className="flex-1"></div>
              <button 
                onClick={handleGenerateAudio}
                disabled={isLoading}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : null}
                Run Agent 2: Generate Audio
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="flex-1 flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-green-400">Audio Generated!</h2>
              <p className="text-gray-400 text-sm">
                Agent 2 has calculated exact word-level timestamps. 
                The total video will be <strong className="text-white">{audioTimeline ? (audioTimeline.durationInFrames / 30).toFixed(1) : 0} seconds</strong> long.
                <br/><br/>
                Now, Agent 3 (Visual Director) and Agent 4 (Sound Designer) will build perfectly synced scenes and sound effects.
              </p>
              <div className="flex-1"></div>
              <button 
                onClick={handleAssemble}
                disabled={isLoading}
                className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : null}
                Run Agents 3 & 4: Final Assembly
              </button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Visualization */}
        <div className="flex-1 bg-gray-950 p-8 overflow-y-auto">
          {step === 1 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-600">
              <div className="text-6xl mb-4">🤖</div>
              <p className="text-xl font-bold">Awaiting Script Input</p>
            </div>
          )}

          {step >= 2 && storyPlan && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-200">Narrative Beats</h3>
                <span className="text-sm bg-gray-800 px-3 py-1 rounded-full text-gray-400">Topic: {storyPlan.topic}</span>
              </div>
              
              <div className="space-y-4">
                {storyPlan.beats.map((beat, i) => (
                  <div key={beat.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
                    {/* Beat Type Badge */}
                    <div className="absolute top-0 right-0 bg-gray-800 px-3 py-1 rounded-bl-lg text-xs font-bold text-blue-400 uppercase tracking-wider">
                      {beat.type}
                    </div>
                    
                    <p className="text-lg text-gray-200 pr-24 leading-relaxed font-serif">"{beat.message}"</p>
                    
                    {/* Only show timing details if Audio is generated (Step 3) */}
                    {step >= 3 && beat.metadata?.startFrame !== undefined && beat.metadata?.endFrame !== undefined && (
                      <div className="mt-4 pt-4 border-t border-gray-800 flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-mono text-purple-400">
                            {((beat.metadata.startFrame as number) / 30).toFixed(1)}s - {((beat.metadata.endFrame as number) / 30).toFixed(1)}s
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="font-bold text-gray-500">Visual Duration:</span> 
                          <span className="text-white">{beat.suggestedDurationInFrames} frames</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
