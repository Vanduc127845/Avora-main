import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('zustand', () => ({
  create: vi.fn(() => ({
    getState: vi.fn(),
    setState: vi.fn(),
    subscribe: vi.fn(),
  })),
}));

global.fetch = vi.fn();
