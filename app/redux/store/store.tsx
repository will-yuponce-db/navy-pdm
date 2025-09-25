import { configureStore } from "@reduxjs/toolkit";
// Or from '@reduxjs/toolkit/query/react'
import { setupListeners } from "@reduxjs/toolkit/query";
import workOrderReducer from "../services/workOrderSlice";
import notificationReducer from "../services/notificationSlice";
import partsReducer from "../services/partsSlice";
import type { RootState } from "../../types";

export const store = configureStore({
  reducer: {
    // Add the generated reducer as a specific top-level slice
    workOrder: workOrderReducer,
    notifications: notificationReducer,
    parts: partsReducer,
  },
});

// optional, but required for refetchOnFocus/refetchOnReconnect behaviors
// see `setupListeners` docs - takes an optional callback as the 2nd arg for customization
setupListeners(store.dispatch);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
