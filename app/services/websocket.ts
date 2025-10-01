import { io, Socket } from 'socket.io-client';
import type { Notification } from '../types';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const serverUrl = import.meta.env.PROD 
      ? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
      : 'http://localhost:3000';

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Notification event handlers
  onNotificationNew(callback: (notification: Notification) => void): void {
    if (this.socket) {
      this.socket.on('notification:new', callback);
    }
  }

  onNotificationRead(callback: (data: { notificationId: string }) => void): void {
    if (this.socket) {
      this.socket.on('notification:read', callback);
    }
  }

  onNotificationDismissed(callback: (data: { notificationId: string }) => void): void {
    if (this.socket) {
      this.socket.on('notification:dismissed', callback);
    }
  }

  onNotificationsAllRead(callback: () => void): void {
    if (this.socket) {
      this.socket.on('notifications:all-read', callback);
    }
  }

  // Emit events
  markNotificationAsRead(notificationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('notification:read', { notificationId });
    }
  }

  dismissNotification(notificationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('notification:dismiss', { notificationId });
    }
  }

  // Remove event listeners
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  removeNotificationListeners(): void {
    if (this.socket) {
      this.socket.off('notification:new');
      this.socket.off('notification:read');
      this.socket.off('notification:dismissed');
      this.socket.off('notifications:all-read');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();

// Export the class for testing
export { WebSocketService };
