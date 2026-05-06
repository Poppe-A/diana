import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../api/client';
import { getAxiosErrorMessage } from '../api/errors';

export type AuthUser = { id: number; email: string };

export const fetchMe = createAsyncThunk('auth/fetchMe', async () => {
  const { data } = await api.get<AuthUser | null>('/auth/me');
  return data;
});

export const login = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post<AuthUser>('/auth/login', payload);
      return data;
    } catch (e) {
      return rejectWithValue(getAxiosErrorMessage(e));
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post<AuthUser>('/auth/register', payload);
      return data;
    } catch (e) {
      return rejectWithValue(getAxiosErrorMessage(e));
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout');
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null as AuthUser | null,
    status: 'idle' as 'idle' | 'loading',
    error: null as string | null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = 'idle';
        state.user = action.payload;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.status = 'idle';
        state.user = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.error = (action.payload as string) ?? action.error.message ?? 'Login failed';
      })
      .addCase(register.fulfilled, (state) => {
        state.user = null;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.error = (action.payload as string) ?? action.error.message ?? 'Register failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
