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

export type NotificationsPaginatedResponse = {
  message: string;
  notifs: Notification[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type NotificationsPaginatedArgs = {
  userId: string;
  page: number;
  limit?: number;
  filter?: "all" | "unread";
  search?: string;
};

function markNotificationsRead(notifs: Notification[]) {
  notifs.forEach((notif) => {
    if (notif.type !== "chat_request") {
      notif.isRead = true;
    }
  });
}

export const notificationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotificationsPaginated: builder.query<NotificationsPaginatedResponse, NotificationsPaginatedArgs>({
      query: ({ userId, page, limit = 20, filter = "all", search = "" }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          filter,
        });
        if (search.trim()) {
          params.set("search", search.trim());
        }
        return `/api/bellNotification/paginated/${userId}?${params.toString()}`;
      },
      providesTags: ["NotificationList"],
    }),
    getNotificationPreview: builder.query<NotificationsPaginatedResponse, string>({
      query: (userId) => `/api/bellNotification/paginated/${userId}?page=1&limit=10`,
      providesTags: ["NotificationList"],
    }),
    getChatRequestNotifications: builder.query<{ message: string; notifs: Notification[] }, string>({
      query: (userId) => `/api/bellNotification/chat_requests/${userId}`,
      providesTags: ["ChatRequestNotifications"],
    }),
    getUnreadStatus: builder.query<
      { success: boolean; hasUnreadNotifications: boolean; unreadNotifications: Notification[] },
      string
    >({
      query: (userId) => `/api/bellNotification/has_unread/${userId}`,
      providesTags: ["NotificationUnread"],
    }),
    markAllRead: builder.mutation<{ success: boolean; message: string; modifiedCount: number }, string>({
      query: (userId) => ({
        url: `/api/bellNotification/mark_all_read/${userId}`,
        method: "PUT",
      }),
      async onQueryStarted(userId, { dispatch, queryFulfilled, getState }) {
        const patchUnread = dispatch(
          notificationsApi.util.updateQueryData("getUnreadStatus", userId, (draft) => {
            draft.hasUnreadNotifications = false;
            draft.unreadNotifications = [];
          })
        );

        const patchPreview = dispatch(
          notificationsApi.util.updateQueryData("getNotificationPreview", userId, (draft) => {
            markNotificationsRead(draft.notifs);
          })
        );

        const patchResults: Array<{ undo: () => void }> = [patchUnread, patchPreview];

        const state = getState() as {
          api?: {
            queries?: Record<
              string,
              { endpointName?: string; originalArgs?: NotificationsPaginatedArgs }
            >;
          };
        };

        Object.values(state.api?.queries ?? {}).forEach((entry) => {
          if (entry?.endpointName !== "getNotificationsPaginated" || !entry.originalArgs) {
            return;
          }
          if (entry.originalArgs.userId !== userId) {
            return;
          }
          patchResults.push(
            dispatch(
              notificationsApi.util.updateQueryData(
                "getNotificationsPaginated",
                entry.originalArgs,
                (draft) => {
                  markNotificationsRead(draft.notifs);
                }
              )
            )
          );
        });

        try {
          await queryFulfilled;
          dispatch(notificationsApi.util.invalidateTags(["NotificationList"]));
        } catch {
          patchResults.forEach((patch) => patch.undo());
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsPaginatedQuery,
  useGetNotificationPreviewQuery,
  useGetChatRequestNotificationsQuery,
  useGetUnreadStatusQuery,
  useMarkAllReadMutation,
} = notificationsApi;
