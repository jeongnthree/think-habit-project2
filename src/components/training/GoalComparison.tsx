'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/progress';
import { ProgressTracking } from '@/types/database';
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';

interface GoalComparisonProps {
  currentWeek: ProgressTracking;
  previousWeek?: ProgressTracking;
  categoryAverage?: number;
  personalBest?: ProgressTracking;
  onGoalUpdate?: (newGoal: number) => void;
}

export function GoalComparison({
  currentWeek,
  previousWeek,
  categoryAverage = 75,
  personalBest,
  onGoalUpdate,
}: GoalComparisonProps) {
  const weekComparison = previousWeek
    ? {
        completionChange:
          currentWeek.completion_rate - previousWeek.completion_rate,
        streakChange: currentWeek.current_streak - previousWeek.current_streak,
        countChange: currentWeek.completed_count - previousWeek.completed_count,
      }
    : null;

  const vsAverage = currentWeek.completion_rate - categoryAverage;
  const vsBest = personalBest
    ? currentWeek.completion_rate - personalBest.completion_rate
    : 0;

  return (
    <div className='space-y-4'>
      {/* 현재 주 목표 진행률 */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg flex items-center space-x-2'>
            <Target className='h-5 w-5' />
            <span>이번 주 목표 진행률</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <div className='flex justify-between items-center'>
              <span className='text-sm font-medium'>목표 달성률</span>
              <span className='text-2xl font-bold text-blue-600'>
                {currentWeek.completion_rate}%
              </span>
            </div>
            <Progress value={currentWeek.completion_rate} className='h-3' />
            <div className='flex justify-between text-xs text-gray-500'>
              <span>
                {currentWeek.completed_count} / {currentWeek.target_count} 완료
              </span>
              <span>
                {currentWeek.completion_rate >= 100
                  ? '목표 달성!'
                  : `${currentWeek.target_count - currentWeek.completed_count}개 남음`}
              </span>
            </div>
          </div>

          {/* 목표 조정 버튼 */}
          <div className='flex items-center justify-between pt-2 border-t'>
            <span className='text-sm text-gray-600'>주간 목표</span>
            <div className='flex items-center space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  onGoalUpdate?.(Math.max(1, currentWeek.target_count - 1))
                }
                disabled={currentWeek.target_count <= 1}
              >
                <Minus className='h-3 w-3' />
              </Button>
              <span className='font-medium px-2'>
                {currentWeek.target_count}
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={() => onGoalUpdate?.(currentWeek.target_count + 1)}
                disabled={currentWeek.target_count >= 10}
              >
                <ArrowUp className='h-3 w-3' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 비교 분석 */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* 이전 주 대비 */}
        {weekComparison && (
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base flex items-center space-x-2'>
                <Calendar className='h-4 w-4' />
                <span>이전 주 대비</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <ComparisonItem
                label='완료율'
                current={currentWeek.completion_rate}
                previous={previousWeek.completion_rate}
                change={weekComparison.completionChange}
                unit='%'
                type='percentage'
              />
              <ComparisonItem
                label='완료 개수'
                current={currentWeek.completed_count}
                previous={previousWeek.completed_count}
                change={weekComparison.countChange}
                unit='개'
                type='count'
              />
              <ComparisonItem
                label='연속 기록'
                current={currentWeek.current_streak}
                previous={previousWeek.current_streak}
                change={weekComparison.streakChange}
                unit='일'
                type='count'
              />
            </CardContent>
          </Card>
        )}

        {/* 평균 대비 */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base flex items-center space-x-2'>
              <Users className='h-4 w-4' />
              <span>다른 사용자 대비</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <span className='text-sm'>카테고리 평균</span>
                <span className='text-sm font-medium'>{categoryAverage}%</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm'>내 완료율</span>
                <span className='text-sm font-medium'>
                  {currentWeek.completion_rate}%
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                {vsAverage > 0 ? (
                  <TrendingUp className='h-4 w-4 text-green-500' />
                ) : vsAverage < 0 ? (
                  <TrendingDown className='h-4 w-4 text-red-500' />
                ) : (
                  <Minus className='h-4 w-4 text-gray-500' />
                )}
                <span
                  className={`text-sm font-medium ${
                    vsAverage > 0
                      ? 'text-green-600'
                      : vsAverage < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}
                >
                  평균보다 {Math.abs(vsAverage).toFixed(1)}%{' '}
                  {vsAverage > 0 ? '높음' : vsAverage < 0 ? '낮음' : '동일'}
                </span>
              </div>
            </div>

            {/* 순위 표시 (가상) */}
            <div className='pt-2 border-t'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>예상 순위</span>
                <Badge
                  variant={
                    vsAverage > 20
                      ? 'default'
                      : vsAverage > 0
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  상위 {vsAverage > 20 ? '10%' : vsAverage > 0 ? '30%' : '50%'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 개인 최고 기록 대비 */}
      {personalBest && (
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base flex items-center space-x-2'>
              <TrendingUp className='h-4 w-4' />
              <span>개인 최고 기록 대비</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <p className='text-sm text-gray-600'>개인 최고</p>
                <p className='text-2xl font-bold text-purple-600'>
                  {personalBest.completion_rate}%
                </p>
                <p className='text-xs text-gray-500'>
                  {new Date(personalBest.week_start_date).toLocaleDateString()}
                </p>
              </div>
              <div className='space-y-2'>
                <p className='text-sm text-gray-600'>현재 기록</p>
                <p className='text-2xl font-bold text-blue-600'>
                  {currentWeek.completion_rate}%
                </p>
                <div className='flex items-center space-x-1'>
                  {vsBest > 0 ? (
                    <ArrowUp className='h-3 w-3 text-green-500' />
                  ) : vsBest < 0 ? (
                    <ArrowDown className='h-3 w-3 text-red-500' />
                  ) : (
                    <Minus className='h-3 w-3 text-gray-500' />
                  )}
                  <span
                    className={`text-xs ${
                      vsBest > 0
                        ? 'text-green-600'
                        : vsBest < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {vsBest > 0 ? '+' : ''}
                    {vsBest.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {currentWeek.completion_rate > personalBest.completion_rate && (
              <div className='mt-3 p-2 bg-green-50 rounded-lg'>
                <p className='text-sm font-medium text-green-800'>
                  🎉 새로운 개인 최고 기록을 달성했습니다!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 목표 달성 예측 */}
      <GoalPrediction currentWeek={currentWeek} />
    </div>
  );
}

// 비교 항목 컴포넌트
function ComparisonItem({
  label,
  current,
  previous,
  change,
  unit,
  type,
}: {
  label: string;
  current: number;
  previous: number;
  change: number;
  unit: string;
  type: 'percentage' | 'count';
}) {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <div className='flex justify-between items-center'>
      <span className='text-sm text-gray-600'>{label}</span>
      <div className='flex items-center space-x-2'>
        <span className='text-sm font-medium'>
          {current}
          {unit}
        </span>
        <div className='flex items-center space-x-1'>
          {!isNeutral && (
            <>
              {isPositive ? (
                <ArrowUp className='h-3 w-3 text-green-500' />
              ) : (
                <ArrowDown className='h-3 w-3 text-red-500' />
              )}
              <span
                className={`text-xs ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Math.abs(change)}
                {unit}
              </span>
            </>
          )}
          {isNeutral && (
            <span className='text-xs text-gray-500'>변화 없음</span>
          )}
        </div>
      </div>
    </div>
  );
}

// 목표 달성 예측 컴포넌트
function GoalPrediction({ currentWeek }: { currentWeek: ProgressTracking }) {
  const today = new Date().getDay();
  const daysLeft = 7 - today;
  const remaining = Math.max(
    0,
    currentWeek.target_count - currentWeek.completed_count
  );
  const dailyNeed = daysLeft > 0 ? Math.ceil(remaining / daysLeft) : remaining;

  let prediction = '';
  let predictionType: 'success' | 'warning' | 'danger' = 'success';

  if (currentWeek.completion_rate >= 100) {
    prediction = '목표를 이미 달성했습니다! 추가 도전을 고려해보세요.';
    predictionType = 'success';
  } else if (dailyNeed <= 1) {
    prediction = `현재 페이스를 유지하면 목표 달성이 가능합니다.`;
    predictionType = 'success';
  } else if (dailyNeed <= 2) {
    prediction = `하루에 ${dailyNeed}개씩 작성하면 목표를 달성할 수 있습니다.`;
    predictionType = 'warning';
  } else {
    prediction = `목표 달성을 위해 더 많은 노력이 필요합니다. (하루 ${dailyNeed}개 필요)`;
    predictionType = 'danger';
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base flex items-center space-x-2'>
          <Target className='h-4 w-4' />
          <span>목표 달성 예측</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`p-3 rounded-lg ${
            predictionType === 'success'
              ? 'bg-green-50 text-green-800'
              : predictionType === 'warning'
                ? 'bg-yellow-50 text-yellow-800'
                : 'bg-red-50 text-red-800'
          }`}
        >
          <p className='text-sm font-medium'>{prediction}</p>
          {daysLeft > 0 && remaining > 0 && (
            <div className='mt-2 text-xs opacity-80'>
              남은 기간: {daysLeft}일 | 남은 목표: {remaining}개
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
