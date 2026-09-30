import '@testing-library/jest-dom/vitest';

// jsdom lacks a few browser APIs used by Mantine.
if (typeof window !== 'undefined') {
  window.matchMedia ||= query => ({
    matches: false, media: query, onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
  });
  globalThis.ResizeObserver ||= class { observe() {} unobserve() {} disconnect() {} };
  window.HTMLElement.prototype.scrollIntoView ||= () => {};
}
