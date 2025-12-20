import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock de console.warn para tests de deprecation
global.console = {
  ...console,
  warn: vi.fn(),
};

// Mock de IndexedDB (Dexie necesita esto en tests)
global.indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  databases: vi.fn(),
} as any;
