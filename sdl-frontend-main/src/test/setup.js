import '@testing-library/jest-dom'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock React DOMServer for SVG tests
global.mockRenderToString = vi.fn() 