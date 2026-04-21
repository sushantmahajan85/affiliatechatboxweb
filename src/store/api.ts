import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Post', 'Partner', 'Message', 'Notifications', 'ChatHistory', 'Conversations'],
  endpoints: () => ({}), // Empty endpoints object to be populated by injectEndpoints
});
