import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// globals: false means @testing-library/react cannot auto-register cleanup,
// so unmount components after each test to keep queries scoped.
afterEach(() => {
  cleanup();
});