import { resolveMotionIntents } from '../src/motion/resolver';
import { SceneDefinition } from '../src/scene/scene.types';
import * as fs from 'fs';
import * as path from 'path';

// We register everything by importing the index
import '../src/motion/patterns';
import '../src/motion/compositions';

const baseScene: SceneDefinition = {
  id: 'scene-1',
  elements: [
    { id: 'bg-1', type: 'asset' },
    { id: 'label-1', type: 'text' },
    { id: 'headline-1', type: 'text' },
    { id: 'keyword-1', type: 'text' },
    { id: 'support-1', type: 'text' }
  ]
};

const result = resolveMotionIntents(baseScene, [
  {
    type: 'hero_reveal',
    targets: {
      background: 'bg-1',
      label: 'label-1',
      headline: 'headline-1',
      accent: 'keyword-1',
      supporting: 'support-1'
    },
    durationInFrames: 90,
    personality: 'premium'
  }
]);

const outPath = path.join(__dirname, '../../../../apps/worker/services/engine_3d/hero_reveal_data.json');
fs.writeFileSync(outPath, JSON.stringify(result.scene.elements, null, 2));
console.log(`Successfully wrote composition JSON to ${outPath}`);
