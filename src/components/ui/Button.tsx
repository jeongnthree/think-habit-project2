import { cn } from '@/utils/cn';
import React from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const buttonVariants = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-soft hover:shadow-medium',
  secondary:
    'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500 shadow-soft hover:shadow-medium',
  outline:
    'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500 hover:border-primary-700',
  ghost: 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-soft hover:shadow-medium',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          // Variant styles
          buttonVariants[variant],
          // Size styles
          buttonSizes[size],
          // Full width
          fullWidth && 'w-full',
          // Loading state
          loading && 'cursor-wait',
          className
        )}
        disabled={isDisabled}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg
            className={cn(
              'animate-spin',
              size === 'sm'
                ? 'w-4 h-4'
                : size === 'lg'
                  ? 'w-6 h-6'
                  : size === 'xl'
                    ? 'w-7 h-7'
                    : 'w-5 h-5',
              children && 'mr-2'
            )}
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            />
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            />
          </svg>
        )}

        {!loading && icon && iconPosition === 'left' && (
          <span className={cn(children && 'mr-2')}>{icon}</span>
        )}

        {children}

        {!loading && icon && iconPosition === 'right' && (
          <span className={cn(children && 'ml-2')}>{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
