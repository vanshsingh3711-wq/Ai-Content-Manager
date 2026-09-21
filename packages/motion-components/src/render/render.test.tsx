import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { RenderErrorBoundary } from './RenderErrorBoundary';
import { SequenceRenderer } from '../elements/Sequence/SequenceRenderer';
import { renderFixtureSequence } from './render.fixture';
import { RenderLoadingState } from './RenderLoadingState';

// Component that throws an error when rendered
const ThrowError: React.FC = () => {
  throw new Error('Component crashed deterministically');
};

describe('Preview / Render Hardening', () => {
  it('ErrorBoundary intercepts crashes and displays fallback UI', () => {
    const originalError = console.error;
    console.error = () => {}; // Silence error for test

    const { container } = render(
      <RenderErrorBoundary>
        <ThrowError />
      </RenderErrorBoundary>
    );

    // It should render the fallback instead of throwing up to the test runner
    expect(container.textContent).toContain('Render Error');
    expect(container.textContent).toContain('Component crashed deterministically');

    console.error = originalError;
  });

  it('SequenceRenderer safely handles empty sequences', () => {
    const { container } = render(
      <SequenceRenderer 
        sequence={{ scenes: [] } as any}
        renderScene={() => <div />}
        forceFrame={0}
      />
    );
    // Should render empty black fallback without crashing
    expect(container).toBeTruthy();
  });

  it('RenderLoadingState displays rendering and error correctly', () => {
    const { container, rerender } = render(
      <RenderLoadingState status="loading">
        <div>Content</div>
      </RenderLoadingState>
    );
    expect(container.textContent).toContain('Loading Assets');
    
    rerender(
      <RenderLoadingState status="rendering">
        <div>Content</div>
      </RenderLoadingState>
    );
    expect(container.textContent).toContain('Rendering Frame');

    rerender(
      <RenderLoadingState status="error">
        <div>Content</div>
      </RenderLoadingState>
    );
    expect(container.textContent).toContain('Failed to Load');
  });
});
