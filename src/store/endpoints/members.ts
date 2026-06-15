import { api } from "../api";

type ProfessionalStatsUser = {
  _id: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  googleProfileImageUrl?: string;
  linkedinProfileImageUrl?: string;
};

type ProfessionalStatsResponse = {
  total: number;
  recentUsers: ProfessionalStatsUser[];
};

export const membersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProfessionalStats: builder.query<ProfessionalStatsResponse, void>({
      query: () => "/api/users/get_all_users?page=1&limit=5",
      transformResponse: (response: {
        users?: ProfessionalStatsUser[];
        pagination?: { total?: number };
      }) => ({
        total: response.pagination?.total ?? response.users?.length ?? 0,
        recentUsers: response.users ?? [],
      }),
      providesTags: ["User"],
    }),
    getAllUsers: builder.query<any, void>({
      query: () => '/api/users/get_all_users',
      providesTags: ['User'],
    }),
    getMembersDirectoryFeed: builder.query<
      {
        message: string;
        users: ProfessionalStatsUser[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          hasMore: boolean;
        };
      },
      { page: number; limit?: number; search?: string }
    >({
      query: ({ page, limit = 12, search = "" }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          directory: "true",
        });
        if (search.trim()) params.set("search", search.trim());
        return `/api/users/get_all_users?${params.toString()}`;
      },
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
    updateMobilePrivacy: builder.mutation<
      { message: string; user: Record<string, unknown> },
      { id: string; isMobilePrivate: boolean }
    >({
      query: (body) => ({
        url: "/api/users/updateMobilePrivacy",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    reportUser: builder.mutation<
      { message: string },
      {
        reporterId: string;
        reportedId: string;
        reason: string;
        postContent?: string;
      }
    >({
      query: (body) => ({
        url: "/api/users/reportuser",
        method: "POST",
        body,
      }),
    }),
    sendReportEmailToAdmin: builder.mutation<
      { success: boolean; message: string },
      {
        reporterName: string;
        postContent: string;
        postUserName: string;
        reportReason: string;
      }
    >({
      query: (body) => ({
        url: "/api/email/newReportEmailToAdmin",
        method: "POST",
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProfessionalStatsQuery,
  useGetAllUsersQuery,
  useGetMembersDirectoryFeedQuery,
  useSaveEmailNotifPrefMutation,
  useUpdateMobilePrivacyMutation,
  useReportUserMutation,
  useSendReportEmailToAdminMutation,
} = membersApi;
