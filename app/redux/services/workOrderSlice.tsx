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
  {
    wo: "WO2024001",
    ship: "USS Winston S. Churchill (DDG-81)",
    homeport: "NB Norfolk",
    fm: "Fuel System – Leak",
    gte: "LM2500",
    priority: "Routine",
    status: "Completed",
    eta: 3,
    symptoms: "Minor fuel leak detected at connection point",
    recommendedAction: "Replace fuel line connection and test",
    partsRequired: "Fuel line assembly, connection fittings",
    slaCategory: "Standard",
    createdAt: new Date("2024-01-10T08:00:00Z"),
  },
  {
    wo: "WO2024002",
    ship: "USS Mitscher (DDG-57)",
    homeport: "NB Norfolk",
    fm: "Electrical – Generator",
    gte: "LM2500",
    priority: "Urgent",
    status: "In Progress",
    eta: 4,
    symptoms: "Generator output voltage fluctuating",
    recommendedAction: "Check voltage regulator and connections",
    partsRequired: "Voltage regulator, electrical connectors",
    slaCategory: "Urgent",
    createdAt: new Date("2024-01-12T14:30:00Z"),
  },
  {
    wo: "WO2024003",
    ship: "USS Laboon (DDG-58)",
    homeport: "NB Norfolk",
    fm: "Cooling System – Pump",
    gte: "LM2500",
    priority: "Routine",
    status: "Submitted",
    eta: 6,
    symptoms: "Cooling pump making unusual noise",
    recommendedAction: "Inspect pump bearings and replace if needed",
    partsRequired: "Pump bearings, seals",
    slaCategory: "Standard",
    createdAt: new Date("2024-01-13T09:15:00Z"),
  },
  {
    wo: "WO2024004",
    ship: "USS Russell (DDG-59)",
    homeport: "NB Norfolk",
    fm: "Control System – Actuator",
    gte: "LM2500",
    priority: "Routine",
    status: "Submitted",
    eta: 7,
    symptoms: "Actuator response time degraded",
    recommendedAction: "Calibrate actuator and check hydraulic pressure",
    partsRequired: "Actuator seals, hydraulic fluid",
    slaCategory: "Standard",
    createdAt: new Date("2024-01-14T16:45:00Z"),
  },
  {
    wo: "WO2024005",
    ship: "USS Paul Hamilton (DDG-60)",
    homeport: "NB Norfolk",
    fm: "Exhaust System – Duct",
    gte: "LM2500",
    priority: "Urgent",
    status: "In Progress",
    eta: 3,
    symptoms: "Exhaust duct showing signs of corrosion",
    recommendedAction: "Replace corroded sections and inspect remaining",
    partsRequired: "Exhaust duct sections, mounting hardware",
    slaCategory: "Urgent",
    createdAt: new Date("2024-01-15T11:20:00Z"),
  },
  {
    wo: "WO2024006",
    ship: "USS Ramage (DDG-61)",
    homeport: "NB Norfolk",
    fm: "Lubrication – Filter",
    gte: "LM2500",
    priority: "Routine",
    status: "Completed",
    eta: 2,
    symptoms: "Oil filter bypass indicator activated",
    recommendedAction: "Replace oil filter and check oil quality",
    partsRequired: "Oil filter, oil analysis kit",
    slaCategory: "Standard",
    createdAt: new Date("2024-01-11T13:10:00Z"),
  },
  {
    wo: "WO2024007",
    ship: "USS Fitzgerald (DDG-62)",
    homeport: "NB Norfolk",
    fm: "Starting System – Motor",
    gte: "LM2500",
    priority: "Routine",
    status: "Submitted",
    eta: 5,
    symptoms: "Starting motor slow to engage",
    recommendedAction: "Test motor windings and replace if necessary",
    partsRequired: "Starting motor, electrical connections",
    slaCategory: "Standard",
    createdAt: new Date("2024-01-16T07:30:00Z"),
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
