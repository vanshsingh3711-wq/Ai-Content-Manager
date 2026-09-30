import { resolveMotionIntents } from '../src/motion/resolver';
import { SceneDefinition, MotionIntent } from '../src/motion/types';
import '../src/motion/compositions/index';
import '../src/motion/patterns/index';
import '../src/motion/patterns/blurReveal';
import '../src/motion/patterns/exitFade';

// Usage: npx tsx resolve_motion.ts <props_json>
const propsJson = process.argv[2] || '{}';
let props;
try {
  props = JSON.parse(propsJson);
} catch (e) {
  console.error("Invalid JSON:", e);
  process.exit(1);
}

// Convert AI props into a MotionIntent
const type = props.type || 'hero_reveal';
const targets = props.targets || { text: 'text-1' };
const personality = props.personality || 'premium';

// Map the payload keys to themselves so that the keyframes target the HTML element IDs (e.g., "title", "step1").
// Also include standard layout IDs that the compositions might animate even if they aren't passed in the payload.
const mappedTargets: Record<string, string> = {
  background: 'background',
  window: 'window',
  container: 'container',
  titlebar: 'titlebar',
  content: 'content'
};
Object.keys(targets).forEach(key => {
  mappedTargets[key] = key;
});

// Create elements for all mapped targets
const elements = Object.values(mappedTargets).map(id => ({ id, type: 'text' as const }));
const mockScene: SceneDefinition = {
  id: 'dynamic-scene',
  elements
};

const intent: MotionIntent = {
  type: type as any,
  targets: mappedTargets,
  personality: personality as any,
  durationInFrames: props.durationInFrames || 90
};

try {
    const result = resolveMotionIntents(mockScene, [intent]);
    if (result.diagnostics.length > 0) {
       console.error("Diagnostics:", result.diagnostics);
    }
    // Output just the JSON string to stdout
    console.log(JSON.stringify(result.scene.elements));
} catch (err: any) {
    console.error("Resolution Failed:", err.message);
    process.exit(1);
}
