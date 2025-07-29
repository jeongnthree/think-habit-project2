'use client';

import { ReactNode, useEffect, useState } from 'react';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  centerContent?: boolean;
}

interface BreakpointInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

export function ResponsiveContainer({
  children,
  className = '',
  maxWidth = 'lg',
  padding = 'md',
  centerContent = true,
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-6 py-4',
    lg: 'px-8 py-6',
  };

  return (
    <div
      className={`
        w-full
        ${maxWidthClasses[maxWidth]}
        ${paddingClasses[padding]}
        ${centerContent ? 'mx-auto' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Hook for responsive behavior
export function useBreakpoint(): BreakpointInfo {
  const [breakpointInfo, setBreakpointInfo] = useState<BreakpointInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: 1024,
    height: 768,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateBreakpoint = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setBreakpointInfo({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width,
        height,
      });
    };

    // Initial check
    updateBreakpoint();

    // Listen for resize
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpointInfo;
}

// Responsive grid component
interface ResponsiveGridProps {
  children: ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ResponsiveGrid({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className = '',
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  return (
    <div
      className={`
        grid
        ${gridCols[columns.mobile || 1]}
        md:${gridCols[columns.tablet || 2]}
        lg:${gridCols[columns.desktop || 3]}
        ${gapClasses[gap]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Responsive text component
interface ResponsiveTextProps {
  children: ReactNode;
  size?: {
    mobile?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
    tablet?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
    desktop?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  };
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
  className?: string;
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function ResponsiveText({
  children,
  size = { mobile: 'base', tablet: 'base', desktop: 'base' },
  weight = 'normal',
  color = 'text-gray-900',
  className = '',
  as: Component = 'p',
}: ResponsiveTextProps) {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  return (
    <Component
      className={`
        ${sizeClasses[size.mobile || 'base']}
        md:${sizeClasses[size.tablet || 'base']}
        lg:${sizeClasses[size.desktop || 'base']}
        ${weightClasses[weight]}
        ${color}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

// Mobile-first navigation component
interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function MobileMenu({ isOpen, onClose, children }: MobileMenuProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 lg:hidden'>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black bg-opacity-50'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Menu */}
      <div className='fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl'>
        <div className='flex flex-col h-full'>
          <div className='flex items-center justify-between p-4 border-b'>
            <h2 className='text-lg font-semibold'>메뉴</h2>
            <button
              type='button'
              onClick={onClose}
              className='p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md'
              aria-label='메뉴 닫기'
            >
              <svg
                className='w-6 h-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>

          <div className='flex-1 overflow-y-auto p-4'>{children}</div>
        </div>
      </div>
    </div>
  );
}

// Touch-friendly button for mobile
interface TouchButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function TouchButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
}: TouchButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors touch-manipulation';

  const variantClasses = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-gray-300',
    secondary:
      'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-300',
    outline:
      'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500 disabled:bg-gray-100',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
