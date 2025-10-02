import type { WorkOrder, Part, User, PaginatedResponse } from "../types";

// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? typeof window !== "undefined"
      ? `${window.location.origin}/api`
      : "/api"
    : "http://localhost:8000/api");
const API_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Request headers
const getHeaders = (): HeadersInit => {
  return {
    "Content-Type": "application/json",
  };
};

// Retry utility function
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Generic API request function with error handling and retry logic
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0,
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new ApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code,
      );

      // Retry on server errors (5xx) and specific client errors
      if (
        retryCount < MAX_RETRIES &&
        (response.status >= 500 ||
          response.status === 429 ||
          response.status === 408)
      ) {
        await delay(RETRY_DELAY * Math.pow(2, retryCount));
        return apiRequest<T>(endpoint, options, retryCount + 1);
      }

      throw error;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timeout", 408);
    }

    // Retry on network errors
    if (retryCount < MAX_RETRIES) {
      await delay(RETRY_DELAY * Math.pow(2, retryCount));
      return apiRequest<T>(endpoint, options, retryCount + 1);
    }

    throw new ApiError("Network error", 0);
  }
};

// Authentication API
export const authApi = {
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<{ user: User; token: string }> => {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  logout: async (): Promise<void> => {
    return apiRequest("/auth/logout", { method: "POST" });
  },

  refreshToken: async (): Promise<{ token: string }> => {
    return apiRequest("/auth/refresh", { method: "POST" });
  },

  getCurrentUser: async (): Promise<User> => {
    return apiRequest("/auth/me");
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    return apiRequest("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Work Orders API
export const workOrdersApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<PaginatedResponse<WorkOrder>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    return apiRequest(`/work-orders${queryString ? `?${queryString}` : ""}`);
  },

  getById: async (id: string): Promise<WorkOrder> => {
    return apiRequest(`/work-orders/${id}`);
  },

  create: async (
    workOrder: Omit<WorkOrder, "wo" | "createdAt" | "updatedAt">,
  ): Promise<WorkOrder> => {
    return apiRequest("/work-orders", {
      method: "POST",
      body: JSON.stringify(workOrder),
    });
  },

  createAI: async (
    workOrder: Omit<WorkOrder, "wo" | "createdAt" | "updatedAt">,
  ): Promise<WorkOrder> => {
    return apiRequest("/work-orders/ai", {
      method: "POST",
      body: JSON.stringify(workOrder),
    });
  },

  update: async (
    id: string,
    updates: Partial<WorkOrder>,
  ): Promise<WorkOrder> => {
    return apiRequest(`/work-orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiRequest(`/work-orders/${id}`, { method: "DELETE" });
  },

  bulkUpdate: async (
    updates: { id: string; updates: Partial<WorkOrder> }[],
  ): Promise<WorkOrder[]> => {
    return apiRequest("/work-orders/bulk", {
      method: "PATCH",
      body: JSON.stringify({ updates }),
    });
  },

  export: async (filters?: Record<string, unknown>): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const response = await fetch(
      `${API_BASE_URL}/work-orders/export${queryString ? `?${queryString}` : ""}`,
      {
        headers: getHeaders(),
      },
    );

    if (!response.ok) {
      throw new ApiError("Export failed", response.status);
    }

    return response.blob();
  },
};

// Parts API
export const partsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    condition?: string;
    stockStatus?: string;
    search?: string;
  }): Promise<PaginatedResponse<Part>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    return apiRequest(`/parts${queryString ? `?${queryString}` : ""}`);
  },

  getById: async (id: string): Promise<Part> => {
    return apiRequest(`/parts/${id}`);
  },

  create: async (part: Omit<Part, "id" | "lastUpdated">): Promise<Part> => {
    return apiRequest("/parts", {
      method: "POST",
      body: JSON.stringify(part),
    });
  },

  update: async (id: string, updates: Partial<Part>): Promise<Part> => {
    return apiRequest(`/parts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiRequest(`/parts/${id}`, { method: "DELETE" });
  },

  updateStock: async (
    id: string,
    quantity: number,
    operation: "add" | "subtract",
  ): Promise<Part> => {
    return apiRequest(`/parts/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ quantity, operation }),
    });
  },
};

// Enhanced Databricks SQL API with better error handling
export const databricksApi = {
  health: async (): Promise<{ 
    status: string; 
    timestamp: string; 
    details?: Record<string, unknown>;
    diagnostics?: Record<string, unknown>;
    recommendations?: string[];
  }> => {
    return apiRequest("/databricks/health");
  },

  test: async (): Promise<{ 
    success: boolean; 
    message: string; 
    data?: unknown;
    diagnostics?: Record<string, unknown>;
  }> => {
    return apiRequest("/databricks/test");
  },

  query: async (query: string, options?: Record<string, unknown>): Promise<{ 
    success: boolean; 
    data: unknown[]; 
    rowCount: number;
    diagnostics?: Record<string, unknown>;
    recommendations?: string[];
  }> => {
    return apiRequest("/databricks/query", {
      method: "POST",
      body: JSON.stringify({ query, options }),
    });
  },

  getWarehouses: async (): Promise<{ success: boolean; data: unknown[] }> => {
    return apiRequest("/databricks/warehouses");
  },

  getDatabases: async (): Promise<{ success: boolean; data: unknown[] }> => {
    return apiRequest("/databricks/databases");
  },

  getTables: async (databaseName: string): Promise<{ success: boolean; data: unknown[]; database: string }> => {
    return apiRequest(`/databricks/databases/${encodeURIComponent(databaseName)}/tables`);
  },

  getParts: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    condition?: string;
    search?: string;
  }): Promise<PaginatedResponse<Part> & { 
    diagnostics?: Record<string, unknown>;
    fallback?: boolean;
    recommendations?: string[];
  }> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    return apiRequest(`/databricks/parts${queryString ? `?${queryString}` : ""}`);
  },

  getAIWorkOrders: async (params?: {
    limit?: number;
    offset?: number;
    priority?: string;
    homeLocation?: string;
  }): Promise<{ 
    success: boolean; 
    data: unknown[];
    total: number;
    diagnostics?: Record<string, unknown>;
  }> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    return apiRequest(`/databricks/ai-work-orders${queryString ? `?${queryString}` : ""}`);
  },

  getAIWorkOrderById: async (workOrderId: string): Promise<{ 
    success: boolean; 
    data: unknown;
    diagnostics?: Record<string, unknown>;
  }> => {
    return apiRequest(`/databricks/ai-work-orders/${encodeURIComponent(workOrderId)}`);
  },
};
