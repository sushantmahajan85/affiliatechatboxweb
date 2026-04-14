import { createSlice } from '@reduxjs/toolkit';

interface UIState {
  isAuthModalOpen: boolean;
  authView: 'login' | 'otp' | 'verify-email';
}

const initialState: UIState = {
  isAuthModalOpen: false,
  authView: 'login',
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
    setAuthView: (state, action: { payload: UIState['authView'] }) => {
      state.authView = action.payload;
    },
  },
});

export const { openAuthModal, closeAuthModal, setAuthView } = uiSlice.actions;
export default uiSlice.reducer;
