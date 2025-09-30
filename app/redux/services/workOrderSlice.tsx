import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import type { WorkOrder, WorkOrderState } from "../../types";
import {
  addNotification,
  createWorkOrderNotifications,
} from "./notificationSlice";
import { selectAllParts, getStockStatus } from "./partsSlice";
import { workOrdersApi } from "../../services/api";
import type { RootState } from "../../types";

const initialState: WorkOrderState = {
  workOrders: [],
  loading: false,
  error: null,
};

// Thunk actions for work order operations with notifications
export const fetchWorkOrders = createAsyncThunk(
  "workOrders/fetchWorkOrders",
  async (params?: { page?: number; limit?: number; status?: string; priority?: string; search?: string }) => {
    const response = await workOrdersApi.getAll(params);
    return response.items;
  }
);

export const addWorkOrderWithNotification = createAsyncThunk(
  "workOrders/addWithNotification",
  async (
    workOrderData: Omit<WorkOrder, "wo" | "createdAt" | "updatedAt">,
    { dispatch, getState },
  ) => {
    const state = getState() as RootState;
    const parts = selectAllParts(state);

    const newWorkOrder = await workOrdersApi.create({
      ...workOrderData,
      wo: uuidv4().split("-")[0].toUpperCase(),
    } as WorkOrder);

    // Dispatch notification
    dispatch(
      addNotification(
        createWorkOrderNotifications.workOrderCreated(newWorkOrder),
      ),
    );

    // Check for CASREP alerts
    if (newWorkOrder.priority === "CASREP") {
      dispatch(
        addNotification(createWorkOrderNotifications.casrepAlert(newWorkOrder)),
      );
    } else if (newWorkOrder.priority === "Urgent") {
      dispatch(
        addNotification(
          createWorkOrderNotifications.urgentWorkOrder(newWorkOrder),
        ),
      );
    }

    // Check parts availability if parts are required
    if (newWorkOrder.partsRequired) {
      const requiredParts = newWorkOrder.partsRequired.toLowerCase();
      const unavailableParts = parts.filter((part) => {
        const partName = part.name.toLowerCase();
        const partId = part.id.toLowerCase();
        const isRequired =
          requiredParts.includes(partName) || requiredParts.includes(partId);

        if (isRequired) {
          const stockStatus = getStockStatus(
            part.stockLevel,
            part.minStock,
            part.maxStock,
          );
          return stockStatus === "Critical" || stockStatus === "Low";
        }
        return false;
      });

      if (unavailableParts.length > 0) {
        dispatch(
          addNotification({
            type: "warning",
            title: "Parts Availability Alert",
            message: `Work order ${newWorkOrder.wo} requires parts that are low in stock: ${unavailableParts.map((p) => p.name).join(", ")}`,
            priority: "high",
            category: "alert",
            workOrderId: newWorkOrder.wo,
          }),
        );
      }
    }

    return newWorkOrder;
  },
);

export const updateWorkOrderWithNotification = createAsyncThunk(
  "workOrders/updateWithNotification",
  async (
    { wo, updates }: { wo: string; updates: Partial<WorkOrder> },
    { dispatch, getState },
  ) => {
    const state = getState() as RootState;
    const workOrder = state.workOrders.workOrders.find((w) => w.wo === wo);

    if (!workOrder) {
      throw new Error(`Work order ${wo} not found`);
    }

    const updatedWorkOrder = await workOrdersApi.update(wo, updates);

    // Dispatch notification for status changes
    if (updates.status && updates.status !== workOrder.status) {
      dispatch(
        addNotification(
          createWorkOrderNotifications.workOrderUpdated(workOrder, {
            status: updates.status,
          }),
        ),
      );
    }

    return { wo, updates: updatedWorkOrder };
  },
);

export const deleteWorkOrderWithNotification = createAsyncThunk(
  "workOrders/deleteWithNotification",
  async (workOrderIds: string[], { dispatch }) => {
    // Delete work orders from API
    await Promise.all(workOrderIds.map(id => workOrdersApi.delete(id)));

    // Dispatch notification
    dispatch(
      addNotification(
        createWorkOrderNotifications.workOrderDeleted(workOrderIds),
      ),
    );

    return workOrderIds;
  },
);

const workOrderSlice = createSlice({
  name: "workOrders",
  initialState,
  reducers: {
    addWorkOrder: (
      state,
      action: PayloadAction<Omit<WorkOrder, "wo" | "createdAt" | "updatedAt">>,
    ) => {
    const newWorkOrder: WorkOrder = {
      wo: uuidv4().split("-")[0].toUpperCase(),
      ...action.payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
      state.workOrders.push(newWorkOrder);
    },
    deleteWorkOrder: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach((wo) => {
        const index = state.workOrders.findIndex((elem) => elem.wo === wo);
        if (index !== -1) {
          state.workOrders.splice(index, 1);
        }
      });
    },
    updateWorkOrder: (
      state,
      action: PayloadAction<{ wo: string; updates: Partial<WorkOrder> }>,
    ) => {
      const { wo, updates } = action.payload;
      const index = state.workOrders.findIndex((elem) => elem.wo === wo);
      if (index !== -1) {
        state.workOrders[index] = {
          ...state.workOrders[index],
          ...updates,
          updatedAt: new Date(),
        };
      }
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
      // Fetch work orders
      .addCase(fetchWorkOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.workOrders = [...action.payload];
      })
      .addCase(fetchWorkOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch work orders";
      })
      // Add work order
      .addCase(addWorkOrderWithNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addWorkOrderWithNotification.fulfilled, (state, action) => {
        state.loading = false;
        state.workOrders.push(action.payload);
      })
      .addCase(addWorkOrderWithNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to add work order";
      })
      // Update work order
      .addCase(updateWorkOrderWithNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWorkOrderWithNotification.fulfilled, (state, action) => {
        state.loading = false;
        const { wo, updates } = action.payload;
        const index = state.workOrders.findIndex((elem) => elem.wo === wo);
        if (index !== -1) {
          state.workOrders[index] = updates;
        }
      })
      .addCase(updateWorkOrderWithNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update work order";
      })
      // Delete work order
      .addCase(deleteWorkOrderWithNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteWorkOrderWithNotification.fulfilled, (state, action) => {
        state.loading = false;
        action.payload.forEach((wo) => {
          const index = state.workOrders.findIndex((elem) => elem.wo === wo);
          if (index !== -1) {
            state.workOrders.splice(index, 1);
          }
        });
      })
      .addCase(deleteWorkOrderWithNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete work order";
      });
  },
});

export const { addWorkOrder, deleteWorkOrder, updateWorkOrder, setLoading, setError } =
  workOrderSlice.actions;

// Selectors
export const selectAllWorkOrders = (state: RootState) => {
  return state.workOrders?.workOrders || [];
};
export const selectWorkOrdersLoading = (state: RootState) =>
  state.workOrders?.loading || false;
export const selectWorkOrdersError = (state: RootState) =>
  state.workOrders?.error || null;

export default workOrderSlice.reducer;
