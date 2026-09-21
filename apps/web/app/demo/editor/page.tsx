'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useEditorStore } from '@ai-content-manager/motion-components/src/editor';
import { resolveSceneGraph, SceneResolutionContext, ResolvedSceneElement } from '@ai-content-manager/motion-components/src/scene';
import { serializeProject, deserializeProject } from '@ai-content-manager/motion-components/src/project';
import { SequenceRenderer } from '@ai-content-manager/motion-components/src/elements/Sequence/SequenceRenderer';
import { Typography } from '@ai-content-manager/motion-components/src/elements/Typography';
import { getAnchorOffset } from '@ai-content-manager/motion-components/src/layout/layout.utils';
import { GenerationOrchestrator } from '@ai-content-manager/motion-components/src/generation/generation.orchestrator';
import { GenerationStatus, VideoGenerationResult } from '@ai-content-manager/motion-components/src/generation/generation.types';
import { RenderErrorBoundary } from '@ai-content-manager/motion-components/src/render/RenderErrorBoundary';
import { RenderLoadingState } from '@ai-content-manager/motion-components/src/render/RenderLoadingState';
import { Player, PlayerRef } from '@remotion/player';

export default function EditorStateDemoPage() {
  const store = useEditorStore();
  const [isClient, setIsClient] = useState(false);
  const playerRef = React.useRef<PlayerRef>(null);
  
  // Initialize the store once on mount
  useEffect(() => {
    store.initProject({
      id: 'editor-demo',
      themeId: 'premium_dark',
      durationInFrames: 300,
      elements: [
        {
          id: 'text-1',
          type: 'text',
          textContent: 'Move Me!',
          textConfig: { role: 'hero', align: 'center', maxWidth: 900 },
          placement: { position: { x: 540, y: 500 }, positionMode: 'absolute', anchor: 'center' }
        },
        {
          id: 'text-2',
          type: 'text',
          textContent: 'Or duplicate me.',
          textConfig: { role: 'body', align: 'center', maxWidth: 900 },
          placement: { position: { x: 540, y: 1200 }, positionMode: 'absolute', anchor: 'center' }
        }
      ]
    });
    setIsClient(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // File Operations
  const handleNewProject = () => {
    if (store.isDirty && !window.confirm('You have unsaved changes. Are you sure you want to create a new project?')) {
      return;
    }
    store.initProject({
      id: `project-${Date.now()}`,
      themeId: 'premium_dark',
      durationInFrames: 300,
      elements: []
    });
  };

  const handleSaveProject = () => {
    if (!store.project) return;
    try {
      const jsonStr = serializeProject(store.project, { name: store.project.id });
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${store.project.id || 'project'}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      store.markClean();
    } catch (e: any) {
      alert(`Save failed: ${e.message}`);
    }
  };

  const handleOpenProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (store.isDirty && !window.confirm('You have unsaved changes. Are you sure you want to open another project?')) {
      e.target.value = ''; // Reset input
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const projectFile = deserializeProject(jsonStr);
        store.loadProject(projectFile.project);
      } catch (err: any) {
        alert(`Load failed:\n${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Keyboard Shortcuts (Undo/Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't hijack if user is typing in an input
      // Basic undo/redo with keyboard
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          store.redo();
        } else {
          store.undo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        store.redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);

  // Sync editor playhead with Remotion Player
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.seekTo(store.playheadFrame);
    }
  }, [store.playheadFrame]);


  const context: SceneResolutionContext = useMemo(() => ({
    canvas: { width: 1080, height: 1920 },
    fps: 30,
    autoRepair: true
  }), []);

  const resolvedGraph = useMemo(() => {
    if (!store.project) return null;
    return resolveSceneGraph(store.project, context);
  }, [store.project, context]);

  // Export State
  const [exportState, setExportState] = useState<{
    status: 'idle' | 'validating' | 'rendering' | 'completed' | 'failed' | 'cancelled';
    jobId?: string;
    videoUrl?: string;
    diagnostics: any[];
    error?: string;
  }>({ status: 'idle', diagnostics: [] });

  const handleExportProject = async () => {
    if (!resolvedGraph) return;
    
    setExportState({ status: 'validating', diagnostics: [] });
    
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence: resolvedGraph,
          config: { format: 'mp4', codec: 'h264' }
        })
      });
      
      const data = await res.json();
      
      if (!data.success) {
        setExportState({ 
          status: 'failed', 
          diagnostics: data.diagnostics || [], 
          error: data.error || 'Validation failed' 
        });
        return;
      }
      
      setExportState({ status: 'rendering', jobId: data.jobId, diagnostics: [] });
      
      // Poll status
      const poll = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/export?id=${data.jobId}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            
            if (statusData.status === 'completed' || statusData.status === 'failed' || statusData.status === 'cancelled') {
              clearInterval(poll);
              setExportState(prev => ({
                ...prev,
                status: statusData.status,
                videoUrl: statusData.videoUrl,
                diagnostics: statusData.diagnostics || []
              }));
            }
          }
        } catch (e) {
          // ignore network errors while polling
        }
      }, 2000);
      
    } catch (e: any) {
      setExportState({ status: 'failed', diagnostics: [], error: e.message });
    }
  };

  const handleCancelExport = async () => {
    if (exportState.jobId && exportState.status === 'rendering') {
      await fetch(`/api/export?id=${exportState.jobId}`, { method: 'DELETE' });
      setExportState(prev => ({ ...prev, status: 'cancelled' }));
    }
  };

  // Generation State
  const [generationState, setGenerationState] = useState<{
    showModal: boolean;
    status: GenerationStatus;
    topic: string;
    duration: number;
    format: string;
    theme: string;
    presenter: boolean;
    result?: VideoGenerationResult;
  }>({
    showModal: false,
    status: 'idle',
    topic: 'Why compound interest grows so quickly',
    duration: 30,
    format: '9:16',
    theme: 'premium_dark',
    presenter: true,
  });

  const orchestrator = useMemo(() => new GenerationOrchestrator(), []);

  const handleGenerate = async () => {
    setGenerationState(prev => ({ ...prev, status: 'planning' }));
    
    // Slight timeout to allow React to render the planning state
    setTimeout(() => {
      let width = 1080;
      let height = 1920;
      if (generationState.format === '16:9') {
        width = 1920;
        height = 1080;
      } else if (generationState.format === '1:1') {
        width = 1080;
        height = 1080;
      }

      const result = orchestrator.generate({
        topic: generationState.topic,
        durationInSeconds: generationState.duration,
        themeId: generationState.theme,
        format: { width, height, fps: 30 },
        presenter: { enabled: generationState.presenter, presenterId: 'sarah' }
      });

      if (result.success && result.project) {
        store.applyGeneratedProject(result.project);
        setGenerationState(prev => ({ ...prev, status: 'completed', result }));
      } else {
        setGenerationState(prev => ({ ...prev, status: 'failed', result }));
      }
    }, 500);
  };

  // Dragging logic
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);

  const handlePointerDown = (elementId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    store.selectElement(elementId);
    setDraggedElement(elementId);
    setDragStart({ x: e.clientX, y: e.clientY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggedElement && dragStart) {
      const dx = (e.clientX - dragStart.x) * (1080 / 400); // Scale from 400px view to 1080px scene
      const dy = (e.clientY - dragStart.y) * (1080 / 400); 
      
      // We pass saveHistory=false to coalesce dragging changes
      store.moveElement(draggedElement, dx, dy, false);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggedElement) {
      setDraggedElement(null);
      setDragStart(null);
      store.commitHistory(); // Push snapshot at end of drag
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  const handleBackgroundPointerDown = () => {
    store.clearSelection();
  };

  const renderScene = useCallback((sceneData: any) => {
    return (
      <div 
        style={{ width: '100%', height: '100%', backgroundColor: '#0f172a', position: 'relative' }}
        onPointerDown={handleBackgroundPointerDown}
      >
        {sceneData.scene.elements.map((el: ResolvedSceneElement) => {
          const isSelected = store.elementIds.includes(el.id);
          const offset = getAnchorOffset(el.geometry.width, el.geometry.height, el.anchor as any);
          
          return (
            <div
              key={el.id}
              onPointerDown={(e) => handlePointerDown(el.id, e)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{
                position: 'absolute',
                left: el.geometry.x + offset.x,
                top: el.geometry.y + offset.y,
                width: el.geometry.width,
                height: el.geometry.height,
                transformOrigin: 'center center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'grab',
                border: isSelected ? '4px solid #3b82f6' : 'none',
                boxShadow: isSelected ? '0 0 0 4px rgba(59, 130, 246, 0.3)' : 'none',
              }}
            >
              {el.type === 'text' && (
                <Typography
                  element={el}
                  tokens={sceneData.scene.tokens}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }, [store.elementIds, handlePointerDown, handlePointerMove, handlePointerUp, handleBackgroundPointerDown]);

  if (!isClient || !resolvedGraph) return <div>Loading...</div>;

  return (
    <div className="p-8 bg-gray-950 min-h-screen text-gray-100 font-sans flex flex-col gap-8">
      <div className="flex gap-12 max-w-7xl mx-auto w-full">
        <div className="w-[450px]">
          <h1 className="text-3xl font-bold mb-6 text-white tracking-tight">
            Editor State
            {store.isDirty && <span className="text-amber-400 ml-2" title="Unsaved changes">*</span>}
          </h1>
          
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">File</h2>
            <div className="flex gap-4 mb-4">
              <button 
                onClick={handleNewProject}
                className="flex-1 py-2 bg-indigo-900/50 hover:bg-indigo-800/50 border border-indigo-700/50 text-indigo-200 rounded font-bold transition-colors"
              >
                New
              </button>
              
              <label className="flex-1 cursor-pointer">
                <input type="file" accept=".json" className="hidden" onChange={handleOpenProject} />
                <div className="w-full h-full py-2 bg-indigo-900/50 hover:bg-indigo-800/50 border border-indigo-700/50 text-indigo-200 rounded font-bold transition-colors flex items-center justify-center">
                  Open
                </div>
              </label>

              <button 
                onClick={handleSaveProject}
                className="flex-1 py-2 bg-green-900/50 hover:bg-green-800/50 border border-green-700/50 text-green-200 rounded font-bold transition-colors"
              >
                Save
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setGenerationState(prev => ({ ...prev, showModal: true }))}
                className="w-full py-2 bg-blue-900/50 hover:bg-blue-800/50 border border-blue-700/50 text-blue-200 rounded font-bold transition-colors shadow-lg"
              >
                Generate Video (AI)
              </button>
              <button 
                onClick={handleExportProject}
                className="w-full py-2 bg-pink-900/50 hover:bg-pink-800/50 border border-pink-700/50 text-pink-200 rounded font-bold transition-colors shadow-lg"
              >
                Export Video
              </button>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Toolbar</h2>
            
            <div className="flex gap-4 mb-6">
              <button 
                onClick={() => store.undo()} 
                disabled={store.past.length === 0}
                className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded font-bold transition-colors"
              >
                ↶ Undo
              </button>
              <button 
                onClick={() => store.redo()} 
                disabled={store.future.length === 0}
                className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded font-bold transition-colors"
              >
                ↷ Redo
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-6 text-center">
              Shortcuts: Cmd/Ctrl + Z, Cmd/Ctrl + Shift + Z
            </p>

            <h2 className="text-xl font-bold mb-4">Element Actions</h2>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => store.elementIds.length > 0 && store.duplicateElement(store.elementIds[0])} 
                disabled={store.elementIds.length === 0}
                className="w-full py-2 bg-blue-900/50 hover:bg-blue-800/50 disabled:opacity-50 border border-blue-700/50 text-blue-200 rounded font-bold transition-colors"
              >
                Duplicate Selected
              </button>
              <button 
                onClick={() => store.elementIds.length > 0 && store.deleteElement(store.elementIds[0])} 
                disabled={store.elementIds.length === 0}
                className="w-full py-2 bg-red-900/50 hover:bg-red-800/50 disabled:opacity-50 border border-red-700/50 text-red-200 rounded font-bold transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-md">
            <h2 className="text-xl font-bold mb-4">State Inspection</h2>
            <div className="flex gap-4 mb-4">
              <div className="flex-1 text-center bg-gray-800 rounded p-2">
                <div className="text-xs text-gray-400">Past History</div>
                <div className="text-2xl font-bold">{store.past.length}</div>
              </div>
              <div className="flex-1 text-center bg-gray-800 rounded p-2">
                <div className="text-xs text-gray-400">Future History</div>
                <div className="text-2xl font-bold">{store.future.length}</div>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              <strong>Selection:</strong> {store.elementIds.length > 0 ? store.elementIds.join(', ') : 'None'}
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-center items-center flex-col gap-4">
          <div 
            className="relative bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800"
            style={{ width: '400px', height: `${400 * (1920/1080)}px` }}
          >
            <RenderLoadingState status={isClient ? 'ready' : 'loading'}>
              <Player
                ref={playerRef}
                component={({ sequence, renderScene }) => (
                  <RenderErrorBoundary>
                    <SequenceRenderer 
                      sequence={sequence}
                      renderScene={renderScene}
                    />
                  </RenderErrorBoundary>
                )}
                inputProps={{
                  sequence: {
                    id: 'editor-seq',
                    fps: 30,
                    width: 1080,
                    height: 1920,
                    durationInFrames: resolvedGraph.durationInFrames,
                    diagnostics: [],
                    scenes: [
                      {
                        id: resolvedGraph.id,
                        scene: resolvedGraph,
                        globalStartFrame: 0,
                        globalEndFrame: resolvedGraph.durationInFrames
                      }
                    ]
                  },
                  renderScene
                }}
                durationInFrames={Math.max(1, resolvedGraph.durationInFrames)}
                fps={30}
                compositionWidth={1080}
                compositionHeight={1920}
                style={{ width: '100%', height: '100%' }}
                controls={true}
              />
            </RenderLoadingState>
          </div>
          <div className="w-full max-w-[400px] flex items-center gap-4 text-sm text-gray-400">
            <span>Frame:</span>
            <input 
              type="range" 
              min={0} 
              max={resolvedGraph.durationInFrames - 1} 
              value={store.playheadFrame}
              onChange={(e) => store.setPlayheadFrame(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-8 text-right">{store.playheadFrame}</span>
          </div>
        </div>
      </div>
      
      {/* Export Overlay */}
      {exportState.status !== 'idle' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-2xl border border-gray-700 w-[500px] shadow-2xl flex flex-col gap-6">
            <h2 className="text-2xl font-bold">
              {exportState.status === 'validating' && 'Validating Project...'}
              {exportState.status === 'rendering' && 'Rendering Video...'}
              {exportState.status === 'completed' && 'Export Completed!'}
              {exportState.status === 'failed' && 'Export Failed'}
              {exportState.status === 'cancelled' && 'Export Cancelled'}
            </h2>
            
            {exportState.status === 'rendering' && (
              <div className="flex flex-col gap-2 items-center text-gray-400">
                <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mb-4"></div>
                <p>Generating deterministic frames...</p>
                <button onClick={handleCancelExport} className="mt-4 text-sm underline hover:text-white">Cancel Export</button>
              </div>
            )}
            
            {exportState.diagnostics.length > 0 && (
              <div className="bg-red-900/20 border border-red-800 rounded p-4 text-sm text-red-200 flex flex-col gap-2 max-h-40 overflow-y-auto">
                <strong>Diagnostics:</strong>
                <ul className="list-disc pl-4">
                  {exportState.diagnostics.map((d, i) => (
                    <li key={i}>{d.message}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {exportState.error && (
              <div className="text-red-400 text-sm break-all">
                {exportState.error}
              </div>
            )}
            
            {exportState.status === 'completed' && exportState.videoUrl && (
              <div className="flex flex-col gap-4">
                <video src={exportState.videoUrl} controls className="w-full rounded bg-black" />
                <a 
                  href={exportState.videoUrl} 
                  download 
                  className="w-full text-center py-2 bg-pink-600 hover:bg-pink-500 text-white rounded font-bold transition-colors"
                >
                  Download MP4
                </a>
              </div>
            )}
            
            {['completed', 'failed', 'cancelled'].includes(exportState.status) && (
              <button 
                onClick={() => setExportState({ status: 'idle', diagnostics: [] })}
                className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded font-bold transition-colors mt-4"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
      {/* Generation Overlay */}
      {generationState.showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-2xl border border-gray-700 w-[600px] shadow-2xl flex flex-col gap-6">
            <h2 className="text-2xl font-bold">Generate AI Video</h2>
            
            {generationState.status === 'idle' ? (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">What do you want to create?</label>
                  <input 
                    type="text" 
                    value={generationState.topic}
                    onChange={(e) => setGenerationState(prev => ({...prev, topic: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
                  />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-400 mb-1">Duration (sec)</label>
                    <input 
                      type="number" 
                      value={generationState.duration}
                      onChange={(e) => setGenerationState(prev => ({...prev, duration: parseInt(e.target.value)}))}
                      className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-400 mb-1">Format</label>
                    <select 
                      value={generationState.format}
                      onChange={(e) => setGenerationState(prev => ({...prev, format: e.target.value}))}
                      className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
                    >
                      <option value="9:16">9:16 (Shorts)</option>
                      <option value="16:9">16:9 (YouTube)</option>
                      <option value="1:1">1:1 (Square)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-400 mb-1">Theme</label>
                    <select 
                      value={generationState.theme}
                      onChange={(e) => setGenerationState(prev => ({...prev, theme: e.target.value}))}
                      className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
                    >
                      <option value="premium_dark">Premium Dark</option>
                      <option value="clean_light">Clean Light</option>
                      <option value="editorial">Editorial</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-400 mb-1">Presenter</label>
                    <select 
                      value={generationState.presenter ? "yes" : "no"}
                      onChange={(e) => setGenerationState(prev => ({...prev, presenter: e.target.value === "yes"}))}
                      className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
                    >
                      <option value="yes">Enabled</option>
                      <option value="no">Disabled</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 mt-4">
                  <button 
                    onClick={() => setGenerationState(prev => ({...prev, showModal: false}))}
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleGenerate}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-colors shadow-lg"
                  >
                    Generate Video
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  {(generationState.status !== 'completed' && generationState.status !== 'failed') && (
                    <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  )}
                  <div className="text-xl font-bold">
                    {generationState.status === 'planning' && 'Planning Story...'}
                    {generationState.status === 'visual-planning' && 'Creating Visual Plan...'}
                    {generationState.status === 'scene-generation' && 'Generating Scenes...'}
                    {generationState.status === 'compiling' && 'Compiling Graph...'}
                    {generationState.status === 'validating' && 'Validating Output...'}
                    {generationState.status === 'completed' && 'Generation Complete!'}
                    {generationState.status === 'failed' && 'Generation Failed'}
                  </div>
                </div>
                
                {generationState.status === 'completed' && (
                  <div className="bg-green-900/20 border border-green-800 rounded p-4 text-green-200">
                    Project successfully generated and loaded into editor.
                  </div>
                )}
                
                {generationState.status === 'failed' && generationState.result?.diagnostics && (
                  <div className="bg-red-900/20 border border-red-800 rounded p-4 text-sm text-red-200 flex flex-col gap-2 max-h-40 overflow-y-auto">
                    <strong>Diagnostics:</strong>
                    <ul className="list-disc pl-4">
                      {generationState.result.diagnostics.map((d, i) => (
                        <li key={i}>{d.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {(generationState.status === 'completed' || generationState.status === 'failed') && (
                  <button 
                    onClick={() => setGenerationState(prev => ({...prev, showModal: false, status: 'idle', result: undefined}))}
                    className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded font-bold transition-colors mt-4"
                  >
                    {generationState.status === 'completed' ? 'Start Editing' : 'Close'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
