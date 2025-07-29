'use client';

import { BackButton } from '@/components/ui/BackButton';
import { Breadcrumb, BreadcrumbItem } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface TrainingNavigationProps {
  breadcrumbItems?: BreadcrumbItem[];
  backButtonHref?: string;
  backButtonLabel?: string;
  showBackButton?: boolean;
  showBreadcrumb?: boolean;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TrainingNavigation({
  breadcrumbItems = [],
  backButtonHref,
  backButtonLabel,
  showBackButton = true,
  showBreadcrumb = true,
  title,
  subtitle,
  actions,
}: TrainingNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Training navigation menu items
  const navigationItems = [
    { name: '훈련 홈', href: '/training', current: pathname === '/training' },
    {
      name: '내 일지',
      href: '/training/journals',
      current: pathname.startsWith('/training/journals'),
    },
    {
      name: '새 일지 작성',
      href: '/training/journal/new',
      current: pathname.startsWith('/training/journal/new'),
    },
  ];

  return (
    <div className='bg-white border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Desktop Navigation */}
        <div className='hidden md:block'>
          {/* Breadcrumb */}
          {showBreadcrumb && breadcrumbItems.length > 0 && (
            <div className='py-3 border-b border-gray-100'>
              <Breadcrumb items={breadcrumbItems} />
            </div>
          )}

          {/* Main Navigation */}
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center space-x-8'>
              {/* Back Button */}
              {showBackButton && (
                <BackButton
                  href={backButtonHref}
                  label={backButtonLabel}
                  variant='ghost'
                  className='text-sm'
                />
              )}

              {/* Navigation Links */}
              <nav className='flex space-x-8'>
                {navigationItems.map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      item.current
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Actions */}
            {actions && (
              <div className='flex items-center space-x-4'>{actions}</div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className='md:hidden'>
          {/* Mobile Header */}
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center space-x-4'>
              {/* Mobile Menu Button */}
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className='p-2'
              >
                {mobileMenuOpen ? (
                  <X className='h-5 w-5' />
                ) : (
                  <Menu className='h-5 w-5' />
                )}
              </Button>

              {/* Title */}
              <div>
                {title && (
                  <h1 className='text-lg font-semibold text-gray-900'>
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className='text-sm text-gray-500'>{subtitle}</p>
                )}
              </div>
            </div>

            {/* Mobile Actions */}
            {actions && (
              <div className='flex items-center space-x-2'>{actions}</div>
            )}
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className='border-t border-gray-200 pb-3'>
              {/* Breadcrumb */}
              {showBreadcrumb && breadcrumbItems.length > 0 && (
                <div className='px-4 py-3 border-b border-gray-100'>
                  <Breadcrumb items={breadcrumbItems} />
                </div>
              )}

              {/* Back Button */}
              {showBackButton && (
                <div className='px-4 py-3 border-b border-gray-100'>
                  <BackButton
                    href={backButtonHref}
                    label={backButtonLabel}
                    variant='ghost'
                    className='text-sm w-full justify-start'
                  />
                </div>
              )}

              {/* Navigation Links */}
              <div className='px-4 py-3 space-y-1'>
                {navigationItems.map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      item.current
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
