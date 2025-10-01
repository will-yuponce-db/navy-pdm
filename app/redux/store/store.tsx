import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import workOrderReducer from "../services/workOrderSlice";
import notificationReducer from "../services/notificationSlice";
import partsReducer from "../services/partsSlice";
import authReducer from "../services/authSlice";
import assetReducer from "../services/assetSlice";

export const store = configureStore({
  reducer: {
    workOrders: workOrderReducer,
    notifications: notificationReducer,
    parts: partsReducer,
    auth: authReducer,
    assets: assetReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        ignoredActionsPaths: ["meta.arg", "payload.timestamp"],
        ignoredPaths: [
          "items.dates",
          "parts.parts.lastUpdated",
          "notifications.notifications.timestamp",
        ],
      },
      immutableCheck: {
        ignoredPaths: [
          "parts.parts.lastUpdated",
          "notifications.notifications.timestamp",
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== "production" ? {
    name: "Navy PdM Store",
    trace: true,
    traceLimit: 25,
  } : false,
});

// Setup listeners for refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
