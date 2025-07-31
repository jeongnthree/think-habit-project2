import { useCallback, useEffect, useState } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

export interface UseNetworkStatusOptions {
  onOnline?: () => void;
  onOffline?: () => void;
  onSlowConnection?: () => void;
  slowConnectionThreshold?: number; // in Mbps
}

export function useNetworkStatus(options: UseNetworkStatusOptions = {}) {
  const {
    onOnline,
    onOffline,
    onSlowConnection,
    slowConnectionThreshold = 1, // 1 Mbps
  } = options;

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => {
    if (typeof window === 'undefined') {
      return {
        isOnline: true,
        isSlowConnection: false,
        connectionType: 'unknown',
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
      };
    }

    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    return {
      isOnline: navigator.onLine,
      isSlowConnection: connection
        ? connection.downlink < slowConnectionThreshold
        : false,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
    };
  });

  const updateNetworkStatus = useCallback(() => {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    const newStatus: NetworkStatus = {
      isOnline: navigator.onLine,
      isSlowConnection: connection
        ? connection.downlink < slowConnectionThreshold
        : false,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
    };

    setNetworkStatus(prevStatus => {
      // Trigger callbacks for status changes
      if (prevStatus.isOnline !== newStatus.isOnline) {
        if (newStatus.isOnline && onOnline) {
          onOnline();
        } else if (!newStatus.isOnline && onOffline) {
          onOffline();
        }
      }

      if (
        !prevStatus.isSlowConnection &&
        newStatus.isSlowConnection &&
        onSlowConnection
      ) {
        onSlowConnection();
      }

      return newStatus;
    });
  }, [slowConnectionThreshold, onOnline, onOffline, onSlowConnection]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Update status on mount
    updateNetworkStatus();

    // Listen for online/offline events
    const handleOnline = () => updateNetworkStatus();
    const handleOffline = () => updateNetworkStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, [updateNetworkStatus]);

  // Test network connectivity
  const testConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  // Get connection quality description
  const getConnectionQuality = useCallback((): string => {
    if (!networkStatus.isOnline) {
      return '오프라인';
    }

    if (networkStatus.isSlowConnection) {
      return '느린 연결';
    }

    switch (networkStatus.effectiveType) {
      case 'slow-2g':
        return '매우 느림';
      case '2g':
        return '느림';
      case '3g':
        return '보통';
      case '4g':
        return '빠름';
      default:
        return '알 수 없음';
    }
  }, [networkStatus]);

  // Get recommended behavior based on connection
  const getRecommendedBehavior = useCallback(() => {
    if (!networkStatus.isOnline) {
      return {
        allowUploads: false,
        allowAutoSave: false,
        showOfflineMessage: true,
        reduceImageQuality: true,
      };
    }

    if (networkStatus.isSlowConnection) {
      return {
        allowUploads: true,
        allowAutoSave: false,
        showOfflineMessage: false,
        reduceImageQuality: true,
      };
    }

    return {
      allowUploads: true,
      allowAutoSave: true,
      showOfflineMessage: false,
      reduceImageQuality: false,
    };
  }, [networkStatus]);

  return {
    networkStatus,
    isOnline: networkStatus.isOnline,
    isSlowConnection: networkStatus.isSlowConnection,
    connectionType: networkStatus.connectionType,
    effectiveType: networkStatus.effectiveType,
    downlink: networkStatus.downlink,
    rtt: networkStatus.rtt,
    testConnectivity,
    getConnectionQuality,
    getRecommendedBehavior,
    updateNetworkStatus,
  };
}

// Hook for handling offline storage
export function useOfflineStorage<T>(key: string, defaultValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(defaultValue);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return [storedValue, setValue, removeValue] as const;
}

// Hook for managing offline queue
export function useOfflineQueue<T>(queueKey: string) {
  const [queue, setQueue, clearQueue] = useOfflineStorage<T[]>(queueKey, []);
  const { isOnline } = useNetworkStatus();

  const addToQueue = useCallback(
    (item: T) => {
      setQueue(prevQueue => [...prevQueue, item]);
    },
    [setQueue]
  );

  const removeFromQueue = useCallback(
    (index: number) => {
      setQueue(prevQueue => prevQueue.filter((_, i) => i !== index));
    },
    [setQueue]
  );

  const processQueue = useCallback(
    async (processor: (item: T) => Promise<boolean>) => {
      if (!isOnline || queue.length === 0) {
        return;
      }

      const processedIndices: number[] = [];

      for (let i = 0; i < queue.length; i++) {
        try {
          const success = await processor(queue[i]!);
          if (success) {
            processedIndices.push(i);
          }
        } catch (error) {
          console.warn('Error processing queue item:', error);
          // Continue processing other items
        }
      }

      // Remove successfully processed items (in reverse order to maintain indices)
      processedIndices.reverse().forEach(index => {
        removeFromQueue(index);
      });
    },
    [isOnline, queue, removeFromQueue]
  );

  return {
    queue,
    queueLength: queue.length,
    addToQueue,
    removeFromQueue,
    processQueue,
    clearQueue,
  };
}
