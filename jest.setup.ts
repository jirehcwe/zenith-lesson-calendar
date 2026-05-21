import "@testing-library/jest-dom";

// jsdom does not implement ResizeObserver; polyfill it so @headlessui/react Listbox works in tests.
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom does not implement IntersectionObserver; polyfill it for components that use it.
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;
