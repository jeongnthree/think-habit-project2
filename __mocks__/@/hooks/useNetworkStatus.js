// Mock for @/hooks/useNetworkStatus
export const useNetworkStatus = jest.fn().mockReturnValue({
  isOnline: true,
  isSlowConnection: false,
  connectionType: 'wifi',
  lastOnlineTime: new Date().toISOString(),
  checkConnection: jest.fn(),
  getRecommendedBehavior: jest.fn().mockReturnValue({
    reduceImageQuality: false,
    allowUploads: true,
    useOfflineMode: false,
    maxRetries: 3,
  }),
});

export const useOfflineStorage = jest
  .fn()
  .mockImplementation((key, initialValue) => {
    const [value, setValue] = React.useState(initialValue);
    return [value, setValue];
  });

export default useNetworkStatus;
