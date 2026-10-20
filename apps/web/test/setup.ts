import '@testing-library/jest-dom';

// Polyfill matchMedia for tests
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// Polyfill PointerEvent for JSDOM
if (typeof window !== 'undefined') {
  if (!window.PointerEvent) {
    class PointerEvent extends MouseEvent {
      pointerId: number;

      constructor(type: string, params: any = {}) {
        super(type, params);
        this.pointerId = params.pointerId ?? 0;
        Object.defineProperty(this, 'clientX', {
          get: () => params.clientX ?? 0,
          configurable: true,
        });
        Object.defineProperty(this, 'clientY', {
          get: () => params.clientY ?? 0,
          configurable: true,
        });
      }
    }
    window.PointerEvent = PointerEvent as any;
    global.PointerEvent = PointerEvent as any;
  }
}

