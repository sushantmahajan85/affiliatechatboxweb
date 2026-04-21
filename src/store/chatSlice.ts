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
      const exists = state.activeChats.find(chat => chat.id === action.payload.id);
      if (!exists) {
        // Keep only the 3 most recent chats
        state.activeChats = [action.payload, ...state.activeChats].slice(0, 3);
      } else {
        // Move to front
        state.activeChats = [
          action.payload, 
          ...state.activeChats.filter(chat => chat.id !== action.payload.id)
        ];
      }
      state.isMessagingBarExpanded = true;
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

export const { openChat, closeChat, setMessagingBarExpanded, toggleMessagingBar } = chatSlice.actions;
export default chatSlice.reducer;
