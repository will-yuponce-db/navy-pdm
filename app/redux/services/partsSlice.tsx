import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import type {
  Part,
  PartCategory,
  PartCondition,
  StockStatus,
} from "../../types";
import { addNotification } from "./notificationSlice";
import type { RootState } from "../../types";

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
  parts: [
    {
      id: "LM2500-TRB-001",
      name: "Turbine Blade Set",
      system: "LM2500",
      category: "Hot Section",
      stockLevel: 12,
      minStock: 5,
      maxStock: 25,
      location: "Norfolk Supply Depot",
      condition: "New",
      leadTime: "45 days",
      supplier: "General Electric",
      cost: 75000,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "LM2500-BRG-002",
      name: "Main Bearing Assembly",
      system: "LM2500",
      category: "Rotating Parts",
      stockLevel: 3,
      minStock: 2,
      maxStock: 8,
      location: "San Diego Supply",
      condition: "New",
      leadTime: "60 days",
      supplier: "General Electric",
      cost: 45000,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "LM2500-FIL-003",
      name: "Oil Filter Cartridge",
      system: "LM2500",
      category: "Consumables",
      stockLevel: 85,
      minStock: 50,
      maxStock: 200,
      location: "Norfolk Supply Depot",
      condition: "New",
      leadTime: "14 days",
      supplier: "Parker Hannifin",
      cost: 250,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "LM2500-SEN-004",
      name: "Temperature Sensor",
      system: "LM2500",
      category: "Electronics",
      stockLevel: 1,
      minStock: 5,
      maxStock: 15,
      location: "Pearl Harbor Supply",
      condition: "New",
      leadTime: "30 days",
      supplier: "Honeywell",
      cost: 1500,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "LM2500-PMP-005",
      name: "Main Oil Pump",
      system: "LM2500",
      category: "Hydraulics",
      stockLevel: 2,
      minStock: 3,
      maxStock: 10,
      location: "Norfolk Supply Depot",
      condition: "Refurbished",
      leadTime: "30 days",
      supplier: "General Electric",
      cost: 25000,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "LM2500-FUEL-006",
      name: "Fuel Injector Assembly",
      system: "LM2500",
      category: "Fuel System",
      stockLevel: 8,
      minStock: 4,
      maxStock: 20,
      location: "San Diego Supply",
      condition: "New",
      leadTime: "21 days",
      supplier: "General Electric",
      cost: 12000,
      lastUpdated: new Date().toISOString(),
    },
  ],
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
export const addPartWithNotification = createAsyncThunk(
  "parts/addWithNotification",
  async (partData: Omit<Part, "id" | "lastUpdated">, { dispatch }) => {
    const newPart: Part = {
      id: uuidv4().split("-")[0].toUpperCase(),
      ...partData,
      lastUpdated: new Date().toISOString(),
    };

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

    const updatedPart = { ...part, ...updates, lastUpdated: new Date().toISOString() };

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

    dispatch(
      addNotification({
        type: "success",
        title: "Reorder Request Submitted",
        message: `Reorder request for ${quantity} units of ${part.name} (${part.id}) has been submitted to ${part.supplier}`,
        priority: "medium",
        category: "update",
      }),
    );

    return { id, quantity };
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
