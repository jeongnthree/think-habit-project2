// Mock for @/components/ui/AccessibilityProvider
import React from 'react';

const accessibilityContext = {
  settings: {
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false,
  },
  setSettings: jest.fn(),
  announceToScreenReader: jest.fn(),
};

export const AccessibilityProvider = ({ children }) => {
  return <div data-testid='accessibility-provider'>{children}</div>;
};

export const useAccessibility = jest.fn().mockReturnValue(accessibilityContext);

export default AccessibilityProvider;
