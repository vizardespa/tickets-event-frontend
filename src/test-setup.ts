/**
 * Global test setup, loaded before every spec file (see the `test` target in `angular.json`).
 *
 * jsdom does not implement `ResizeObserver`, which the navbar uses to collapse its links, so
 * component tests that render the navbar would throw `ReferenceError: ResizeObserver is not defined`.
 * This no-op stub keeps them running; real layout measurement is not exercised under jsdom.
 */
class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver ??= ResizeObserverStub;
