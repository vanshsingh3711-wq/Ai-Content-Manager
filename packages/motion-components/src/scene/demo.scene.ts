import { SceneDefinition } from './scene.types';

export const DemoPresenterScene: SceneDefinition = {
  id: 'demo-presenter-scene',
  durationInFrames: 270, // 9 seconds at 30fps
  themeId: 'default',
  elements: [
    {
      id: 'bg',
      type: 'asset',
      assetId: 'default-bg',
      layer: 0,
      placement: {
        positionMode: 'absolute',
        position: { x: 0, y: 0 },
        size: { width: 1920, height: 1080 }
      }
    },
    {
      id: 'main-presenter',
      type: 'presenter',
      presenterTimeline: [
        {
          presenterId: 'main-presenter',
          characterAssetId: 'svg-presenter',
          action: 'talk',
          startFrame: 0,
          durationInFrames: 60
        },
        {
          presenterId: 'main-presenter',
          characterAssetId: 'svg-presenter',
          action: 'pointRight',
          targetId: 'credit-card',
          startFrame: 60,
          durationInFrames: 50
        },
        {
          presenterId: 'main-presenter',
          characterAssetId: 'svg-presenter',
          action: 'pointRight',
          targetId: 'debt-chart',
          startFrame: 110,
          durationInFrames: 60
        },
        {
          presenterId: 'main-presenter',
          characterAssetId: 'svg-presenter',
          action: 'present',
          targetId: 'debt-chart',
          startFrame: 170,
          durationInFrames: 50
        },
        {
          presenterId: 'main-presenter',
          characterAssetId: 'svg-presenter',
          action: 'emphasize',
          targetId: 'kpi-number',
          startFrame: 220,
          durationInFrames: 50
        }
      ],
      layer: 2,
      placement: {
        positionMode: 'absolute',
        anchor: 'bottom-left',
        position: { x: 100, y: 980 },
        size: { width: 600, height: 1400 }
      },
      timing: {
        startFrame: 0,
        durationInFrames: 270
      }
    },
    {
      id: 'credit-card',
      type: 'asset',
      assetId: 'credit-card-image',
      layer: 1,
      timing: { startFrame: 0, durationInFrames: 270 },
      placement: {
        positionMode: 'absolute',
        anchor: 'center',
        position: { x: 960, y: 540 },
        size: { width: 400, height: 250 }
      }
    },
    {
      id: 'debt-chart',
      type: 'asset',
      assetId: 'chart-image',
      layer: 1,
      timing: { startFrame: 0, durationInFrames: 270 },
      placement: {
        positionMode: 'absolute',
        anchor: 'center',
        position: { x: 1500, y: 540 },
        size: { width: 500, height: 400 }
      }
    },
    {
      id: 'kpi-number',
      type: 'text',
      textContent: '$42,000',
      textConfig: { role: 'heading' },
      layer: 1,
      timing: { startFrame: 0, durationInFrames: 270 },
      placement: {
        positionMode: 'absolute',
        anchor: 'center',
        position: { x: 1500, y: 800 }
      }
    }
  ],
  attention: [
    {
      id: 'card-highlight',
      targetId: 'credit-card',
      type: 'highlight',
      intensity: 0.8,
      startFrame: 60,
      durationInFrames: 50
    },
    {
      id: 'chart-spotlight',
      targetId: 'debt-chart',
      type: 'spotlight',
      intensity: 0.8,
      startFrame: 110,
      durationInFrames: 60
    },
    {
      id: 'kpi-pop',
      targetId: 'kpi-number',
      type: 'highlight',
      intensity: 1.0,
      startFrame: 220,
      durationInFrames: 50
    }
  ]
};
