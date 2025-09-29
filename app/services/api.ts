import type { WorkOrder, Part, Notification, User, PaginatedResponse } from '../types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const API_TIMEOUT = 10000;

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request interceptor for authentication
const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Generic API request function with error handling
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408);
    }
    
    throw new ApiError('Network error', 0);
  }
};

// Authentication API
export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<{ user: User; token: string }> => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  logout: async (): Promise<void> => {
    return apiRequest('/auth/logout', { method: 'POST' });
  },

  refreshToken: async (): Promise<{ token: string }> => {
    return apiRequest('/auth/refresh', { method: 'POST' });
  },

  getCurrentUser: async (): Promise<User> => {
    return apiRequest('/auth/me');
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    return apiRequest('/auth/change-password', {
      method: 'POST',
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
    sortOrder?: 'asc' | 'desc';
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
    return apiRequest(`/work-orders${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id: string): Promise<WorkOrder> => {
    return apiRequest(`/work-orders/${id}`);
  },

  create: async (workOrder: Omit<WorkOrder, 'wo' | 'createdAt' | 'updatedAt'>): Promise<WorkOrder> => {
    return apiRequest('/work-orders', {
      method: 'POST',
      body: JSON.stringify(workOrder),
    });
  },

  update: async (id: string, updates: Partial<WorkOrder>): Promise<WorkOrder> => {
    return apiRequest(`/work-orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiRequest(`/work-orders/${id}`, { method: 'DELETE' });
  },

  bulkUpdate: async (updates: { id: string; updates: Partial<WorkOrder> }[]): Promise<WorkOrder[]> => {
    return apiRequest('/work-orders/bulk', {
      method: 'PATCH',
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
    const response = await fetch(`${API_BASE_URL}/work-orders/export${queryString ? `?${queryString}` : ''}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new ApiError('Export failed', response.status);
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
    return apiRequest(`/parts${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id: string): Promise<Part> => {
    return apiRequest(`/parts/${id}`);
  },

  create: async (part: Omit<Part, 'id' | 'lastUpdated'>): Promise<Part> => {
    return apiRequest('/parts', {
      method: 'POST',
      body: JSON.stringify(part),
    });
  },

  update: async (id: string, updates: Partial<Part>): Promise<Part> => {
    return apiRequest(`/parts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiRequest(`/parts/${id}`, { method: 'DELETE' });
  },

  updateStock: async (id: string, quantity: number, operation: 'add' | 'subtract'): Promise<Part> => {
    return apiRequest(`/parts/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity, operation }),
    });
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    priority?: string;
    read?: boolean;
  }): Promise<PaginatedResponse<Notification>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString();
    return apiRequest(`/notifications${queryString ? `?${queryString}` : ''}`);
  },

  markAsRead: async (id: string): Promise<Notification> => {
    return apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
  },

  markAllAsRead: async (): Promise<void> => {
    return apiRequest('/notifications/read-all', { method: 'PATCH' });
  },

  delete: async (id: string): Promise<void> => {
    return apiRequest(`/notifications/${id}`, { method: 'DELETE' });
  },
};

// Analytics API
export const analyticsApi = {
  getMaintenanceKPIs: async (): Promise<{
    gtesNeedingMaintenance: number;
    gtesOperational: number;
    casrepGtes: number;
    trends: Record<string, 'up' | 'down' | 'stable'>;
  }> => {
    return apiRequest('/analytics/maintenance-kpis');
  },

  getPerformanceMetrics: async (timeRange?: '7d' | '30d' | '90d'): Promise<{
    efficiency: number;
    downtime: number;
    readiness: number;
    maintenance: number;
  }> => {
    const queryString = timeRange ? `?timeRange=${timeRange}` : '';
    return apiRequest(`/analytics/performance${queryString}`);
  },

  getFleetReadiness: async (): Promise<{
    overallReadiness: number;
    byHomeport: Record<string, number>;
    byShipClass: Record<string, number>;
  }> => {
    return apiRequest('/analytics/fleet-readiness');
  },

  getPredictiveInsights: async (): Promise<{
    predictedFailures: Array<{
      ship: string;
      gte: string;
      probability: number;
      estimatedDays: number;
    }>;
    maintenanceRecommendations: Array<{
      ship: string;
      gte: string;
      recommendation: string;
      priority: 'low' | 'medium' | 'high';
    }>;
  }> => {
    return apiRequest('/analytics/predictive-insights');
  },
};

// Real-time WebSocket connection
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(onMessage: (data: unknown) => void, onError?: (error: Event) => void): void {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:3001'}/ws?token=${token}`;
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect(onMessage, onError);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError?.(error);
    };
  }

  private attemptReconnect(onMessage: (data: unknown) => void, onError?: (error: Event) => void): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(onMessage, onError);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

export const wsService = new WebSocketService();
