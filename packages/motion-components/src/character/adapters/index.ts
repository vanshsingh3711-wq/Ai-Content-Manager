import { RiveCharacterAdapter } from './rive.adapter';
import { SvgCharacterAdapter } from './svg.adapter';
import { registerCharacterAdapter, getCharacterAdapter } from './character.adapter';

// Auto-register known assets
registerCharacterAdapter('rive-presenter', new RiveCharacterAdapter());
registerCharacterAdapter('svg-presenter', new SvgCharacterAdapter());

export {
  RiveCharacterAdapter,
  SvgCharacterAdapter,
  registerCharacterAdapter,
  getCharacterAdapter
};
export * from './character.adapter';
