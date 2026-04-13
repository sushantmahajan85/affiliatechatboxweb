import { api } from "../api";

export const membersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllUsers: builder.query<any, void>({
      query: () => '/api/users/get_all_users',
      providesTags: ['User'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllUsersQuery,
} = membersApi;
