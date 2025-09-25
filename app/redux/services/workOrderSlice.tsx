import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import type { WorkOrder, WorkOrderState } from "../../types";
import {
  addNotification,
  createWorkOrderNotifications,
} from "./notificationSlice";
import { selectAllParts, getStockStatus } from "./partsSlice";
import type { RootState } from "../../types";

const initialState: WorkOrderState = [
  {
    wo: "ED569313", // Fixed ID for SSR consistency
    ship: "USS Bainbridge (DDG-96)",
    homeport: "NB Norfolk",
    fm: "Vibration – Hot Section",
    gte: "LM2500",
    priority: "Routine",
    status: "Submitted",
    eta: 8,
    symptoms: "Excessive vibration detected during operation",
    recommendedAction: "Inspect hot section components for wear",
    partsRequired: "Turbine blade set, gaskets",
    slaCategory: "Priority",
    createdAt: new Date("2024-01-15T10:00:00Z"),
  },
  {
    wo: "39A8CA7E", // Fixed ID for SSR consistency
    ship: "USS Arleigh Burke (DDG-51)",
    homeport: "NB Norfolk",
    fm: "Oil Pressure – Low",
    gte: "LM2500",
    priority: "Urgent",
    status: "In Progress",
    eta: 5,
    symptoms: "Oil pressure dropping below normal operating range",
    recommendedAction: "Replace main oil pump and check filter",
    partsRequired: "Oil pump assembly, oil filter",
    slaCategory: "Urgent",
    createdAt: new Date("2024-01-14T10:00:00Z"), // 1 day ago
  },
  {
    wo: "CASREP001", // Fixed ID for SSR consistency
    ship: "USS Cole (DDG-67)",
    homeport: "NB Norfolk",
    fm: "Temperature – High EGT",
    gte: "LM2500",
    priority: "CASREP",
    status: "Submitted",
    eta: 2,
    symptoms: "Exhaust gas temperature exceeding limits",
    recommendedAction: "Emergency shutdown and immediate inspection",
    partsRequired: "Temperature sensors, combustor parts",
    slaCategory: "Critical",
    createdAt: new Date("2024-01-15T13:00:00Z"), // 1 hour ago
  },
];

// Thunk actions for work order operations with notifications
export const addWorkOrderWithNotification = createAsyncThunk(
  "workOrders/addWithNotification",
  async (
    workOrderData: Omit<WorkOrder, "wo" | "createdAt" | "updatedAt">,
    { dispatch, getState },
  ) => {
    const state = getState() as RootState;
    const parts = selectAllParts(state);

    const newWorkOrder: WorkOrder = {
      wo: uuidv4().split("-")[0].toUpperCase(),
      ...workOrderData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

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
    const workOrder = state.workOrders.find((w) => w.wo === wo);

    if (!workOrder) {
      throw new Error(`Work order ${wo} not found`);
    }

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

    return { wo, updates };
  },
);

export const deleteWorkOrderWithNotification = createAsyncThunk(
  "workOrders/deleteWithNotification",
  async (workOrderIds: string[], { dispatch }) => {
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
      state.push(newWorkOrder);
    },
    deleteWorkOrder: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach((wo) => {
        const index = state.findIndex((elem) => elem.wo === wo);
        if (index !== -1) {
          state.splice(index, 1);
        }
      });
    },
    updateWorkOrder: (
      state,
      action: PayloadAction<{ wo: string; updates: Partial<WorkOrder> }>,
    ) => {
      const { wo, updates } = action.payload;
      const index = state.findIndex((elem) => elem.wo === wo);
      if (index !== -1) {
        state[index] = {
          ...state[index],
          ...updates,
          updatedAt: new Date(),
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addWorkOrderWithNotification.fulfilled, (state, action) => {
        state.push(action.payload);
      })
      .addCase(updateWorkOrderWithNotification.fulfilled, (state, action) => {
        const { wo, updates } = action.payload;
        const index = state.findIndex((elem) => elem.wo === wo);
        if (index !== -1) {
        state[index] = {
          ...state[index],
          ...updates,
          updatedAt: new Date(),
        };
        }
      })
      .addCase(deleteWorkOrderWithNotification.fulfilled, (state, action) => {
        action.payload.forEach((wo) => {
          const index = state.findIndex((elem) => elem.wo === wo);
          if (index !== -1) {
            state.splice(index, 1);
          }
        });
      });
  },
});

export const { addWorkOrder, deleteWorkOrder, updateWorkOrder } =
  workOrderSlice.actions;
export default workOrderSlice.reducer;
