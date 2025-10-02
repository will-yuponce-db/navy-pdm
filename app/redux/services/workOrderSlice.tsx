import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

import type { WorkOrder, WorkOrderState, RootState } from "../../types";
import {
  addNotification,
  createWorkOrderNotifications,
} from "./notificationSlice";
import { selectAllParts, getStockStatus } from "./partsSlice";
import { workOrdersApi, databricksApi } from "../../services/api";
import { 
  mapDatabricksWorkOrdersToWorkOrders,
  type DatabricksAIWorkOrder 
} from "../../utils/databricksMapper";

const initialState: WorkOrderState = {
  workOrders: [],
  loading: false,
  error: null,
};

// Thunk actions for work order operations with notifications
export const fetchWorkOrders = createAsyncThunk(
  "workOrders/fetchWorkOrders",
  async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
  }) => {
    const response = await workOrdersApi.getAll(params);
    return response.items;
  },
);

// Fetch AI Work Orders from Databricks
export const fetchAIWorkOrdersFromDatabricks = createAsyncThunk(
  "workOrders/fetchAIWorkOrdersFromDatabricks",
  async (params?: {
    limit?: number;
    offset?: number;
    priority?: string;
    homeLocation?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await databricksApi.getAIWorkOrders(params);
      if (!response.success) {
        throw new Error(response.diagnostics?.error || 'Failed to fetch AI work orders');
      }
      // Map Databricks data to WorkOrder format
      const mappedWorkOrders = mapDatabricksWorkOrdersToWorkOrders(
        response.data as DatabricksAIWorkOrder[]
      );
      return mappedWorkOrders;
    } catch (error) {
      console.error('Error fetching AI work orders from Databricks:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error fetching AI work orders'
      );
    }
  },
);

// Fetch all work orders (both manual and AI from Databricks)
export const fetchAllWorkOrders = createAsyncThunk(
  "workOrders/fetchAllWorkOrders",
  async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
  }, { dispatch }) => {
    try {
      // Fetch manual work orders from local API
      const manualResponse = await workOrdersApi.getAll(params);
      const manualWorkOrders = manualResponse.items;
      
      // Fetch AI work orders from Databricks
      let aiWorkOrders: WorkOrder[] = [];
      try {
        const aiResponse = await databricksApi.getAIWorkOrders({
          limit: params?.limit,
          priority: params?.priority,
        });
        
        if (aiResponse.success) {
          aiWorkOrders = mapDatabricksWorkOrdersToWorkOrders(
            aiResponse.data as DatabricksAIWorkOrder[]
          );
        }
      } catch (aiError) {
        console.warn('Failed to fetch AI work orders from Databricks, continuing with manual work orders only:', aiError);
        // Notify user about AI work orders fetch failure
        dispatch(
          addNotification({
            type: 'warning',
            title: 'Databricks Connection Issue',
            message: 'Unable to fetch AI work orders from Databricks. Showing manual work orders only.',
            priority: 'medium',
            category: 'system',
          })
        );
      }
      
      // Combine and return both
      return [...manualWorkOrders, ...aiWorkOrders];
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch work orders'
      );
    }
  },
);

export const addWorkOrderWithNotification = createAsyncThunk(
  "workOrders/addWithNotification",
  async (
    workOrderData: Omit<WorkOrder, "wo" | "createdAt" | "updatedAt">,
    { dispatch, getState },
  ) => {
    const state = getState() as RootState;
    const parts = selectAllParts(state);

    // Manual work orders always have "Submitted" status
    const newWorkOrder = await workOrdersApi.create({
      ...workOrderData,
      status: "Submitted",
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
    if (newWorkOrder.partsRequired && newWorkOrder.partsRequired.trim()) {
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

export const addAIWorkOrderWithNotification = createAsyncThunk(
  "workOrders/addAIWithNotification",
  async (
    workOrderData: Omit<WorkOrder, "wo" | "createdAt" | "updatedAt">,
    { dispatch, getState },
  ) => {
    const state = getState() as RootState;
    const parts = selectAllParts(state);

    // AI work orders always have "Pending approval" status
    const newWorkOrder = await workOrdersApi.createAI({
      ...workOrderData,
      status: "Pending approval",
      creationSource: "ai",
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
    if (newWorkOrder.partsRequired && newWorkOrder.partsRequired.trim()) {
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
            message: `AI work order ${newWorkOrder.wo} requires parts that are low in stock: ${unavailableParts.map((p) => p.name).join(", ")}`,
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
    await Promise.all(workOrderIds.map((id) => workOrdersApi.delete(id)));

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
      // Fetch AI work orders from Databricks
      .addCase(fetchAIWorkOrdersFromDatabricks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAIWorkOrdersFromDatabricks.fulfilled, (state, action) => {
        state.loading = false;
        // Merge AI work orders with existing work orders, avoiding duplicates
        const existingWOs = new Set(state.workOrders.map(wo => wo.wo));
        const newAIWorkOrders = action.payload.filter(wo => !existingWOs.has(wo.wo));
        state.workOrders = [...state.workOrders, ...newAIWorkOrders];
      })
      .addCase(fetchAIWorkOrdersFromDatabricks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to fetch AI work orders from Databricks";
      })
      // Fetch all work orders (manual + AI)
      .addCase(fetchAllWorkOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllWorkOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.workOrders = [...action.payload];
      })
      .addCase(fetchAllWorkOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch all work orders";
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
      // Add AI work order
      .addCase(addAIWorkOrderWithNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAIWorkOrderWithNotification.fulfilled, (state, action) => {
        state.loading = false;
        state.workOrders.push(action.payload);
      })
      .addCase(addAIWorkOrderWithNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to add AI work order";
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

export const {
  addWorkOrder,
  deleteWorkOrder,
  updateWorkOrder,
  setLoading,
  setError,
} = workOrderSlice.actions;

// Selectors
export const selectAllWorkOrders = (state: RootState) => {
  return state.workOrders?.workOrders || [];
};
export const selectWorkOrdersLoading = (state: RootState) =>
  state.workOrders?.loading || false;
export const selectWorkOrdersError = (state: RootState) =>
  state.workOrders?.error || null;

export default workOrderSlice.reducer;
