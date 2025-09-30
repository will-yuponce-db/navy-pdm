import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import workOrderReducer from "../services/workOrderSlice";
import notificationReducer from "../services/notificationSlice";
import partsReducer from "../services/partsSlice";
import authReducer from "../services/authSlice";

export const store = configureStore({
  reducer: {
    workOrders: workOrderReducer,
    notifications: notificationReducer,
    parts: partsReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: [
          'items.dates',
          'parts.parts.lastUpdated',
          'parts.parts.0.lastUpdated',
          'parts.parts.1.lastUpdated',
          'parts.parts.2.lastUpdated',
          'parts.parts.3.lastUpdated',
          'parts.parts.4.lastUpdated',
          'parts.parts.5.lastUpdated',
        ],
      },
      immutableCheck: {
        ignoredPaths: ['parts.parts.lastUpdated'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Setup listeners for refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
