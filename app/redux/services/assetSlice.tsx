import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { Asset, AssetState } from "../../types";

// Mock data - in a real app, this would come from an API
const mockAssets: Asset[] = [
  {
    id: "DDG-51-001",
    name: "USS Arleigh Burke",
    type: "Destroyer",
    class: "Arleigh Burke",
    status: "Operational",
    location: "Norfolk, VA",
    lastMaintenance: "2024-01-15",
    nextMaintenance: "2024-04-15",
    operationalHours: 2847,
    readinessScore: 92,
    criticalIssues: 0,
    maintenanceCost: 1250000,
    fuelEfficiency: 85,
    systems: [
      { name: "Propulsion", status: "operational", lastCheck: "2024-01-10" },
      { name: "Navigation", status: "operational", lastCheck: "2024-01-12" },
      {
        name: "Combat Systems",
        status: "operational",
        lastCheck: "2024-01-08",
      },
      { name: "Communications", status: "degraded", lastCheck: "2024-01-05" },
    ],
  },
  {
    id: "CVN-78-001",
    name: "USS Gerald R. Ford",
    type: "Aircraft Carrier",
    class: "Gerald R. Ford",
    status: "Maintenance",
    location: "Newport News, VA",
    lastMaintenance: "2024-01-20",
    nextMaintenance: "2024-02-20",
    operationalHours: 1256,
    readinessScore: 78,
    criticalIssues: 2,
    maintenanceCost: 2500000,
    fuelEfficiency: 72,
    systems: [
      {
        name: "Nuclear Reactor",
        status: "operational",
        lastCheck: "2024-01-18",
      },
      { name: "Flight Deck", status: "degraded", lastCheck: "2024-01-15" },
      { name: "Catapult System", status: "critical", lastCheck: "2024-01-12" },
      { name: "Radar Systems", status: "operational", lastCheck: "2024-01-16" },
    ],
  },
  {
    id: "SSN-774-001",
    name: "USS Virginia",
    type: "Submarine",
    class: "Virginia",
    status: "Operational",
    location: "Groton, CT",
    lastMaintenance: "2024-01-08",
    nextMaintenance: "2024-07-08",
    operationalHours: 3421,
    readinessScore: 96,
    criticalIssues: 0,
    maintenanceCost: 1800000,
    fuelEfficiency: 94,
    systems: [
      {
        name: "Nuclear Reactor",
        status: "operational",
        lastCheck: "2024-01-06",
      },
      { name: "Sonar Array", status: "operational", lastCheck: "2024-01-10" },
      { name: "Propulsion", status: "operational", lastCheck: "2024-01-08" },
      { name: "Life Support", status: "operational", lastCheck: "2024-01-09" },
    ],
  },
  {
    id: "LHD-1-001",
    name: "USS Wasp",
    type: "Amphibious Assault Ship",
    class: "Wasp",
    status: "Deployed",
    location: "Mediterranean Sea",
    lastMaintenance: "2023-12-20",
    nextMaintenance: "2024-03-20",
    operationalHours: 1892,
    readinessScore: 88,
    criticalIssues: 1,
    maintenanceCost: 950000,
    fuelEfficiency: 79,
    systems: [
      { name: "Propulsion", status: "operational", lastCheck: "2023-12-18" },
      { name: "Well Deck", status: "operational", lastCheck: "2023-12-15" },
      { name: "Flight Deck", status: "degraded", lastCheck: "2023-12-12" },
      {
        name: "Medical Facilities",
        status: "operational",
        lastCheck: "2023-12-20",
      },
    ],
  },
];

// Async thunks
export const fetchAssets = createAsyncThunk("assets/fetchAssets", async () => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockAssets;
});

export const updateAsset = createAsyncThunk(
  "assets/updateAsset",
  async (updatedAsset: Asset) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300));
    return updatedAsset;
  },
);

// Initial state
const initialState: AssetState = {
  assets: [],
  loading: false,
  error: null,
  selectedAsset: null,
};

// Slice
const assetSlice = createSlice({
  name: "assets",
  initialState,
  reducers: {
    setSelectedAsset: (state, action: PayloadAction<Asset | null>) => {
      state.selectedAsset = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch assets
      .addCase(fetchAssets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssets.fulfilled, (state, action) => {
        state.loading = false;
        state.assets = action.payload;
      })
      .addCase(fetchAssets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch assets";
      })
      // Update asset
      .addCase(updateAsset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAsset.fulfilled, (state, action) => {
        state.loading = false;
        const updatedAsset = action.payload;
        const index = state.assets.findIndex(
          (asset) => asset.id === updatedAsset.id,
        );
        if (index !== -1) {
          state.assets[index] = updatedAsset;
        }
        // Update selected asset if it's the one being updated
        if (state.selectedAsset?.id === updatedAsset.id) {
          state.selectedAsset = updatedAsset;
        }
      })
      .addCase(updateAsset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update asset";
      });
  },
});

export const { setSelectedAsset, clearError } = assetSlice.actions;
export default assetSlice.reducer;
