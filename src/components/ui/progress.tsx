'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-gray-200',
          className
        )}
        {...props}
      >
        <div
          className='h-full w-full flex-1 bg-primary transition-all duration-300 ease-in-out'
          style={{
            transform: `translateX(-${100 - percentage}%)`,
          }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };
