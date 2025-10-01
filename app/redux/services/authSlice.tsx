import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { authApi } from "../../services/api";
import type { AuthState, User, LoginCredentials, ApiError } from "../../types";

// Helper functions for safe localStorage access during SSR
const safeGetItem = (key: string): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(key);
  }
  return null;
};

const safeSetItem = (key: string, value: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, value);
  }
};

const safeRemoveItem = (key: string): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(key);
  }
};

const initialState: AuthState = {
  user: null,
  token: safeGetItem("authToken"),
  isAuthenticated: !!safeGetItem("authToken"),
  isLoading: false,
  error: null,
};

// Async thunks for authentication
export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      safeSetItem("authToken", response.token);
      return response;
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };
      return rejectWithValue({
        message: err.message || "Login failed",
        status: err.status || 500,
      });
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      safeRemoveItem("authToken");
      return null;
    } catch (error: unknown) {
      // Even if logout fails on server, clear local storage
      safeRemoveItem("authToken");
      const err = error as { message?: string; status?: number };
      return rejectWithValue({
        message: err.message || "Logout failed",
        status: err.status || 500,
      });
    }
  },
);

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const user = await authApi.getCurrentUser();
      return user;
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };
      return rejectWithValue({
        message: err.message || "Failed to get current user",
        status: err.status || 500,
      });
    }
  },
);

export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.refreshToken();
      safeSetItem("authToken", response.token);
      return response.token;
    } catch (error: unknown) {
      safeRemoveItem("authToken");
      const err = error as { message?: string; status?: number };
      return rejectWithValue({
        message: err.message || "Token refresh failed",
        status: err.status || 401,
      });
    }
  },
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (
    data: { currentPassword: string; newPassword: string },
    { rejectWithValue },
  ) => {
    try {
      await authApi.changePassword(data);
      return true;
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };
      return rejectWithValue({
        message: err.message || "Password change failed",
        status: err.status || 500,
      });
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    // Handle token expiration
    handleTokenExpiration: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      safeRemoveItem("authToken");
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as ApiError)?.message || "Login failed";
        state.isAuthenticated = false;
      })

      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })

      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          (action.payload as ApiError)?.message || "Failed to get user";
        // If getting current user fails, user might not be authenticated
        if ((action.payload as ApiError)?.status === 401) {
          state.isAuthenticated = false;
          state.token = null;
          safeRemoveItem("authToken");
        }
      })

      // Refresh token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.token = null;
        state.isAuthenticated = false;
        state.user = null;
      })

      // Change password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          (action.payload as ApiError)?.message || "Password change failed";
      });
  },
});

export const { clearError, setLoading, updateUser, handleTokenExpiration } =
  authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) =>
  state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

// Permission helpers
export const hasPermission = (
  user: User | null,
  permission: string,
): boolean => {
  if (!user) return false;
  return user.permissions.includes(permission) || user.role === "admin";
};

export const hasRole = (user: User | null, role: string): boolean => {
  if (!user) return false;
  return user.role === role || user.role === "admin";
};

export const canAccessWorkOrders = (user: User | null): boolean => {
  return hasPermission(user, "work_orders:read");
};

export const canModifyWorkOrders = (user: User | null): boolean => {
  return hasPermission(user, "work_orders:write");
};

export const canDeleteWorkOrders = (user: User | null): boolean => {
  return hasPermission(user, "work_orders:delete");
};

export const canAccessParts = (user: User | null): boolean => {
  return hasPermission(user, "parts:read");
};

export const canModifyParts = (user: User | null): boolean => {
  return hasPermission(user, "parts:write");
};

export const canAccessAnalytics = (user: User | null): boolean => {
  return hasPermission(user, "analytics:read");
};

export const canManageUsers = (user: User | null): boolean => {
  return hasPermission(user, "users:write");
};

export default authSlice.reducer;
