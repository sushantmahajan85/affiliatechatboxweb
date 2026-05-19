import { api } from "../api";

export const membersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllUsers: builder.query<any, void>({
      query: () => '/api/users/get_all_users',
      providesTags: ['User'],
    }),
    saveEmailNotifPref: builder.mutation<void, { userId: string; isAllowed: boolean }>({
      query: ({ userId, isAllowed }) => ({
        url: `/api/users/saveEmailNotifPref/${userId}`,
        method: 'POST',
        body: { isAllowed },
      }),
      invalidatesTags: ['User'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllUsersQuery,
  useSaveEmailNotifPrefMutation,
} = membersApi;
