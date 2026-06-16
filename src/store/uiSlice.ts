import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isAuthModalOpen: boolean;
  authView: 'login' | 'otp' | 'verify-email';
  isConnectionModalOpen: boolean;
  connectionTargetId: string | null;
  isWalkthroughOpen: boolean;
}

const initialState: UIState = {
  isAuthModalOpen: false,
  authView: 'login',
  isConnectionModalOpen: false,
  connectionTargetId: null,
  isWalkthroughOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openAuthModal: (state) => {
      state.isAuthModalOpen = true;
      state.authView = 'login';
    },
    closeAuthModal: (state) => {
      state.isAuthModalOpen = false;
    },
    setAuthView: (state, action: PayloadAction<UIState['authView']>) => {
      state.authView = action.payload;
    },
    openConnectionModal: (state, action: PayloadAction<string>) => {
      state.isConnectionModalOpen = true;
      state.connectionTargetId = action.payload;
    },
    closeConnectionModal: (state) => {
      state.isConnectionModalOpen = false;
      state.connectionTargetId = null;
    },
    openWalkthrough: (state) => {
      state.isWalkthroughOpen = true;
    },
    closeWalkthrough: (state) => {
      state.isWalkthroughOpen = false;
    },
  },
});

export const {
  openAuthModal,
  closeAuthModal,
  setAuthView,
  openConnectionModal,
  closeConnectionModal,
  openWalkthrough,
  closeWalkthrough,
} = uiSlice.actions;
export default uiSlice.reducer;
