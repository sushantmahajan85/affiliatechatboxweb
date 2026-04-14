import { api } from "../api";

export interface Notification {
  _id: string;
  receiverId: string | null;
  title: string;
  message: string;
  type: "post_approved" | "admin_pinned" | "chat_request" | "admin_manual";
  isRead: boolean;
  timestamp: string;
  postId?: string;
  senderId?: string;
}

export const notificationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<{ message: string; notifs: Notification[] }, string>({
      query: (userId) => `/api/bellNotification/get_all_notif/${userId}`,
      providesTags: ['Notifications'],
    }),
    getUnreadStatus: builder.query<{ success: boolean; hasUnreadNotifications: boolean; unreadNotifications: Notification[] }, string>({
      query: (userId) => `/api/bellNotification/has_unread/${userId}`,
      providesTags: ['Notifications'],
    }),
    markAllRead: builder.mutation<{ success: boolean; message: string; modifiedCount: number }, string>({
      query: (userId) => ({
        url: `/api/bellNotification/mark_all_read/${userId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsQuery,
  useGetUnreadStatusQuery,
  useMarkAllReadMutation,
} = notificationsApi;
