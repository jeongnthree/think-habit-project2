'use client';

import { HelpCircle, X } from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { useAccessibility } from './AccessibilityProvider';

interface HelpTooltipProps {
  content: ReactNode;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click';
  className?: string;
  children?: ReactNode;
}

export function HelpTooltip({
  content,
  title,
  position = 'top',
  trigger = 'hover',
  className = '',
  children,
}: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { announceToScreenReader } = useAccessibility();

  // Calculate optimal position based on viewport
  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !triggerRef.current) return;

    const tooltip = tooltipRef.current;
    const trigger = triggerRef.current;
    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let newPosition = position;

    // Check if tooltip fits in preferred position
    switch (position) {
      case 'top':
        if (rect.top - tooltipRect.height < 10) {
          newPosition = 'bottom';
        }
        break;
      case 'bottom':
        if (rect.bottom + tooltipRect.height > viewport.height - 10) {
          newPosition = 'top';
        }
        break;
      case 'left':
        if (rect.left - tooltipRect.width < 10) {
          newPosition = 'right';
        }
        break;
      case 'right':
        if (rect.right + tooltipRect.width > viewport.width - 10) {
          newPosition = 'left';
        }
        break;
    }

    setActualPosition(newPosition);
  }, [isVisible, position]);

  const handleShow = () => {
    setIsVisible(true);
    if (title) {
      announceToScreenReader(`도움말 열림: ${title}`);
    }
  };

  const handleHide = () => {
    setIsVisible(false);
    if (title) {
      announceToScreenReader('도움말 닫힘');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleHide();
      triggerRef.current?.focus();
    }
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
    bottom:
      'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
    right:
      'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {children ? (
        <div
          onMouseEnter={trigger === 'hover' ? handleShow : undefined}
          onMouseLeave={trigger === 'hover' ? handleHide : undefined}
          onClick={
            trigger === 'click' ? () => setIsVisible(!isVisible) : undefined
          }
        >
          {children}
        </div>
      ) : (
        <button
          ref={triggerRef}
          type='button'
          className='inline-flex items-center justify-center w-5 h-5 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full'
          onMouseEnter={trigger === 'hover' ? handleShow : undefined}
          onMouseLeave={trigger === 'hover' ? handleHide : undefined}
          onClick={
            trigger === 'click' ? () => setIsVisible(!isVisible) : undefined
          }
          aria-label={title ? `도움말: ${title}` : '도움말'}
          aria-expanded={isVisible}
          aria-describedby={isVisible ? 'tooltip-content' : undefined}
        >
          <HelpCircle className='w-4 h-4' />
        </button>
      )}

      {isVisible && (
        <>
          {/* Backdrop for click trigger */}
          {trigger === 'click' && (
            <div
              className='fixed inset-0 z-10'
              onClick={handleHide}
              aria-hidden='true'
            />
          )}

          {/* Tooltip */}
          <div
            ref={tooltipRef}
            id='tooltip-content'
            role='tooltip'
            className={`absolute z-20 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg max-w-xs ${positionClasses[actualPosition]}`}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            {/* Close button for click trigger */}
            {trigger === 'click' && (
              <button
                type='button'
                className='absolute top-1 right-1 p-1 text-gray-300 hover:text-white focus:outline-none focus:ring-1 focus:ring-white rounded'
                onClick={handleHide}
                aria-label='도움말 닫기'
              >
                <X className='w-3 h-3' />
              </button>
            )}

            {/* Title */}
            {title && <div className='font-semibold mb-1 pr-6'>{title}</div>}

            {/* Content */}
            <div className={title ? '' : 'pr-6'}>{content}</div>

            {/* Arrow */}
            <div
              className={`absolute w-0 h-0 border-4 ${arrowClasses[actualPosition]}`}
              aria-hidden='true'
            />
          </div>
        </>
      )}
    </div>
  );
}

// Predefined help content for common scenarios
export const HelpContent = {
  journalTypes: (
    <div>
      <p className='mb-2'>
        <strong>구조화된 일지:</strong> 미리 정의된 과제를 체크리스트 형태로
        완료하는 일지입니다.
      </p>
      <p>
        <strong>사진 일지:</strong> 손으로 작성한 노트나 스케치를 사진으로
        업로드하는 자유형식 일지입니다.
      </p>
    </div>
  ),

  progressTracking: (
    <div>
      <p className='mb-2'>
        주간 진행률은 현재 주에 완료한 일지 수를 기준으로 계산됩니다.
      </p>
      <p>
        매주 월요일에 진행률이 초기화되며, 이전 주의 기록은 통계에 보관됩니다.
      </p>
    </div>
  ),

  photoUpload: (
    <div>
      <p className='mb-2'>지원 형식: JPG, PNG, HEIC, WebP</p>
      <p className='mb-2'>최대 파일 크기: 10MB</p>
      <p>최대 10장까지 업로드 가능합니다. 이미지는 자동으로 최적화됩니다.</p>
    </div>
  ),

  privacy: (
    <div>
      <p className='mb-2'>
        <strong>공개:</strong> 다른 사용자들이 볼 수 있으며 댓글을 달 수
        있습니다.
      </p>
      <p>
        <strong>비공개:</strong> 본인과 담당 코치만 볼 수 있습니다.
      </p>
    </div>
  ),
};
