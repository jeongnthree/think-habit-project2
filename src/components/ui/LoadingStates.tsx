import { cn } from '@/utils/cn';
import React from 'react';

// Loading spinner component
interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
  ...props
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  return (
    <svg
      role='presentation'
      className={cn(
        'animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      {...props}
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
  );
};

// Skeleton components for different content types
interface SkeletonProps {
  className?: string;
  animate?: boolean;
  'data-testid'?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  animate = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-gray-200 rounded',
        animate && 'animate-pulse',
        className
      )}
      {...props}
    />
  );
};

// Text skeleton
interface TextSkeletonProps extends SkeletonProps {
  lines?: number;
  lineHeight?: 'sm' | 'md' | 'lg';
}

export const TextSkeleton: React.FC<TextSkeletonProps> = ({
  lines = 1,
  lineHeight = 'md',
  className,
  animate = true,
  ...props
}) => {
  const heightClasses = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-5',
  };

  const spacingClasses = {
    sm: 'space-y-2',
    md: 'space-y-3',
    lg: 'space-y-4',
  };

  if (lines === 1) {
    return (
      <Skeleton
        className={cn(heightClasses[lineHeight], 'w-full', className)}
        animate={animate}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(spacingClasses[lineHeight], className)}
      data-testid={props['data-testid']}
    >
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            heightClasses[lineHeight],
            index === lines - 1 ? 'w-3/4' : 'w-full'
          )}
          animate={animate}
        />
      ))}
    </div>
  );
};

// Card skeleton
export const CardSkeleton: React.FC<SkeletonProps> = ({
  className,
  animate = true,
  ...props
}) => {
  return (
    <div
      className={cn('border border-gray-200 rounded-lg p-6', className)}
      {...props}
    >
      <div className='space-y-4'>
        <Skeleton className='h-6 w-3/4' animate={animate} />
        <TextSkeleton lines={3} animate={animate} />
        <div className='flex space-x-2'>
          <Skeleton className='h-8 w-20' animate={animate} />
          <Skeleton className='h-8 w-16' animate={animate} />
        </div>
      </div>
    </div>
  );
};

// Journal card skeleton
export const JournalCardSkeleton: React.FC<SkeletonProps> = ({
  className,
  animate = true,
  ...props
}) => {
  return (
    <div
      className={cn('border border-gray-200 rounded-lg p-6', className)}
      {...props}
    >
      <div className='space-y-4'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <Skeleton className='h-6 w-1/2' animate={animate} />
          <Skeleton className='h-5 w-20' animate={animate} />
        </div>

        {/* Content */}
        <TextSkeleton lines={2} animate={animate} />

        {/* Tags */}
        <div className='flex space-x-2'>
          <Skeleton className='h-6 w-16' animate={animate} />
          <Skeleton className='h-6 w-12' animate={animate} />
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between pt-4 border-t border-gray-100'>
          <div className='flex items-center space-x-2'>
            <Skeleton className='h-8 w-8 rounded-full' animate={animate} />
            <Skeleton className='h-4 w-24' animate={animate} />
          </div>
          <Skeleton className='h-4 w-16' animate={animate} />
        </div>
      </div>
    </div>
  );
};

// Form skeleton
export const FormSkeleton: React.FC<SkeletonProps> = ({
  className,
  animate = true,
  ...props
}) => {
  return (
    <div className={cn('space-y-6', className)} {...props}>
      {/* Title field */}
      <div className='space-y-2'>
        <Skeleton className='h-4 w-16' animate={animate} />
        <Skeleton className='h-10 w-full' animate={animate} />
      </div>

      {/* Content field */}
      <div className='space-y-2'>
        <Skeleton className='h-4 w-20' animate={animate} />
        <Skeleton className='h-32 w-full' animate={animate} />
      </div>

      {/* Checkbox list */}
      <div className='space-y-4'>
        <Skeleton className='h-5 w-24' animate={animate} />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className='flex items-start space-x-3'>
            <Skeleton className='h-5 w-5 mt-0.5' animate={animate} />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-3/4' animate={animate} />
              <Skeleton className='h-3 w-1/2' animate={animate} />
            </div>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className='flex justify-end space-x-3'>
        <Skeleton className='h-10 w-20' animate={animate} />
        <Skeleton className='h-10 w-24' animate={animate} />
      </div>
    </div>
  );
};

// Progress skeleton
export const ProgressSkeleton: React.FC<SkeletonProps> = ({
  className,
  animate = true,
  ...props
}) => {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-5 w-32' animate={animate} />
        <Skeleton className='h-6 w-12' animate={animate} />
      </div>
      <Skeleton className='h-3 w-full rounded-full' animate={animate} />
      <div className='flex justify-between'>
        <Skeleton className='h-4 w-24' animate={animate} />
        <Skeleton className='h-4 w-20' animate={animate} />
      </div>
    </div>
  );
};

// List skeleton
interface ListSkeletonProps extends SkeletonProps {
  items?: number;
  itemHeight?: string;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  items = 5,
  itemHeight = 'h-16',
  className,
  animate = true,
  ...props
}) => {
  return (
    <div className={cn('space-y-3', className)} {...props}>
      {Array.from({ length: items }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(itemHeight, 'w-full')}
          animate={animate}
        />
      ))}
    </div>
  );
};

// Loading overlay
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = '로딩 중...',
  children,
  className,
}) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className='absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10'>
          <div className='flex flex-col items-center space-y-3'>
            <LoadingSpinner size='lg' />
            <p className='text-sm text-gray-600'>{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Full page loading
interface FullPageLoadingProps {
  message?: string;
  showSpinner?: boolean;
}

export const FullPageLoading: React.FC<FullPageLoadingProps> = ({
  message = '페이지를 불러오는 중...',
  showSpinner = true,
}) => {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='text-center space-y-4'>
        {showSpinner && <LoadingSpinner size='xl' />}
        <p className='text-lg text-gray-600'>{message}</p>
      </div>
    </div>
  );
};

// Inline loading
interface InlineLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  message = '로딩 중...',
  size = 'sm',
  className,
}) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <LoadingSpinner size={size} />
      <span className='text-sm text-gray-600'>{message}</span>
    </div>
  );
};
