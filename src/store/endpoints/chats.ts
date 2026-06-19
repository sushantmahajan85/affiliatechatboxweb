import { api } from "../api";

export interface SendMessageRequest {
  message: string;
  receiverId: string;
  senderId: string;
}

export interface ChatMessage {
  _id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatPartner {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string | null;
  unreadCount: number;
  online: boolean;
}

export const chatsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    sendChatMessage: builder.mutation<void, SendMessageRequest>({
      query: (body) => ({
        url: '/api/chat/send',
        method: 'POST',
        body,
      }),
      async onQueryStarted({ message, receiverId, senderId }, { dispatch, queryFulfilled }) {
        // Optimistic Update for Chat History
        const patchResult = dispatch(
          chatsApi.util.updateQueryData('getChatHistory', { userId1: senderId, userId2: receiverId }, (draft) => {
            draft.history.push({
              _id: `temp-${Date.now()}`,
              senderId,
              receiverId,
              message,
              timestamp: new Date().toISOString(),
              isRead: false
            });
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['ChatHistory', 'Conversations'],
    }),
    getChatHistory: builder.query<{ history: ChatMessage[] }, { userId1: string; userId2: string }>({
      query: ({ userId1, userId2 }) => `/api/chat/history/${userId1}/${userId2}`,
      providesTags: ['ChatHistory'],
    }),
    getConversations: builder.query<{ conversations: ChatPartner[] }, string>({
      query: (userId) => `/api/chat/conversations/${userId}`,
      providesTags: ['Conversations'],
    }),
    markChatAsRead: builder.mutation<void, { userId: string; partnerId: string }>({
      query: (body) => ({
        url: '/api/chat/mark-read',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Conversations', 'Notifications'],
      async onQueryStarted({ userId, partnerId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          chatsApi.util.updateQueryData('getConversations', userId, (draft) => {
            const conv = draft.conversations.find((c) => String(c.id) === String(partnerId));
            if (conv) conv.unreadCount = 0;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useSendChatMessageMutation,
  useGetChatHistoryQuery,
  useGetConversationsQuery,
  useMarkChatAsReadMutation,
} = chatsApi;
