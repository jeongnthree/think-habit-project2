'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useProgressTracking } from '@/hooks/useProgressTracking';
import { generateMotivationalMessage } from '@/utils/progress-calculation';
import {
  Award,
  Calendar,
  Flame,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { useState } from 'react';

interface ProgressTrackerProps {
  userId: string;
  categoryId: string;
  categoryName: string;
  showDetailedView?: boolean;
}

export function ProgressTracker({
  userId,
  categoryId,
  categoryName,
  showDetailedView = false,
}: ProgressTrackerProps) {
  const { progressData, achievementData, loading, error, updateProgress } =
    useProgressTracking(userId, categoryId);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProgress = async () => {
    setIsUpdating(true);
    try {
      await updateProgress();
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='animate-pulse space-y-4'>
            <div className='h-4 bg-gray-200 rounded w-3/4'></div>
            <div className='h-8 bg-gray-200 rounded'></div>
            <div className='h-4 bg-gray-200 rounded w-1/2'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-red-600'>
            <p>{error}</p>
            <Button
              variant='outline'
              size='sm'
              onClick={handleUpdateProgress}
              className='mt-2'
            >
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progressData) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-gray-500'>
            <p>진행률 데이터가 없습니다.</p>
            <Button
              variant='outline'
              size='sm'
              onClick={handleUpdateProgress}
              className='mt-2'
            >
              진행률 계산
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { currentWeek, comparison, prediction, consistency, analysis } =
    progressData;
  const daysUntilWeekEnd = Math.max(0, 7 - new Date().getDay());
  const motivationalMessage = generateMotivationalMessage(
    currentWeek.completion_rate,
    currentWeek.current_streak,
    daysUntilWeekEnd
  );

  return (
    <div className='space-y-4'>
      {/* 메인 진행률 카드 */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-lg font-medium'>
            {categoryName} 진행률
          </CardTitle>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleUpdateProgress}
            disabled={isUpdating}
          >
            <RefreshCw
              className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`}
            />
          </Button>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* 주간 진행률 */}
          <div className='space-y-2'>
            <div className='flex justify-between items-center'>
              <span className='text-sm font-medium'>이번 주 목표</span>
              <span className='text-sm text-gray-600'>
                {currentWeek.completed_count} / {currentWeek.target_count}
              </span>
            </div>
            <Progress value={currentWeek.completion_rate} className='h-3' />
            <div className='flex justify-between items-center text-xs text-gray-500'>
              <span>{currentWeek.completion_rate}% 완료</span>
              <span>{daysUntilWeekEnd}일 남음</span>
            </div>
          </div>

          {/* 연속 기록 */}
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-2'>
              <Flame className='h-4 w-4 text-orange-500' />
              <span className='text-sm'>
                <span className='font-semibold'>
                  {currentWeek.current_streak}
                </span>
                일 연속
              </span>
            </div>
            <div className='flex items-center space-x-2'>
              <Trophy className='h-4 w-4 text-yellow-500' />
              <span className='text-sm'>
                최고{' '}
                <span className='font-semibold'>{currentWeek.best_streak}</span>
                일
              </span>
            </div>
          </div>

          {/* 동기부여 메시지 */}
          <div className='bg-blue-50 p-3 rounded-lg'>
            <p className='text-sm text-blue-800'>{motivationalMessage}</p>
          </div>

          {/* 이전 주 대비 변화 */}
          {comparison && (
            <div className='flex items-center space-x-2'>
              {comparison.improvement ? (
                <TrendingUp className='h-4 w-4 text-green-500' />
              ) : (
                <TrendingDown className='h-4 w-4 text-red-500' />
              )}
              <span className='text-sm'>{comparison.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 상세 정보 (옵션) */}
      {showDetailedView && (
        <>
          {/* 예측 및 권장사항 */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base flex items-center space-x-2'>
                <Target className='h-4 w-4' />
                <span>목표 달성 예측</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>달성 가능성</span>
                <Badge
                  variant={prediction.willComplete ? 'default' : 'secondary'}
                >
                  {prediction.confidence}% 확신
                </Badge>
              </div>
              <p className='text-sm text-gray-600'>
                {prediction.recommendation}
              </p>
            </CardContent>
          </Card>

          {/* 일관성 점수 */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base flex items-center space-x-2'>
                <Calendar className='h-4 w-4' />
                <span>일관성 점수</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>최근 4주 평균</span>
                <div className='flex items-center space-x-2'>
                  <Progress value={consistency.score} className='w-20 h-2' />
                  <span className='text-sm font-medium'>
                    {consistency.score}%
                  </span>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>일관성 수준</span>
                <Badge
                  variant={
                    consistency.level === 'excellent'
                      ? 'default'
                      : consistency.level === 'good'
                        ? 'secondary'
                        : consistency.level === 'fair'
                          ? 'outline'
                          : 'destructive'
                  }
                >
                  {consistency.level === 'excellent' && '우수'}
                  {consistency.level === 'good' && '양호'}
                  {consistency.level === 'fair' && '보통'}
                  {consistency.level === 'needs_improvement' && '개선 필요'}
                </Badge>
              </div>
              <p className='text-xs text-gray-500'>
                최근 4주 중 {consistency.consistentWeeks}주 목표 달성
              </p>
            </CardContent>
          </Card>

          {/* 진행률 분석 */}
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle className='text-base flex items-center space-x-2'>
                  <TrendingUp className='h-4 w-4' />
                  <span>진행률 분석</span>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm text-gray-600'>변동성</p>
                    <Badge
                      variant={
                        analysis.volatility === 'low'
                          ? 'default'
                          : analysis.volatility === 'medium'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {analysis.volatility === 'low' && '안정적'}
                      {analysis.volatility === 'medium' && '보통'}
                      {analysis.volatility === 'high' && '불안정'}
                    </Badge>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600'>개선 추세</p>
                    <Badge
                      variant={
                        analysis.improvementTrend === 'improving'
                          ? 'default'
                          : analysis.improvementTrend === 'declining'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {analysis.improvementTrend === 'improving' && '상승'}
                      {analysis.improvementTrend === 'declining' && '하락'}
                      {analysis.improvementTrend === 'stable' && '안정'}
                    </Badge>
                  </div>
                </div>

                {analysis.bestWeek && (
                  <div className='bg-green-50 p-2 rounded-lg'>
                    <p className='text-xs text-green-800'>
                      🏆 최고 주간: {analysis.bestWeek.rate}% (
                      {analysis.bestWeek.monthName})
                    </p>
                  </div>
                )}

                {analysis.seasonalPattern.bestMonth && (
                  <div className='bg-blue-50 p-2 rounded-lg'>
                    <p className='text-xs text-blue-800'>
                      📅 최고 성과 월: {analysis.seasonalPattern.bestMonth}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 성취 배지 */}
          {achievementData && achievementData.achievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='text-base flex items-center space-x-2'>
                  <Award className='h-4 w-4' />
                  <span>성취 배지</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 gap-2'>
                  {achievementData.achievements
                    .filter(achievement => achievement.achieved)
                    .slice(0, 4) // 최대 4개만 표시
                    .map(achievement => (
                      <div
                        key={achievement.id}
                        className={`flex items-center space-x-2 p-2 rounded-lg border ${
                          achievement.rarity === 'legendary'
                            ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
                            : achievement.rarity === 'epic'
                              ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200'
                              : achievement.rarity === 'rare'
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                                : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <span className='text-lg'>{achievement.icon}</span>
                        <div>
                          <p className='text-sm font-medium'>
                            {achievement.name}
                          </p>
                          <div className='flex items-center space-x-1'>
                            <Badge variant='outline' className='text-xs'>
                              {achievement.points}pt
                            </Badge>
                            <Badge
                              variant={
                                achievement.rarity === 'legendary'
                                  ? 'default'
                                  : achievement.rarity === 'epic'
                                    ? 'secondary'
                                    : achievement.rarity === 'rare'
                                      ? 'outline'
                                      : 'secondary'
                              }
                              className='text-xs'
                            >
                              {achievement.rarity === 'legendary' && '전설'}
                              {achievement.rarity === 'epic' && '영웅'}
                              {achievement.rarity === 'rare' && '희귀'}
                              {achievement.rarity === 'common' && '일반'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                {achievementData.newAchievements.length > 0 && (
                  <div className='mt-3 p-2 bg-green-50 rounded-lg'>
                    <p className='text-sm font-medium text-green-800'>
                      🎉 새로운 성취를 달성했습니다!
                    </p>
                  </div>
                )}
                {achievementData.achievements.filter(a => a.achieved).length >
                  4 && (
                  <p className='text-xs text-gray-500 mt-2 text-center'>
                    +
                    {achievementData.achievements.filter(a => a.achieved)
                      .length - 4}
                    개 더 보기
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
