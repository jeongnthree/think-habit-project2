import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📝',
  title,
  description,
  actionLabel,
  onAction,
  size = 'md',
}) => {
  const sizeStyles = {
    sm: {
      container: 'py-8',
      icon: 'text-4xl mb-2',
      title: 'text-lg font-medium',
      description: 'text-sm',
      spacing: 'space-y-2',
    },
    md: {
      container: 'py-12',
      icon: 'text-6xl mb-4',
      title: 'text-xl font-medium',
      description: 'text-base',
      spacing: 'space-y-4',
    },
    lg: {
      container: 'py-16',
      icon: 'text-8xl mb-6',
      title: 'text-2xl font-semibold',
      description: 'text-lg',
      spacing: 'space-y-6',
    },
  };

  const styles = sizeStyles[size];

  return (
    <div className={`text-center ${styles.container}`}>
      <div className={`${styles.spacing}`}>
        <div className={`${styles.icon}`}>
          {icon}
        </div>
        <div>
          <h3 className={`${styles.title} text-gray-900 mb-2`}>
            {title}
          </h3>
          {description && (
            <p className={`${styles.description} text-gray-500 max-w-sm mx-auto`}>
              {description}
            </p>
          )}
        </div>
        {actionLabel && onAction && (
          <div className="pt-4">
            <Button onClick={onAction}>
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// 특정 용도별 빈 상태 컴포넌트들
export const NoJournals: React.FC<{ onCreateJournal?: () => void }> = ({ onCreateJournal }) => (
  <EmptyState
    icon="📔"
    title="작성한 일지가 없습니다"
    description="첫 번째 훈련 일지를 작성해보세요. 꾸준한 기록이 성장의 시작입니다."
    actionLabel="일지 작성하기"
    onAction={onCreateJournal}
  />
);

export const NoComments: React.FC = () => (
  <EmptyState
    icon="💬"
    title="아직 댓글이 없습니다"
    description="첫 번째 댓글을 작성해보세요."
    size="sm"
  />
);

export const NoNotifications: React.FC = () => (
  <EmptyState
    icon="🔔"
    title="새로운 알림이 없습니다"
    description="새로운 알림이 오면 여기에 표시됩니다."
    size="sm"
  />
);

export const NoSearchResults: React.FC<{ query: string; onClearSearch?: () => void }> = ({ 
  query, 
  onClearSearch 
}) => (
  <EmptyState
    icon="🔍"
    title={`"${query}"에 대한 검색 결과가 없습니다`}
    description="다른 검색어를 시도해보거나 필터를 조정해보세요."
    actionLabel="검색 초기화"
    onAction={onClearSearch}
    size="sm"
  />
);