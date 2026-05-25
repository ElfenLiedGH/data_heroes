import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { resolveClientApiKey } from '../config/api-key.config';

export const baseApi = createApi({
  reducerPath: 'api',
  tagTypes: ['Users', 'UserPreferences', 'DefaultPreferences', 'GlobalPolicies'],
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
    prepareHeaders: (headers) => {
      headers.set('X-API-Key', resolveClientApiKey());
      return headers;
    },
  }),
  endpoints: () => ({}),
});
