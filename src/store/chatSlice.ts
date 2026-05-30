import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ActiveChat {
  id: string;
  name: string;
  avatar: string;
  status?: 'online' | 'offline';
  lastMsg?: string;
}

interface ChatState {
  activeChats: ActiveChat[];
  isMessagingBarExpanded: boolean;
}

const initialState: ChatState = {
  activeChats: [],
  isMessagingBarExpanded: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    openChat: (state, action: PayloadAction<ActiveChat>) => {
      const exists = state.activeChats.find((chat) => chat.id === action.payload.id);
      if (!exists) {
        state.activeChats = [action.payload, ...state.activeChats].slice(0, 3);
      } else {
        const merged = {
          ...exists,
          ...action.payload,
          name:
            action.payload.name !== "User" ? action.payload.name : exists.name,
          avatar: action.payload.avatar || exists.avatar,
        };
        state.activeChats = [
          merged,
          ...state.activeChats.filter((chat) => chat.id !== action.payload.id),
        ];
      }
      state.isMessagingBarExpanded = true;
    },
    updateActiveChatProfile: (
      state,
      action: PayloadAction<{ id: string; name: string; avatar: string }>
    ) => {
      const chat = state.activeChats.find((c) => c.id === action.payload.id);
      if (chat) {
        chat.name = action.payload.name;
        chat.avatar = action.payload.avatar;
      }
    },
    closeChat: (state, action: PayloadAction<string>) => {
      state.activeChats = state.activeChats.filter(chat => chat.id !== action.payload);
    },
    setMessagingBarExpanded: (state, action: PayloadAction<boolean>) => {
      state.isMessagingBarExpanded = action.payload;
    },
    toggleMessagingBar: (state) => {
      state.isMessagingBarExpanded = !state.isMessagingBarExpanded;
    },
  },
});

export const {
  openChat,
  closeChat,
  setMessagingBarExpanded,
  toggleMessagingBar,
  updateActiveChatProfile,
} = chatSlice.actions;
export default chatSlice.reducer;
