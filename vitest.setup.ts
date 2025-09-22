import '@testing-library/jest-dom/vitest'

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(performance.now()), 16)

  window.cancelAnimationFrame = (handle: number) => {
    window.clearTimeout(handle)
  }
}
