import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";


const initialState = [
  {
    wo: uuidv4().split("-")[0].toUpperCase(),
    ship: 2,
    homeport: 3,
    fm: 4,
    gte: 5,
    priority: 6,
    status: 7,
    eta: 8,
  },
];

const workOrderSlice = createSlice({
  name: "workOrders",
  initialState,
  reducers: {
    addWorkOrder: (state, action) => {
      const newWorkOrder = {
        wo: uuidv4().split("-")[0].toUpperCase(),
        ship: action.payload.ship,
        homeport: action.payload.homeport,
        fm: action.payload.fm,
        gte: action.payload.gte,
        priority: action.payload.priority,
        status: action.payload.status,
        eta: action.payload.eta,
      };
      state.push(newWorkOrder);
    },
  },
});

export const { addWorkOrder } = workOrderSlice.actions;
export default workOrderSlice.reducer;
