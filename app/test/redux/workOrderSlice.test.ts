import { describe, it, expect } from "vitest";
import workOrderReducer, {
  addWorkOrder,
  deleteWorkOrder,
  updateWorkOrder,
} from "../../redux/services/workOrderSlice";
import type { WorkOrderState } from "../../types";

describe("workOrderSlice", () => {
  const initialState: WorkOrderState = [
    {
      wo: "TEST001",
      ship: "USS Test Ship",
      homeport: "NB Norfolk",
      fm: "Test Failure",
      gte: "LM2500",
      priority: "Routine",
      status: "Submitted",
      eta: 5,
      symptoms: "Test symptoms",
      recommendedAction: "Test action",
      partsRequired: "Test parts",
      slaCategory: "Test SLA",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    {
      wo: "TEST002",
      ship: "USS Another Ship",
      homeport: "NB Norfolk",
      fm: "Another Failure",
      gte: "LM2500",
      priority: "Priority",
      status: "In Progress",
      eta: 3,
      symptoms: "Another symptoms",
      recommendedAction: "Another action",
      partsRequired: "Another parts",
      slaCategory: "Another SLA",
      createdAt: new Date("2024-01-02"),
      updatedAt: new Date("2024-01-02"),
    },
  ];

  describe("addWorkOrder", () => {
    it("adds a new work order to the state", () => {
      const newWorkOrder = {
        ship: "USS New Ship",
        homeport: "NB Norfolk",
        fm: "New Failure",
        gte: "LM2500",
        priority: "CASREP" as const,
        status: "Submitted" as const,
        eta: 1,
        symptoms: "New symptoms",
        recommendedAction: "New action",
        partsRequired: "New parts",
        slaCategory: "New SLA",
      };

      const action = addWorkOrder(newWorkOrder);
      const newState = workOrderReducer(initialState, action);

      expect(newState).toHaveLength(3);
      expect(newState[2]).toMatchObject({
        ...newWorkOrder,
        wo: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("generates a unique work order ID", () => {
      const newWorkOrder = {
        ship: "USS New Ship",
        homeport: "NB Norfolk",
        fm: "New Failure",
        gte: "LM2500",
        priority: "Routine" as const,
        status: "Submitted" as const,
        eta: 1,
      };

      const action = addWorkOrder(newWorkOrder);
      const newState = workOrderReducer(initialState, action);

      expect(newState[2].wo).toBeDefined();
      expect(newState[2].wo).not.toBe("TEST001");
      expect(newState[2].wo).not.toBe("TEST002");
    });

    it("sets createdAt and updatedAt timestamps", () => {
      const newWorkOrder = {
        ship: "USS New Ship",
        homeport: "NB Norfolk",
        fm: "New Failure",
        gte: "LM2500",
        priority: "Routine" as const,
        status: "Submitted" as const,
        eta: 1,
      };

      const action = addWorkOrder(newWorkOrder);
      const newState = workOrderReducer(initialState, action);

      expect(newState[2].createdAt).toBeInstanceOf(Date);
      expect(newState[2].updatedAt).toBeInstanceOf(Date);
      expect(newState[2].createdAt).toEqual(newState[2].updatedAt);
    });
  });

  describe("deleteWorkOrder", () => {
    it("deletes a single work order", () => {
      const action = deleteWorkOrder(["TEST001"]);
      const newState = workOrderReducer(initialState, action);

      expect(newState).toHaveLength(1);
      expect(newState[0].wo).toBe("TEST002");
    });

    it("deletes multiple work orders", () => {
      const action = deleteWorkOrder(["TEST001", "TEST002"]);
      const newState = workOrderReducer(initialState, action);

      expect(newState).toHaveLength(0);
    });

    it("handles deleting non-existent work orders gracefully", () => {
      const action = deleteWorkOrder(["NONEXISTENT"]);
      const newState = workOrderReducer(initialState, action);

      expect(newState).toHaveLength(2);
      expect(newState).toEqual(initialState);
    });

    it("handles deleting some existing and some non-existent work orders", () => {
      const action = deleteWorkOrder(["TEST001", "NONEXISTENT"]);
      const newState = workOrderReducer(initialState, action);

      expect(newState).toHaveLength(1);
      expect(newState[0].wo).toBe("TEST002");
    });
  });

  describe("updateWorkOrder", () => {
    it("updates an existing work order", () => {
      const updates = {
        status: "In Progress" as const,
        eta: 7,
        symptoms: "Updated symptoms",
      };

      const action = updateWorkOrder({ wo: "TEST001", updates });
      const newState = workOrderReducer(initialState, action);

      expect(newState[0]).toMatchObject({
        ...initialState[0],
        ...updates,
        updatedAt: expect.any(Date),
      });
    });

    it("updates multiple fields of a work order", () => {
      const updates = {
        priority: "CASREP" as const,
        status: "Completed" as const,
        eta: 10,
        symptoms: "Critical symptoms",
        recommendedAction: "Emergency action",
        partsRequired: "Critical parts",
        slaCategory: "Critical SLA",
      };

      const action = updateWorkOrder({ wo: "TEST001", updates });
      const newState = workOrderReducer(initialState, action);

      expect(newState[0]).toMatchObject({
        ...initialState[0],
        ...updates,
        updatedAt: expect.any(Date),
      });
    });

    it("preserves unchanged fields when updating", () => {
      const updates = {
        status: "Completed" as const,
      };

      const action = updateWorkOrder({ wo: "TEST001", updates });
      const newState = workOrderReducer(initialState, action);

      expect(newState[0].ship).toBe(initialState[0].ship);
      expect(newState[0].homeport).toBe(initialState[0].homeport);
      expect(newState[0].fm).toBe(initialState[0].fm);
      expect(newState[0].gte).toBe(initialState[0].gte);
      expect(newState[0].priority).toBe(initialState[0].priority);
      expect(newState[0].eta).toBe(initialState[0].eta);
      expect(newState[0].symptoms).toBe(initialState[0].symptoms);
      expect(newState[0].recommendedAction).toBe(
        initialState[0].recommendedAction,
      );
      expect(newState[0].partsRequired).toBe(initialState[0].partsRequired);
      expect(newState[0].slaCategory).toBe(initialState[0].slaCategory);
      expect(newState[0].createdAt).toEqual(initialState[0].createdAt);
    });

    it("updates the updatedAt timestamp", () => {
      const originalUpdatedAt = initialState[0].updatedAt;
      const updates = { status: "In Progress" as const };

      const action = updateWorkOrder({ wo: "TEST001", updates });
      const newState = workOrderReducer(initialState, action);

      expect(newState[0].updatedAt).toBeInstanceOf(Date);
      expect(newState[0].updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("handles updating non-existent work order gracefully", () => {
      const updates = { status: "In Progress" as const };
      const action = updateWorkOrder({ wo: "NONEXISTENT", updates });
      const newState = workOrderReducer(initialState, action);

      expect(newState).toEqual(initialState);
    });

    it("does not affect other work orders when updating", () => {
      const updates = { status: "Completed" as const };
      const action = updateWorkOrder({ wo: "TEST001", updates });
      const newState = workOrderReducer(initialState, action);

      expect(newState[1]).toEqual(initialState[1]);
    });
  });

  describe("initial state", () => {
    it("has the correct initial state structure", () => {
      const state = workOrderReducer(undefined, { type: "unknown" });

      expect(Array.isArray(state)).toBe(true);
      expect(state.length).toBeGreaterThan(0);

      // Check structure of first work order
      const firstWorkOrder = state[0];
      expect(firstWorkOrder).toHaveProperty("wo");
      expect(firstWorkOrder).toHaveProperty("ship");
      expect(firstWorkOrder).toHaveProperty("homeport");
      expect(firstWorkOrder).toHaveProperty("fm");
      expect(firstWorkOrder).toHaveProperty("gte");
      expect(firstWorkOrder).toHaveProperty("priority");
      expect(firstWorkOrder).toHaveProperty("status");
      expect(firstWorkOrder).toHaveProperty("eta");
      expect(firstWorkOrder).toHaveProperty("createdAt");
    });

    it("has work orders with valid priority values", () => {
      const state = workOrderReducer(undefined, { type: "unknown" });

      state.forEach((workOrder) => {
        expect(["Routine", "Priority", "CASREP", "Urgent"]).toContain(
          workOrder.priority,
        );
      });
    });

    it("has work orders with valid status values", () => {
      const state = workOrderReducer(undefined, { type: "unknown" });

      state.forEach((workOrder) => {
        expect([
          "Submitted",
          "In Progress",
          "Completed",
          "Cancelled",
          "On Hold",
        ]).toContain(workOrder.status);
      });
    });

    it("has work orders with positive ETA values", () => {
      const state = workOrderReducer(undefined, { type: "unknown" });

      state.forEach((workOrder) => {
        expect(workOrder.eta).toBeGreaterThan(0);
      });
    });
  });
});
