import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";


const initialState = [
  {
    wo: uuidv4().split("-")[0].toUpperCase(),
    ship: "USS Bainbridge (DDG-96)",
    homeport: "NB Norfolk",
    fm: "Vibration – Hot Section",
    gte: "LM2500",
    priority: "Routine",
    status: "Submitted",
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
