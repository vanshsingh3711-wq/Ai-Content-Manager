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

// Dummy Scene that maps targets to elements
const elements = Object.values(targets).map(id => ({ id: String(id), type: 'text' as const }));
const mockScene: SceneDefinition = {
  id: 'dynamic-scene',
  elements
};

const intent: MotionIntent = {
  type: type as any,
  targets: targets,
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
