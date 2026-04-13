import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNumber?: string;
  profileImageUrl?: string;
  isverified: boolean;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  userId: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: Cookies.get('jwttoken') || null,
  userId: Cookies.get('userId') || null,
  isAuthenticated: !!Cookies.get('jwttoken'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      { payload: { user, token } }: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = user;
      state.token = token;
      state.userId = user._id;
      state.isAuthenticated = true;
      Cookies.set('jwttoken', token, { expires: 30 });
      Cookies.set('userId', user._id, { expires: 30 });
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.userId = null;
      state.isAuthenticated = false;
      Cookies.remove('jwttoken');
      Cookies.remove('userId');
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;

export default authSlice.reducer;
