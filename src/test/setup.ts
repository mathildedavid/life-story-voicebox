import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock MediaRecorder constructor
const mockMediaRecorderConstructor = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  state: 'inactive',
  stream: null,
  mimeType: 'audio/webm',
  ondataavailable: null,
  onstart: null,
  onstop: null,
  onpause: null,
  onresume: null,
  onerror: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Add the static method to the constructor
Object.defineProperty(mockMediaRecorderConstructor, 'isTypeSupported', {
  value: vi.fn().mockReturnValue(true),
  writable: true
});

global.MediaRecorder = mockMediaRecorderConstructor as any;

// Mock Audio
global.Audio = vi.fn().mockImplementation(() => ({
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn(),
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  paused: true,
  ended: false,
  onended: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));