import { cn } from '@/utils/cn';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

/**
 * 생각습관 로고 컴포넌트
 */
export function Logo({
  href = '/',
  size = 'md',
  className,
  showText = true,
}: LogoProps) {
  // 크기별 설정
  const sizes = {
    sm: { width: 120, height: 40 },
    md: { width: 180, height: 60 },
    lg: { width: 240, height: 80 },
  };

  const { width, height } = sizes[size];

  const logo = (
    <div className={cn('flex items-center', className)}>
      <Image
        src='/images/think-habit-logo.png' // 로고 파일명에 맞게 수정하세요
        alt='생각도 습관입니다 - Think Habit 로고'
        width={width}
        height={height}
        priority
        className='object-contain'
      />
      {showText && (
        <span className='sr-only'>생각도 습관입니다 - Think Habit</span>
      )}
    </div>
  );

  // 링크가 필요한 경우 Link로 감싸기
  if (href) {
    return (
      <Link href={href} className='focus:outline-none'>
        {logo}
      </Link>
    );
  }

  // 링크가 필요 없는 경우 그대로 반환
  return logo;
}

export default Logo;
