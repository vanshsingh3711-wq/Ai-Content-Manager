import { PresenterAction } from '../character/presenter.types';

export type PresenterActionIntent = {
  action: PresenterAction;
  targetId?: string;
  startFrame?: number;
  durationInFrames?: number;
  expression?: string;
  priority?: number;
  metadata?: Record<string, unknown>;
};

export type PresenterChoreography = {
  presenterId?: string;
  visible?: boolean;
  actions: PresenterActionIntent[];
};
