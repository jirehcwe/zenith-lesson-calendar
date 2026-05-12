import "@testing-library/jest-dom";

// jsdom does not implement ResizeObserver; polyfill it so @headlessui/react Listbox works in tests.
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
