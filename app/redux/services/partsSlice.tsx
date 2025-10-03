import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

import type {
  Part,
  PartCategory,
  PartCondition,
  StockStatus,
  RootState,
} from "../../types";
import { addNotification } from "./notificationSlice";
import { partsApi, databricksApi } from "../../services/api";

export interface PartsState {
  parts: Part[];
  loading: boolean;
  error: string | null;
  filters: {
    category?: PartCategory;
    condition?: PartCondition;
    stockStatus?: StockStatus;
    system?: string;
    searchTerm?: string;
  };
}

const initialState: PartsState = {
  parts: [],
  loading: false,
  error: null,
  filters: {},
};

// Helper function to determine stock status
export const getStockStatus = (
  current: number,
  min: number,
  max: number,
): StockStatus => {
  if (current <= min) return "Critical";
  if (current <= min * 1.5) return "Low";
  if (current >= max * 0.9) return "Overstocked";
  return "Adequate";
};

// Thunk actions for parts operations with notifications
export const fetchParts = createAsyncThunk(
  "parts/fetchParts",
  async (
    params?: {
      page?: number;
      limit?: number;
      category?: string;
      condition?: string;
      search?: string;
    },
    { dispatch },
  ) => {
    try {
      // Try Databricks parts endpoint first
      console.log("Attempting to fetch parts from Databricks...");
      const response = await databricksApi.getParts(params);

      console.log("Successfully fetched parts from Databricks");

      // Optionally notify user about successful Databricks connection (suppress for frequent updates)
      if (response.fallback) {
        dispatch(
          addNotification({
            type: "warning",
            title: "Data Source: Local Database",
            message:
              "Parts data loaded from local database (Databricks fallback).",
            priority: "low",
            category: "system",
          }),
        );
      }

      return response.items;
    } catch (databricksError) {
      // Databricks failed, fallback to local SQLite database
      console.warn(
        "Databricks parts API failed, falling back to local SQLite API:",
        databricksError,
      );

      try {
        console.log("Attempting to fetch parts from local SQLite database...");
        const response = await partsApi.getAll(params);

        console.log("Successfully fetched parts from SQLite");

        // Notify user about fallback to SQLite
        dispatch(
          addNotification({
            type: "warning",
            title: "Data Source: Local Database",
            message: `Databricks unavailable. Loaded ${response.items.length} parts from local database.`,
            priority: "medium",
            category: "system",
          }),
        );

        return response.items;
      } catch (sqliteError) {
        // Both databases failed
        console.error(
          "Both Databricks and SQLite failed for parts:",
          sqliteError,
        );

        dispatch(
          addNotification({
            type: "error",
            title: "Database Connection Failed",
            message: "Unable to fetch parts from any data source.",
            priority: "high",
            category: "system",
          }),
        );

        throw new Error(
          `Failed to fetch parts from both Databricks and SQLite: ${databricksError instanceof Error ? databricksError.message : "Unknown error"}`,
        );
      }
    }
  },
);

export const addPartWithNotification = createAsyncThunk(
  "parts/addWithNotification",
  async (partData: Omit<Part, "id" | "lastUpdated">, { dispatch }) => {
    const newPart = await partsApi.create({
      ...partData,
      id: uuidv4().split("-")[0].toUpperCase(),
    });

    // Check for low stock alerts
    const stockStatus = getStockStatus(
      newPart.stockLevel,
      newPart.minStock,
      newPart.maxStock,
    );
    if (stockStatus === "Critical") {
      dispatch(
        addNotification({
          type: "error",
          title: "Critical Stock Alert",
          message: `Part ${newPart.name} (${newPart.id}) is at critical stock level: ${newPart.stockLevel} units`,
          priority: "critical",
          category: "alert",
        }),
      );
    } else if (stockStatus === "Low") {
      dispatch(
        addNotification({
          type: "warning",
          title: "Low Stock Alert",
          message: `Part ${newPart.name} (${newPart.id}) is running low: ${newPart.stockLevel} units`,
          priority: "high",
          category: "alert",
        }),
      );
    }

    return newPart;
  },
);

export const updatePartWithNotification = createAsyncThunk(
  "parts/updateWithNotification",
  async (
    { id, updates }: { id: string; updates: Partial<Part> },
    { dispatch, getState },
  ) => {
    const state = getState() as RootState;
    const part = state.parts.parts.find((p) => p.id === id);

    if (!part) {
      throw new Error(`Part ${id} not found`);
    }

    const updatedPart = await partsApi.update(id, updates);

    // Check for stock level changes
    if (updates.stockLevel !== undefined) {
      const oldStatus = getStockStatus(
        part.stockLevel,
        part.minStock,
        part.maxStock,
      );
      const newStatus = getStockStatus(
        updatedPart.stockLevel,
        updatedPart.minStock,
        updatedPart.maxStock,
      );

      if (oldStatus !== newStatus) {
        if (newStatus === "Critical") {
          dispatch(
            addNotification({
              type: "error",
              title: "Critical Stock Alert",
              message: `Part ${updatedPart.name} (${updatedPart.id}) is now at critical stock level: ${updatedPart.stockLevel} units`,
              priority: "critical",
              category: "alert",
            }),
          );
        } else if (newStatus === "Low") {
          dispatch(
            addNotification({
              type: "warning",
              title: "Low Stock Alert",
              message: `Part ${updatedPart.name} (${updatedPart.id}) is now running low: ${updatedPart.stockLevel} units`,
              priority: "high",
              category: "alert",
            }),
          );
        }
      }
    }

    return { id, updates: updatedPart };
  },
);

export const deletePartWithNotification = createAsyncThunk(
  "parts/deleteWithNotification",
  async (id: string, { dispatch, getState }) => {
    const state = getState() as RootState;
    const part = state.parts.parts.find((p) => p.id === id);

    if (!part) {
      throw new Error(`Part ${id} not found`);
    }

    await partsApi.delete(id);

    dispatch(
      addNotification({
        type: "info",
        title: "Part Deleted",
        message: `Part ${part.name} (${part.id}) has been removed from inventory`,
        priority: "medium",
        category: "update",
      }),
    );

    return id;
  },
);

export const reorderPartWithNotification = createAsyncThunk(
  "parts/reorderWithNotification",
  async (
    { id, quantity }: { id: string; quantity: number },
    { dispatch, getState },
  ) => {
    const state = getState() as RootState;
    const part = state.parts.parts.find((p) => p.id === id);

    if (!part) {
      throw new Error(`Part ${id} not found`);
    }

    try {
      // Create a supply requisition/order
      const orderNumber = `PR-${Date.now().toString().slice(-6)}`;

      const requisitionData = {
        partType: part.name,
        quantityShipped: quantity,
        stockLocationId: part.stockLocationId || "supply_1",
        stockLocation: part.location,
        designatorId: part.id, // Using part ID as designator for now
        designator: `${part.system} System`, // Using system as designator
        orderNumber: orderNumber,
      };

      // Submit the requisition
      await databricksApi.createPartsRequisition(requisitionData);

      dispatch(
        addNotification({
          type: "success",
          title: "Supply Order Created",
          message: `Supply order ${orderNumber} created for ${quantity} units of ${part.name} from ${part.location}. View in Supply Orders tab.`,
          priority: "medium",
          category: "update",
        }),
      );

      return { id, quantity, orderNumber };
    } catch (error) {
      console.error("Failed to create supply requisition:", error);

      // Still notify user but indicate it's pending
      dispatch(
        addNotification({
          type: "warning",
          title: "Reorder Request Pending",
          message: `Reorder request for ${quantity} units of ${part.name} is pending. Backend connection required to create supply order.`,
          priority: "medium",
          category: "update",
        }),
      );

      return { id, quantity, orderNumber: null };
    }
  },
);

const partsSlice = createSlice({
  name: "parts",
  initialState,
  reducers: {
    setFilters: (
      state,
      action: PayloadAction<Partial<PartsState["filters"]>>,
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch parts
      .addCase(fetchParts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParts.fulfilled, (state, action) => {
        state.loading = false;
        state.parts = action.payload;
      })
      .addCase(fetchParts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch parts";
      })
      // Add part
      .addCase(addPartWithNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPartWithNotification.fulfilled, (state, action) => {
        state.loading = false;
        state.parts.push(action.payload);
      })
      .addCase(addPartWithNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to add part";
      })
      // Update part
      .addCase(updatePartWithNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePartWithNotification.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.parts.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.parts[index] = action.payload.updates;
        }
      })
      .addCase(updatePartWithNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update part";
      })
      // Delete part
      .addCase(deletePartWithNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePartWithNotification.fulfilled, (state, action) => {
        state.loading = false;
        state.parts = state.parts.filter((p) => p.id !== action.payload);
      })
      .addCase(deletePartWithNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete part";
      })
      // Reorder part
      .addCase(reorderPartWithNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderPartWithNotification.fulfilled, (state) => {
        state.loading = false;
        // In a real application, this would trigger a reorder process
        // For now, we just log the reorder request
      })
      .addCase(reorderPartWithNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to submit reorder";
      });
  },
});

export const { setFilters, clearFilters, setLoading, setError } =
  partsSlice.actions;

// Selectors
export const selectAllParts = (state: RootState) => {
  return state.parts?.parts || [];
};
export const selectPartsLoading = (state: RootState) =>
  state.parts?.loading || false;
export const selectPartsError = (state: RootState) =>
  state.parts?.error || null;
export const selectPartsFilters = (state: RootState) =>
  state.parts?.filters || {};

export const selectFilteredParts = (state: RootState) => {
  const parts = state.parts?.parts || [];
  const filters = state.parts?.filters || {};

  // Early return if no filters applied
  if (
    !filters.category &&
    !filters.condition &&
    !filters.stockStatus &&
    !filters.system &&
    !filters.searchTerm
  ) {
    return parts;
  }

  return parts.filter((part) => {
    // Category filter
    if (filters.category && part.category !== filters.category) {
      return false;
    }

    // Condition filter
    if (filters.condition && part.condition !== filters.condition) {
      return false;
    }

    // Stock status filter
    if (filters.stockStatus) {
      const stockStatus = getStockStatus(
        part.stockLevel,
        part.minStock,
        part.maxStock,
      );
      if (stockStatus !== filters.stockStatus) {
        return false;
      }
    }

    // System filter
    if (filters.system && part.system !== filters.system) {
      return false;
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch =
        part.name.toLowerCase().includes(searchLower) ||
        part.id.toLowerCase().includes(searchLower) ||
        part.supplier.toLowerCase().includes(searchLower) ||
        part.location.toLowerCase().includes(searchLower);

      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });
};

export const selectPartsSummary = (state: RootState) => {
  const parts = selectFilteredParts(state);

  return {
    totalParts: parts.length,
    criticalStock: parts.filter(
      (p) =>
        getStockStatus(p.stockLevel, p.minStock, p.maxStock) === "Critical",
    ).length,
    lowStock: parts.filter(
      (p) => getStockStatus(p.stockLevel, p.minStock, p.maxStock) === "Low",
    ).length,
    totalValue: parts.reduce(
      (sum, part) => sum + part.cost * part.stockLevel,
      0,
    ),
  };
};

export { partsSlice };
export default partsSlice.reducer;
