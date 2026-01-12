import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, UserRole } from '../../types';
import { authApi } from '../../api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  otpSent: boolean;
  otpEmail: string | null;
}

const initialState: AuthState = {
  user: authApi.getStoredUser(),
  isAuthenticated: authApi.isAuthenticated(),
  isLoading: false,
  error: null,
  otpSent: false,
  otpEmail: null,
};

export const requestOTP = createAsyncThunk('auth/requestOTP', async (email: string, { rejectWithValue }) => {
  try {
    const response = await authApi.requestOTP(email);
    return { email, ...response.data };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to send OTP');
  }
});

export const verifyOTP = createAsyncThunk('auth/verifyOTP', async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
  try {
    const response = await authApi.verifyOTP(email, otp);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Invalid OTP');
  }
});

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const response = await authApi.getCurrentUser();
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch user');
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try { await authApi.logout(); } catch {}
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    clearOTPState: (state) => { state.otpSent = false; state.otpEmail = null; },
    setUser: (state, action: PayloadAction<User>) => { state.user = action.payload; state.isAuthenticated = true; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestOTP.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(requestOTP.fulfilled, (state, action) => { state.isLoading = false; state.otpSent = true; state.otpEmail = action.payload.email; })
      .addCase(requestOTP.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(verifyOTP.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(verifyOTP.fulfilled, (state, action) => { state.isLoading = false; state.isAuthenticated = true; state.user = action.payload.user; state.otpSent = false; state.otpEmail = null; })
      .addCase(verifyOTP.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; })
      .addCase(fetchCurrentUser.pending, (state) => { state.isLoading = true; })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => { state.isLoading = false; state.user = action.payload; state.isAuthenticated = true; })
      .addCase(fetchCurrentUser.rejected, (state) => { state.isLoading = false; state.isAuthenticated = false; state.user = null; })
      .addCase(logout.fulfilled, (state) => { state.isAuthenticated = false; state.user = null; state.otpSent = false; state.otpEmail = null; });
  },
});

export const { clearError, clearOTPState, setUser } = authSlice.actions;

export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectOTPState = (state: { auth: AuthState }) => ({ sent: state.auth.otpSent, email: state.auth.otpEmail });
export const selectUserRole = (state: { auth: AuthState }): UserRole | null => state.auth.user?.role || null;

export default authSlice.reducer;
