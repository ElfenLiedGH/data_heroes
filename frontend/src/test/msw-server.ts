import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const DEFAULT_HANDLERS = [
  http.get('http://localhost/api/v1/health', () =>
    HttpResponse.json({ status: 'ok', db: 'ok' }),
  ),
  http.get('http://localhost/api/v1/users/count', () => HttpResponse.json({ count: 0 })),
  http.get('http://localhost/api/v1/users', () => HttpResponse.json({ users: [] })),
];

export const server = setupServer(...DEFAULT_HANDLERS);

export { http, HttpResponse };
