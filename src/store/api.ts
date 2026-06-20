import { getApiBaseUrl } from '@/lib/api-base-url';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { logout } from '@/store/authSlice';
import { toast } from 'sonner';
import { sanitizeFetchArgs } from '@/lib/sanitize-plain-text';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getApiBaseUrl('http://localhost:8000'),
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: { token: string | null } }).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithAccountGuard: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const sanitizedArgs = sanitizeFetchArgs(args);
  const result = await rawBaseQuery(sanitizedArgs, api, extraOptions);
  const code = (result.error?.data as { code?: string } | undefined)?.code;

  if (
    result.error?.status === 403 &&
    (code === 'account_suspended' || code === 'account_deleted')
  ) {
    api.dispatch(logout());
    if (code === 'account_suspended') {
      toast.error('Your account has been suspended. Contact support for assistance.');
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAccountGuard,
  tagTypes: ['User', 'Post', 'Partner', 'Message', 'Notifications', 'ChatHistory', 'Conversations'],
  endpoints: () => ({}),
});
