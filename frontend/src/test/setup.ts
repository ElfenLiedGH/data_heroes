import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

async function mockFetch(input: RequestInfo | URL): Promise<Response> {
  const url = resolveUrl(input);
  const { pathname } = new URL(url);

  if (pathname.endsWith('/health')) {
    return jsonResponse({ status: 'ok' });
  }
  if (pathname.endsWith('/users/count')) {
    return jsonResponse({ count: 0 });
  }
  if (pathname.endsWith('/users')) {
    return jsonResponse({ users: [] });
  }

  return jsonResponse({ message: 'Not found' }, 404);
}

vi.stubGlobal('fetch', vi.fn(mockFetch));

afterEach(() => {
  vi.mocked(fetch).mockClear();
  vi.mocked(fetch).mockImplementation(mockFetch);
});
