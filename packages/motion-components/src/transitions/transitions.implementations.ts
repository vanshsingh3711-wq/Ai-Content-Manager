import React from 'react';
import { TransitionImplementation, ResolvedSceneTransition } from './transitions.types';

export const cutTransition: TransitionImplementation = (progress) => {
  return {
    sceneAStyle: { opacity: progress < 0.5 ? 1 : 0 },
    sceneBStyle: { opacity: progress >= 0.5 ? 1 : 0 }
  };
};

export const fadeTransition: TransitionImplementation = (progress) => {
  // Scene A fades out completely, then Scene B fades in.
  return {
    sceneAStyle: { opacity: Math.max(0, 1 - progress * 2) },
    sceneBStyle: { opacity: Math.max(0, progress * 2 - 1) }
  };
};

export const crossfadeTransition: TransitionImplementation = (progress) => {
  // Scene A and B overlap
  return {
    sceneAStyle: { opacity: 1 - progress },
    sceneBStyle: { opacity: progress }
  };
};

export const slideTransition: TransitionImplementation = (progress, transition) => {
  const dir = transition.direction || 'left';
  let txA = 0, tyA = 0;
  let txB = 0, tyB = 0;

  if (dir === 'left') {
    txA = -progress * 100;
    txB = (1 - progress) * 100;
  } else if (dir === 'right') {
    txA = progress * 100;
    txB = -(1 - progress) * 100;
  } else if (dir === 'up') {
    tyA = -progress * 100;
    tyB = (1 - progress) * 100;
  } else if (dir === 'down') {
    tyA = progress * 100;
    tyB = -(1 - progress) * 100;
  }

  return {
    sceneAStyle: { transform: `translate(${txA}%, ${tyA}%)` },
    sceneBStyle: { transform: `translate(${txB}%, ${tyB}%)` }
  };
};

export const pushTransition: TransitionImplementation = (progress, transition) => {
  const dir = transition.direction || 'left';
  let txA = 0, tyA = 0;
  let txB = 0, tyB = 0;

  if (dir === 'left') {
    txA = -progress * 100;
    txB = (1 - progress) * 100;
  } else if (dir === 'right') {
    txA = progress * 100;
    txB = -(1 - progress) * 100;
  } else if (dir === 'up') {
    tyA = -progress * 100;
    tyB = (1 - progress) * 100;
  } else if (dir === 'down') {
    tyA = progress * 100;
    tyB = -(1 - progress) * 100;
  }

  // Same transform math as slide, but push usually visually displaces instead of overlapping.
  // We can just rely on the same CSS since Scene B literally pushes A.
  return {
    sceneAStyle: { transform: `translate(${txA}%, ${tyA}%)` },
    sceneBStyle: { transform: `translate(${txB}%, ${tyB}%)` }
  };
};

export const wipeTransition: TransitionImplementation = (progress, transition) => {
  const dir = transition.direction || 'left';
  const p = progress * 100;
  
  let clipA = '';
  let clipB = '';

  if (dir === 'left') { // Wipe from right to left (unveiling B on the right)
    clipA = `polygon(0 0, ${100 - p}% 0, ${100 - p}% 100%, 0 100%)`;
    clipB = `polygon(${100 - p}% 0, 100% 0, 100% 100%, ${100 - p}% 100%)`;
  } else if (dir === 'right') {
    clipA = `polygon(${p}% 0, 100% 0, 100% 100%, ${p}% 100%)`;
    clipB = `polygon(0 0, ${p}% 0, ${p}% 100%, 0 100%)`;
  } else if (dir === 'up') {
    clipA = `polygon(0 0, 100% 0, 100% ${100 - p}%, 0 ${100 - p}%)`;
    clipB = `polygon(0 ${100 - p}%, 100% ${100 - p}%, 100% 100%, 0 100%)`;
  } else if (dir === 'down') {
    clipA = `polygon(0 ${p}%, 100% ${p}%, 100% 100%, 0 100%)`;
    clipB = `polygon(0 0, 100% 0, 100% ${p}%, 0 ${p}%)`;
  }

  // Wiping normally means A stays in place while B wipes over it, or they both wipe.
  // For a clean wipe, we clip B as it grows, and clip A as it shrinks.
  // Actually, we can just clip B and lay it over A if A is behind it, but z-index isn't strictly controlled here.
  // Clipping both ensures purity.
  return {
    sceneAStyle: { clipPath: clipA },
    sceneBStyle: { clipPath: clipB }
  };
};

export const zoomTransition: TransitionImplementation = (progress, transition) => {
  const dir = transition.direction || 'in';
  
  // zoom in: Scene A scales up and fades out, Scene B scales up from small to normal.
  // zoom out: Scene A scales down, Scene B scales down from large to normal.
  
  let scaleA = 1;
  let scaleB = 1;
  let opacityA = 1;
  let opacityB = 1;

  if (dir === 'in') {
    scaleA = 1 + progress * 0.5;
    opacityA = 1 - progress;
    scaleB = 0.5 + progress * 0.5;
    opacityB = progress;
  } else if (dir === 'out') {
    scaleA = 1 - progress * 0.5;
    opacityA = 1 - progress;
    scaleB = 1.5 - progress * 0.5;
    opacityB = progress;
  }

  return {
    sceneAStyle: { transform: `scale(${scaleA})`, opacity: opacityA },
    sceneBStyle: { transform: `scale(${scaleB})`, opacity: opacityB }
  };
};
