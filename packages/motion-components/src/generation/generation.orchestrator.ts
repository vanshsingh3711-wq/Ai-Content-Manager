import { VideoGenerationRequest, VideoGenerationResult } from './generation.types';
import { DeterministicStoryPlanner } from '../story/story.planner';
import { DeterministicScriptAnalyzer } from '../story/script.analyzer';
import { DeterministicTTSDirector } from '../audio/tts.director';
import { DeterministicSFXPlanner } from '../audio/sfx.planner';
import { DeterministicVisualPlanner } from '../visual/visual.planner';
import { DeterministicSceneJsonGenerator } from '../scene/scene-json.generator';
import { DeterministicChoreographyPlanner } from '../choreography/choreography.planner';
import { DeterministicSceneCompiler } from '../scene/scene.compiler';
import { ProjectFile } from '../project/project.types';
import { SceneDefinition, SceneElementDefinition } from '../scene/scene.types';
import { validateSceneJson } from '../scene/scene-json.validation';
import { CompositionDiagnostic } from '../validation/validation.types';

export class GenerationOrchestrator {
  private storyPlanner = new DeterministicStoryPlanner();
  private scriptAnalyzer = new DeterministicScriptAnalyzer();
  private ttsDirector = new DeterministicTTSDirector();
  private visualPlanner = new DeterministicVisualPlanner();
  private jsonGenerator = new DeterministicSceneJsonGenerator();
  private sfxPlanner = new DeterministicSFXPlanner();
  private choreographyPlanner = new DeterministicChoreographyPlanner();
  private sceneCompiler = new DeterministicSceneCompiler();

  /**
   * Generates a fully deterministic video project from a topic request.
   */
  public generate(request: VideoGenerationRequest): VideoGenerationResult {
    const diagnostics: CompositionDiagnostic[] = [];
    const stages: VideoGenerationResult['stages'] = {};

    try {
      // 1. Story / Script Planning (Agent 1)
      const fps = request.format?.fps || 30;
      let storyPlan;

      if (request.script) {
        // If a script is provided, analyze it directly
        storyPlan = this.scriptAnalyzer.analyze(request.script, request.topic);
      } else {
        // Otherwise, generate a script from the topic
        storyPlan = this.storyPlanner.plan({
          topic: request.topic,
          durationInFrames: (request.durationInSeconds || 30) * fps
        });
      }
      
      stages.story = storyPlan;

      if (storyPlan.beats.length === 0) {
        diagnostics.push({ type: 'generation', severity: 'error', message: 'Script analysis produced no narrative beats.' });
        return { success: false, diagnostics, stages };
      }

      // 1.5 Audio Generation (Agent 2)
      // This is the source of truth for all video timing!
      const audioTimeline = this.ttsDirector.generateAudioTimeline(storyPlan, fps);
      stages.audio = audioTimeline;

      // 2. Visual Planning (Agent 3)
      const visualPlan = this.visualPlanner.plan(storyPlan);
      stages.visual = visualPlan;

      if (visualPlan.scenes.length === 0) {
        diagnostics.push({ type: 'generation', severity: 'error', message: 'Visual planning produced no scenes.' });
        return { success: false, diagnostics, stages };
      }

      // 3. Scene JSON Generation
      let sceneJsons = this.jsonGenerator.generate(storyPlan, visualPlan);
      stages.scenes = sceneJsons;

      if (sceneJsons.length === 0) {
        diagnostics.push({ type: 'generation', severity: 'error', message: 'Scene generation produced no Scene JSONs.' });
        return { success: false, diagnostics, stages };
      }

      // 4. Choreography (if enabled)
      if (request.presenter?.enabled) {
        sceneJsons = this.choreographyPlanner.applyChoreography(sceneJsons, storyPlan, visualPlan);
        stages.scenes = sceneJsons; // update with choreography
      }

      // 4.5 Sound Design (Agent 4)
      sceneJsons = this.sfxPlanner.planSFX(sceneJsons, audioTimeline);
      stages.scenes = sceneJsons; // update with sfx

      // 5. Scene Compilation & Flattening
      let masterElements: SceneElementDefinition[] = [];
      let currentFrame = 0;

      for (const sceneJson of sceneJsons) {
        const sceneDiags = validateSceneJson(sceneJson);
        if (sceneDiags.some(d => d.severity === 'error')) {
          diagnostics.push(...sceneDiags);
          return { success: false, diagnostics, stages };
        }

        const compiledScene = this.sceneCompiler.compile(sceneJson, { 
          viewport: { width: request.format?.width || 1080, height: request.format?.height || 1920 },
          fps 
        });

        // Offset elements by currentFrame and merge
        const duration = compiledScene.durationInFrames || (fps * 5); // Fallback to 5s if not compiled
        
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

          // If presenter is requested and this element is presenter, we can force ID if needed
          if (newEl.type === 'presenter' && request.presenter?.presenterId) {
            newEl.assetId = request.presenter.presenterId;
          }

          return newEl;
        });

        masterElements.push(...offsetElements);
        currentFrame += duration;
      }

      const masterScene: SceneDefinition = {
        id: `gen_${crypto.randomUUID()}`,
        durationInFrames: currentFrame,
        themeId: request.themeId || 'premium_dark',
        elements: masterElements,
      };

      const project: ProjectFile = {
        format: 'ai-video-editor-project',
        version: 1,
        project: masterScene
      };

      // Ensure minimal project validity
      if (!masterScene.elements || masterScene.elements.length === 0) {
        diagnostics.push({ type: 'generation', severity: 'error', message: 'Project generation produced no elements.' });
        return { success: false, diagnostics, stages };
      }

      return {
        success: true,
        project: masterScene,
        diagnostics,
        stages
      };

    } catch (error: any) {
      diagnostics.push({ type: 'generation', severity: 'error', message: `Generation failed: ${error.message}` });
      return { success: false, diagnostics, stages };
    }
  }
}
