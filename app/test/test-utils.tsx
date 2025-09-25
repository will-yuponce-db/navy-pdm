import { render, RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { ReactElement } from "react";
import { BrowserRouter } from "react-router";
import workOrderReducer from "../redux/services/workOrderSlice";
import notificationReducer from "../redux/services/notificationSlice";
import partsReducer from "../redux/services/partsSlice";
import type { RootState } from "../types";

// Create a test store
const createTestStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: {
      workOrder: workOrderReducer,
      notifications: notificationReducer,
      parts: partsReducer,
    },
    preloadedState: {
      workOrder: [],
      notifications: [],
      parts: {
        parts: [],
        loading: false,
        error: null,
        filters: {},
      },
      ...preloadedState,
    },
  });
};

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    ...renderOptions
  }: {
    preloadedState?: Partial<RootState>;
    store?: ReturnType<typeof createTestStore>;
  } & Omit<RenderOptions, "wrapper"> = {},
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
export { createTestStore };
