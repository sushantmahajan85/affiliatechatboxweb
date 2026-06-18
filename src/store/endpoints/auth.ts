import { api } from "../api";

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    googleLogin: builder.mutation<any, any>({
      query: (credentials) => ({
        url: '/api/auth/google-signin',
        method: 'POST',
        body: credentials,
      }),
    }),
    linkedinLogin: builder.mutation<any, any>({
      query: (credentials) => ({
        url: '/api/auth/linkedin-signin',
        method: 'POST',
        body: credentials,
      }),
    }),
    mobileContact: builder.mutation<any, { mobileNumber: string }>({
      query: (body) => ({
        url: '/api/auth/contact',
        method: 'POST',
        body,
      }),
    }),
    verifyUser: builder.mutation<any, { mobileNumber: string }>({
      query: (body) => ({
        url: '/api/auth/verify_User',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    googleVerify: builder.mutation<
      any,
      {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        mobileNumber?: string;
        googleProfileImageUrl?: string;
      }
    >({
      query: (body) => ({
        url: '/api/auth/google-verify',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    firebasePhoneVerify: builder.mutation<any, { firebaseIdToken: string }>({
      query: (body) => ({
        url: "/api/auth/firebase-phone-verify",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    registerUser: builder.mutation<any, { userId: string; data: FormData }>({
      query: ({ userId, data }) => ({
        url: `/api/auth/register/${userId}/add_user`,
        method: 'POST',
        body: data,
      }),
    }),
    getProfile: builder.query<any, string>({
      query: (id) => `/api/users/${id}/get_user`,
      providesTags: ['User'],
    }),
    requestDeleteAccountOtp: builder.mutation<
      { message: string; maskedEmail?: string },
      void
    >({
      query: () => ({
        url: '/api/auth/request-delete-account-otp',
        method: 'POST',
      }),
    }),
    confirmDeleteAccount: builder.mutation<
      { message: string },
      { code: string }
    >({
      query: (body) => ({
        url: '/api/auth/confirm-delete-account',
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGoogleLoginMutation,
  useLinkedinLoginMutation,
  useMobileContactMutation,
  useVerifyUserMutation,
  useGoogleVerifyMutation,
  useFirebasePhoneVerifyMutation,
  useRegisterUserMutation,
  useGetProfileQuery,
  useRequestDeleteAccountOtpMutation,
  useConfirmDeleteAccountMutation,
} = authApi;
