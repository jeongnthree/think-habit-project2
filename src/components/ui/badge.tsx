'use client';

import { cn } from '@/utils/cn';
import * as React from 'react';

const badgeVariants = {
  default: 'border-transparent bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'border-transparent bg-gray-600 text-white hover:bg-gray-700',
  destructive: 'border-transparent bg-red-600 text-white hover:bg-red-700',
  outline: 'text-gray-700 border-gray-300',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants;
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div 
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        badgeVariants[variant],
        className
      )} 
      {...props} 
    />
  );
}

export { Badge, badgeVariants };
