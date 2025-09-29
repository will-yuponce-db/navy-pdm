import type { PWAConfig } from '../types';

// Service Worker registration and management
export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported = 'serviceWorker' in navigator;

  async register(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Service Worker not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully');

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.showUpdateNotification();
            }
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      await this.registration.unregister();
      this.registration = null;
      return true;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  async update(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
    } catch (error) {
      console.error('Service Worker update failed:', error);
    }
  }

  private showUpdateNotification(): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('App Update Available', {
        body: 'A new version of the app is available. Click to update.',
        icon: '/favicon.ico',
        tag: 'app-update',
      }).onclick = () => {
        window.location.reload();
      };
    }
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  isServiceWorkerSupported(): boolean {
    return this.isSupported;
  }
}

// Offline data management
export class OfflineDataManager {
  private dbName = 'NavyPDMOfflineDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('workOrders')) {
          db.createObjectStore('workOrders', { keyPath: 'wo' });
        }
        if (!db.objectStoreNames.contains('parts')) {
          db.createObjectStore('parts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('notifications')) {
          db.createObjectStore('notifications', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pendingChanges')) {
          db.createObjectStore('pendingChanges', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async storeWorkOrders(workOrders: unknown[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['workOrders'], 'readwrite');
    const store = transaction.objectStore('workOrders');

    for (const workOrder of workOrders) {
      await this.promisifyRequest(store.put(workOrder));
    }
  }

  async getWorkOrders(): Promise<unknown[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['workOrders'], 'readonly');
    const store = transaction.objectStore('workOrders');
    const request = store.getAll();

    return this.promisifyRequest(request);
  }

  async storeParts(parts: unknown[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['parts'], 'readwrite');
    const store = transaction.objectStore('parts');

    for (const part of parts) {
      await this.promisifyRequest(store.put(part));
    }
  }

  async getParts(): Promise<unknown[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['parts'], 'readonly');
    const store = transaction.objectStore('parts');
    const request = store.getAll();

    return this.promisifyRequest(request);
  }

  async addPendingChange(change: unknown): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['pendingChanges'], 'readwrite');
    const store = transaction.objectStore('pendingChanges');

    await this.promisifyRequest(store.add({
      ...(change as Record<string, unknown>),
      timestamp: new Date(),
    }));
  }

  async getPendingChanges(): Promise<unknown[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['pendingChanges'], 'readonly');
    const store = transaction.objectStore('pendingChanges');
    const request = store.getAll();

    return this.promisifyRequest(request);
  }

  async clearPendingChanges(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['pendingChanges'], 'readwrite');
    const store = transaction.objectStore('pendingChanges');

    await this.promisifyRequest(store.clear());
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Network status monitoring
export class NetworkManager {
  private isOnline = navigator.onLine;
  private listeners: Array<(isOnline: boolean) => void> = [];

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners(false);
    });
  }

  addListener(listener: (isOnline: boolean) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (isOnline: boolean) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach(listener => listener(isOnline));
  }

  isConnected(): boolean {
    return this.isOnline;
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Background sync
export class BackgroundSyncManager {
  private offlineDataManager: OfflineDataManager;

  constructor(offlineDataManager: OfflineDataManager) {
    this.offlineDataManager = offlineDataManager;
  }

  async registerBackgroundSync(tag: string): Promise<void> {
    if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.warn('Background Sync not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      if ('sync' in registration) {
        await (registration as { sync: { register: (tag: string) => Promise<void> } }).sync.register(tag);
      }
    } catch (error) {
      console.error('Background Sync registration failed:', error);
    }
  }

  async syncPendingChanges(): Promise<void> {
    const pendingChanges = await this.offlineDataManager.getPendingChanges();
    
    for (const change of pendingChanges) {
      try {
        await this.syncChange(change as { type: string; data: unknown; id: string });
        // Remove successfully synced change
        await this.removePendingChange((change as { id: string }).id);
      } catch (error) {
        console.error('Failed to sync change:', error);
      }
    }
  }

  private async syncChange(_change: { type: string; data: unknown; id: string }): Promise<void> {
    // This would integrate with your API service
    // Example implementation:
    /*
    switch (_change.type) {
      case 'create':
        await workOrdersApi.create(_change.data);
        break;
      case 'update':
        await workOrdersApi.update(_change.id, _change.data);
        break;
      case 'delete':
        await workOrdersApi.delete(_change.id);
        break;
    }
    */
    console.log('Syncing change:', _change.type);
  }

  private async removePendingChange(_id: string): Promise<void> {
    // Implementation to remove pending change from IndexedDB
    // TODO: Implement IndexedDB removal logic
    console.log('Removing pending change:', _id);
  }
}

// Push notification manager
export class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null;

  async initialize(): Promise<void> {
    this.registration = await navigator.serviceWorker.ready;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    return await Notification.requestPermission();
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('Service Worker not ready');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
        ) as unknown as ArrayBuffer,
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer(subscription);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Push unsubscription failed:', error);
      return false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/push-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/push-subscriptions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }
}

// PWA installation manager
export class PWAInstallManager {
  private deferredPrompt: unknown = null;
  private isInstalled = false;

  constructor() {
    this.setupInstallPrompt();
    this.checkInstallationStatus();
  }

  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
    });
  }

  private checkInstallationStatus(): void {
    // Check if app is running in standalone mode
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as { standalone?: boolean }).standalone === true;
  }

  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      (this.deferredPrompt as { prompt: () => void; userChoice: Promise<{ outcome: string }> }).prompt();
      const { outcome } = await (this.deferredPrompt as { userChoice: Promise<{ outcome: string }> }).userChoice;
      this.deferredPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  canInstall(): boolean {
    return !!this.deferredPrompt && !this.isInstalled;
  }

  isAppInstalled(): boolean {
    return this.isInstalled;
  }
}

// PWA configuration
export const PWA_CONFIG: PWAConfig = {
  name: 'Navy Predictive Maintenance',
  shortName: 'Navy PDM',
  description: 'Comprehensive predictive maintenance system for Navy fleet management',
  themeColor: '#FF3621',
  backgroundColor: '#1B3139',
  display: 'standalone',
  orientation: 'any',
  startUrl: '/',
  icons: [
    {
      src: '/icons/icon-72x72.png',
      sizes: '72x72',
      type: 'image/png',
    },
    {
      src: '/icons/icon-96x96.png',
      sizes: '96x96',
      type: 'image/png',
    },
    {
      src: '/icons/icon-128x128.png',
      sizes: '128x128',
      type: 'image/png',
    },
    {
      src: '/icons/icon-144x144.png',
      sizes: '144x144',
      type: 'image/png',
    },
    {
      src: '/icons/icon-152x152.png',
      sizes: '152x152',
      type: 'image/png',
    },
    {
      src: '/icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: '/icons/icon-384x384.png',
      sizes: '384x384',
      type: 'image/png',
    },
    {
      src: '/icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
    },
  ],
};

// Create singleton instances
export const serviceWorkerManager = new ServiceWorkerManager();
export const offlineDataManager = new OfflineDataManager();
export const networkManager = new NetworkManager();
export const pushNotificationManager = new PushNotificationManager();
export const pwaInstallManager = new PWAInstallManager();

// Initialize PWA features
export const initializePWA = async (): Promise<void> => {
  try {
    // Initialize offline data manager
    await offlineDataManager.initialize();

    // Register service worker
    await serviceWorkerManager.register();

    // Initialize push notifications
    await pushNotificationManager.initialize();

    // Set up background sync
    const backgroundSyncManager = new BackgroundSyncManager(offlineDataManager);
    
    // Register background sync for pending changes
    await backgroundSyncManager.registerBackgroundSync('sync-pending-changes');

    console.log('PWA features initialized successfully');
  } catch (error) {
    console.error('Failed to initialize PWA features:', error);
  }
};
