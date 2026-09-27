import { AnimatableProperty, Keyframe, KeyframeTrack } from '../keyframes/keyframes.types';
import { AttentionInstruction, AttentionType } from '../attention/attention.types';
import { TimingConfig } from '../timing/timing.types';
import { CompositionDiagnostic } from '../validation/validation.types';

// ---------------------------------------------------------------------------
// Motion Personality
// ---------------------------------------------------------------------------

export type MotionPersonalityId = 'premium' | 'energetic' | 'editorial' | 'technical' | 'minimal';

export interface MotionPersonalityConfig {
  id: MotionPersonalityId;
  name: string;

  /** Global speed multiplier. 1.0 = default. <1 slower, >1 faster */
  speedMultiplier: number;

  /** How much overshoot/bounce. 0 = none, 1 = maximum */
  overshoot: number;

  /** Stagger delay multiplier between sequential elements */
  staggerMultiplier: number;

  /** Default easing for reveals */
  defaultEasing: Keyframe['easing'];

  /** Scale punch intensity multiplier */
  scalePunchIntensity: number;

  /** Enter animation duration multiplier */
  enterDurationMultiplier: number;

  /** Exit animation duration multiplier */
  exitDurationMultiplier: number;
}

// ---------------------------------------------------------------------------
// Motion Pattern
// ---------------------------------------------------------------------------

export type MotionPatternId =
  | 'soft_reveal'
  | 'scale_punch'
  | 'slide_reveal'
  | 'blur_reveal'
  | 'elastic_reveal'
  | 'keyword_punch'
  | 'focus_reveal'
  | 'stagger_reveal'
  | 'draw_reveal'
  | 'exit_fade';

export interface MotionPatternParams {
  /** Duration of this pattern in frames */
  durationInFrames: number;

  /** Offset from the composition's start frame */
  offsetFrames?: number;

  /** 0 to 1, modifies the strength of the effect */
  intensity?: number;

  /** Direction for directional patterns */
  direction?: 'up' | 'down' | 'left' | 'right';

  /** Personality-aware easing override */
  easing?: Keyframe['easing'];

  /** Overshoot amount (0-1) for spring/back easing */
  overshoot?: number;
}

/**
 * A MotionPattern is a reusable recipe that produces KeyframeTrack[].
 * It does NOT render anything itself — it outputs data for the existing
 * keyframe evaluator to consume.
 */
export interface MotionPatternDefinition {
  id: MotionPatternId;
  name: string;
  description: string;

  /** The properties this pattern animates */
  animates: AnimatableProperty[];

  /**
   * Resolve this pattern into concrete keyframe tracks.
   * Must be deterministic — same params always produce same output.
   */
  resolve: (params: MotionPatternParams) => KeyframeTrack[];
}

// ---------------------------------------------------------------------------
// Motion Composition
// ---------------------------------------------------------------------------

export type MotionCompositionCategory =
  | 'text'
  | 'data'
  | 'visual'
  | 'storytelling'
  | 'social'
  | 'emphasis';

export type MotionCompositionId =
  | 'hero_reveal'
  | 'keyword_emphasis'
  | 'metric_reveal'
  | 'counter_reveal'
  | 'chart_reveal'
  | 'comparison_reveal'
  | 'before_after'
  | 'step_sequence'
  | 'quote_reveal'
  | 'product_reveal'
  | 'visual_spotlight'
  | 'cta_reveal';

/**
 * A single layer within a composition. Each layer targets one scene element
 * and applies a sequence of motion patterns to it.
 */
export interface MotionCompositionLayer {
  /** Which scene element this layer targets (by element ID) */
  targetElementId: string;

  /** Semantic role for this layer within the composition */
  role: 'background' | 'label' | 'headline' | 'metric' | 'supporting' | 'accent' | 'emphasis';

  /** Patterns applied to this layer, resolved in order */
  patterns: Array<{
    patternId: MotionPatternId;
    params: MotionPatternParams;
  }>;

  /** Optional attention/emphasis request for this layer */
  attention?: {
    type: AttentionType;
    intensity?: number;
    startFrame?: number;
    durationInFrames?: number;
  };
}

/**
 * Timing relationship between layers within a composition.
 * Allows declarative sequencing without hardcoded frame numbers.
 */
export type MotionTimingRelation =
  | { type: 'after'; sourceLayerIndex: number; delayFrames?: number }
  | { type: 'with'; sourceLayerIndex: number; offsetFrames?: number }
  | { type: 'stagger'; fromLayerIndex: number; toLayerIndex: number; staggerFrames: number };

export interface MotionCompositionParams {
  /** Overall intensity 0-1 */
  intensity?: number;

  /** Energy level 0-1 */
  energy?: number;

  /** Direction preference */
  direction?: 'up' | 'down' | 'left' | 'right';

  /** Personality to apply */
  personality?: MotionPersonalityId;

  /** Duration override in frames */
  durationInFrames?: number;

  /** Emphasis strength for the primary element */
  emphasis?: 'subtle' | 'medium' | 'strong';

  /** Stagger delay between sequential elements in frames */
  staggerFrames?: number;
}

/**
 * A MotionComposition is a complete, coordinated animation sequence.
 * It orchestrates multiple layers, each with their own motion patterns,
 * timing relationships, and attention requests.
 */
export interface MotionCompositionDefinition {
  id: MotionCompositionId;
  name: string;
  category: MotionCompositionCategory;
  description: string;

  /** Default duration in frames (can be overridden by params) */
  defaultDurationInFrames: number;

  /** Tags for discovery and filtering */
  tags: string[];

  /** What visual types this composition is suitable for */
  suitableFor: string[];

  /**
   * Resolve this composition into concrete layers with patterns.
   * 
   * @param elementIds - Map of role → element ID from the scene
   * @param params - Composition parameters (intensity, personality, etc.)
   * @returns Resolved layers ready for pattern evaluation
   */
  resolve: (
    elementIds: Record<string, string>,
    params: MotionCompositionParams
  ) => ResolvedMotionComposition;
}

// ---------------------------------------------------------------------------
// Resolved Output Types
// ---------------------------------------------------------------------------

export interface ResolvedMotionLayer {
  targetElementId: string;
  role: string;
  keyframeTracks: KeyframeTrack[];
  attention?: AttentionInstruction;
}

export interface ResolvedMotionComposition {
  id: MotionCompositionId;
  layers: ResolvedMotionLayer[];
  durationInFrames: number;
  diagnostics: CompositionDiagnostic[];
}

// ---------------------------------------------------------------------------
// Semantic Motion Intent (what the AI emits)
// ---------------------------------------------------------------------------

export interface MotionIntent {
  /** Which composition to use */
  type: MotionCompositionId;

  /** Map of semantic role → scene element ID */
  targets: Record<string, string>;

  /** Energy level */
  energy?: 'low' | 'medium' | 'high';

  /** Intensity 0-1 */
  intensity?: number;

  /** Duration override in frames */
  durationInFrames?: number;

  /** Personality override */
  personality?: MotionPersonalityId;

  /** Start frame within the scene */
  startFrame?: number;
}
