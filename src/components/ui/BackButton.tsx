'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from './Button';

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  onClick?: () => void;
}

export function BackButton({
  href,
  label = '뒤로 가기',
  className = '',
  variant = 'ghost',
  onClick,
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleClick}
      className={`flex items-center gap-2 ${className}`}
    >
      <ArrowLeft className='w-4 h-4' />
      {label}
    </Button>
  );
}
