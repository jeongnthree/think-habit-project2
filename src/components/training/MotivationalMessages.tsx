'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressTracking } from '@/types/database';
import { generateMotivationalMessage } from '@/utils/progress-calculation';
import { ChevronRight, Flame, MessageCircle, Target } from 'lucide-react';
import { useState } from 'react';

interface MotivationalMessagesProps {
  currentWeek: ProgressTracking;
  streakData: {
    current: number;
    best: number;
  };
  consistencyScore: number;
  totalJournals: number;
  onActionClick?: (action: string) => void;
}

export function MotivationalMessages({
  currentWeek,
  streakData,
  consistencyScore,
  totalJournals,
  onActionClick,
}: MotivationalMessagesProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const daysUntilWeekEnd = Math.max(0, 7 - new Date().getDay());
  const baseMessage = generateMotivationalMessage(
    currentWeek.completion_rate,
    streakData.current,
    daysUntilWeekEnd
  );

  // 다양한 동기부여 메시지 생성
  const messages = generateVariedMessages(
    currentWeek,
    streakData,
    consistencyScore,
    totalJournals,
    daysUntilWeekEnd
  );

  const currentMessage = messages[currentMessageIndex] || {
    message: baseMessage,
    type: 'default' as const,
    icon: '💪',
    action: null,
  };

  const nextMessage = () => {
    setCurrentMessageIndex(prev => (prev + 1) % messages.length);
  };

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base flex items-center space-x-2'>
          <MessageCircle className='h-4 w-4' />
          <span>오늘의 동기부여</span>
          {messages.length > 1 && (
            <Badge variant='outline' className='text-xs'>
              {currentMessageIndex + 1}/{messages.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* 메인 메시지 */}
        <div
          className={`p-4 rounded-lg border-l-4 ${getMessageStyle(currentMessage.type)}`}
        >
          <div className='flex items-start space-x-3'>
            <span className='text-2xl'>{currentMessage.icon}</span>
            <div className='flex-1'>
              <p className='text-sm font-medium mb-1'>
                {currentMessage.message}
              </p>
              {currentMessage.action && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onActionClick?.(currentMessage.action!.type)}
                  className='mt-2'
                >
                  {currentMessage.action.text}
                  <ChevronRight className='h-3 w-3 ml-1' />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 진행률 기반 추가 정보 */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='bg-blue-50 p-3 rounded-lg'>
            <div className='flex items-center space-x-2'>
              <Target className='h-4 w-4 text-blue-600' />
              <span className='text-sm font-medium'>이번 주 목표</span>
            </div>
            <p className='text-lg font-bold text-blue-600'>
              {currentWeek.completion_rate}%
            </p>
            <p className='text-xs text-blue-700'>
              {currentWeek.completed_count}/{currentWeek.target_count} 완료
            </p>
          </div>

          <div className='bg-orange-50 p-3 rounded-lg'>
            <div className='flex items-center space-x-2'>
              <Flame className='h-4 w-4 text-orange-600' />
              <span className='text-sm font-medium'>연속 기록</span>
            </div>
            <p className='text-lg font-bold text-orange-600'>
              {streakData.current}일
            </p>
            <p className='text-xs text-orange-700'>최고 {streakData.best}일</p>
          </div>
        </div>

        {/* 다음 메시지 버튼 */}
        {messages.length > 1 && (
          <div className='flex justify-center'>
            <Button
              variant='ghost'
              size='sm'
              onClick={nextMessage}
              className='text-xs'
            >
              다른 메시지 보기
              <ChevronRight className='h-3 w-3 ml-1' />
            </Button>
          </div>
        )}

        {/* 주간 팁 */}
        <WeeklyTip
          completionRate={currentWeek.completion_rate}
          streak={streakData.current}
          consistencyScore={consistencyScore}
        />
      </CardContent>
    </Card>
  );
}

// 메시지 타입별 스타일
function getMessageStyle(type: string) {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-400 text-green-800';
    case 'warning':
      return 'bg-yellow-50 border-yellow-400 text-yellow-800';
    case 'info':
      return 'bg-blue-50 border-blue-400 text-blue-800';
    case 'celebration':
      return 'bg-purple-50 border-purple-400 text-purple-800';
    default:
      return 'bg-gray-50 border-gray-400 text-gray-800';
  }
}

// 다양한 동기부여 메시지 생성
function generateVariedMessages(
  currentWeek: ProgressTracking,
  streakData: { current: number; best: number },
  consistencyScore: number,
  totalJournals: number,
  daysUntilWeekEnd: number
) {
  const messages = [];
  const { completion_rate, completed_count, target_count } = currentWeek;
  const { current: currentStreak, best: bestStreak } = streakData;

  // 목표 달성 상황별 메시지
  if (completion_rate >= 100) {
    messages.push({
      message: `🎉 이번 주 목표를 달성했습니다! ${currentStreak}일 연속 기록 중이에요. 이 기세를 계속 유지해보세요!`,
      type: 'celebration' as const,
      icon: '🎉',
      action: { type: 'create_journal', text: '추가 일지 작성하기' },
    });

    if (completion_rate >= 150) {
      messages.push({
        message: `🚀 목표를 150% 초과 달성! 정말 대단해요. 이런 열정이 성공의 비결이에요.`,
        type: 'celebration' as const,
        icon: '🚀',
        action: { type: 'share_achievement', text: '성과 공유하기' },
      });
    }
  } else if (completion_rate >= 80) {
    messages.push({
      message: `💪 거의 다 왔어요! ${daysUntilWeekEnd}일 남았고, 조금만 더 노력하면 목표 달성이에요.`,
      type: 'success' as const,
      icon: '💪',
      action: { type: 'create_journal', text: '일지 작성하기' },
    });
  } else if (completion_rate >= 50) {
    messages.push({
      message: `📈 좋은 페이스로 진행 중이에요. 꾸준함이 가장 중요해요. 계속 화이팅!`,
      type: 'info' as const,
      icon: '📈',
      action: { type: 'set_reminder', text: '알림 설정하기' },
    });
  } else {
    messages.push({
      message: `🌟 새로운 시작! 작은 걸음부터 시작해보세요. 오늘 하나만 작성해도 큰 발걸음이에요.`,
      type: 'warning' as const,
      icon: '🌟',
      action: { type: 'create_journal', text: '지금 시작하기' },
    });
  }

  // 연속 기록 기반 메시지
  if (currentStreak >= 7) {
    messages.push({
      message: `🔥 ${currentStreak}일 연속 기록! 이미 습관이 되어가고 있어요. 멈추지 마세요!`,
      type: 'success' as const,
      icon: '🔥',
      action: { type: 'view_streak', text: '연속 기록 보기' },
    });
  } else if (currentStreak >= 3) {
    messages.push({
      message: `⭐ ${currentStreak}일 연속! 좋은 시작이에요. 일주일까지 도전해보세요!`,
      type: 'info' as const,
      icon: '⭐',
      action: { type: 'create_journal', text: '연속 기록 이어가기' },
    });
  } else if (currentStreak === 0 && bestStreak > 0) {
    messages.push({
      message: `💫 이전에 ${bestStreak}일 연속 기록을 세웠잖아요! 다시 시작할 수 있어요.`,
      type: 'info' as const,
      icon: '💫',
      action: { type: 'create_journal', text: '다시 시작하기' },
    });
  }

  // 일관성 점수 기반 메시지
  if (consistencyScore >= 90) {
    messages.push({
      message: `👑 일관성 점수 ${consistencyScore}%! 정말 모범적인 학습 패턴이에요.`,
      type: 'celebration' as const,
      icon: '👑',
      action: { type: 'view_analytics', text: '상세 분석 보기' },
    });
  } else if (consistencyScore >= 70) {
    messages.push({
      message: `🎯 일관성 점수 ${consistencyScore}%. 꾸준한 노력이 보여요!`,
      type: 'success' as const,
      icon: '🎯',
      action: { type: 'improve_consistency', text: '일관성 높이기' },
    });
  } else if (consistencyScore < 50) {
    messages.push({
      message: `📅 더 일관된 학습 패턴을 만들어보세요. 정해진 시간에 하는 것이 도움이 돼요.`,
      type: 'warning' as const,
      icon: '📅',
      action: { type: 'set_schedule', text: '학습 시간 정하기' },
    });
  }

  // 총 일지 수 기반 메시지
  if (totalJournals >= 100) {
    messages.push({
      message: `🏆 총 ${totalJournals}개의 일지! 정말 대단한 성취예요. 계속해서 성장하고 있어요!`,
      type: 'celebration' as const,
      icon: '🏆',
      action: { type: 'view_achievements', text: '성취 보기' },
    });
  } else if (totalJournals >= 50) {
    messages.push({
      message: `📚 ${totalJournals}개의 일지를 작성했어요! 꾸준한 노력의 결과예요.`,
      type: 'success' as const,
      icon: '📚',
      action: { type: 'review_progress', text: '진행 상황 보기' },
    });
  } else if (totalJournals >= 10) {
    messages.push({
      message: `📝 ${totalJournals}개의 일지 완성! 좋은 시작이에요. 계속 이어가봐요!`,
      type: 'info' as const,
      icon: '📝',
      action: { type: 'create_journal', text: '다음 일지 작성' },
    });
  }

  // 요일별 특별 메시지
  const today = new Date().getDay();
  if (today === 1) {
    // 월요일
    messages.push({
      message: `🌅 새로운 한 주의 시작! 이번 주도 목표를 향해 함께 달려봐요.`,
      type: 'info' as const,
      icon: '🌅',
      action: { type: 'set_weekly_goal', text: '주간 목표 설정' },
    });
  } else if (today === 5) {
    // 금요일
    messages.push({
      message: `🎊 금요일이에요! 이번 주 얼마나 잘했는지 확인해보세요.`,
      type: 'info' as const,
      icon: '🎊',
      action: { type: 'review_week', text: '주간 리뷰 보기' },
    });
  } else if (today === 0) {
    // 일요일
    messages.push({
      message: `🔄 일요일, 한 주를 마무리하고 다음 주를 준비해보세요.`,
      type: 'info' as const,
      icon: '🔄',
      action: { type: 'plan_next_week', text: '다음 주 계획하기' },
    });
  }

  return messages.length > 0
    ? messages
    : [
        {
          message:
            '오늘도 학습에 참여해주셔서 감사합니다! 꾸준한 노력이 큰 변화를 만들어요.',
          type: 'default' as const,
          icon: '💪',
          action: null,
        },
      ];
}

// 주간 팁 컴포넌트
function WeeklyTip({
  completionRate,
  streak,
  consistencyScore,
}: {
  completionRate: number;
  streak: number;
  consistencyScore: number;
}) {
  const tips = [];

  if (completionRate < 50) {
    tips.push({
      icon: '💡',
      title: '작은 목표부터',
      content: '큰 목표보다는 작고 달성 가능한 목표부터 시작해보세요.',
    });
  }

  if (streak === 0) {
    tips.push({
      icon: '🎯',
      title: '연속 기록 시작',
      content: '하루에 하나씩, 작은 것부터 시작해서 연속 기록을 만들어보세요.',
    });
  }

  if (consistencyScore < 60) {
    tips.push({
      icon: '⏰',
      title: '정해진 시간',
      content: '매일 같은 시간에 학습하면 습관이 되기 쉬워요.',
    });
  }

  if (completionRate >= 100) {
    tips.push({
      icon: '🚀',
      title: '도전 레벨 업',
      content: '목표를 달성했다면 조금 더 도전적인 목표를 세워보세요.',
    });
  }

  const randomTip = tips[Math.floor(Math.random() * tips.length)] || {
    icon: '✨',
    title: '꾸준함의 힘',
    content: '작은 노력이라도 꾸준히 하면 큰 변화를 만들 수 있어요.',
  };

  return (
    <div className='bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-lg border border-indigo-200'>
      <div className='flex items-start space-x-2'>
        <span className='text-lg'>{randomTip.icon}</span>
        <div>
          <h4 className='font-medium text-indigo-800 text-sm'>
            💡 {randomTip.title}
          </h4>
          <p className='text-xs text-indigo-700 mt-1'>{randomTip.content}</p>
        </div>
      </div>
    </div>
  );
}
