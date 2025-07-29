import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`flex ${className}`} aria-label='Breadcrumb'>
      <ol className='flex items-center space-x-1 md:space-x-3'>
        <li className='inline-flex items-center'>
          <Link
            href='/'
            className='inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors'
          >
            <Home className='w-4 h-4 mr-2' />홈
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index}>
            <div className='flex items-center'>
              <ChevronRight className='w-4 h-4 text-gray-400' />
              {item.href && !item.current ? (
                <Link
                  href={item.href}
                  className='ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors md:ml-2'
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`ml-1 text-sm font-medium md:ml-2 ${
                    item.current
                      ? 'text-gray-500 cursor-default'
                      : 'text-gray-700'
                  }`}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
