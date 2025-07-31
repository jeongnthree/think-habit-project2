'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProgressTracking } from '@/hooks/useProgressTracking';
import { ProgressTracking } from '@/types';
import {
  Award,
  BarChart3,
  Calendar,
  Download,
  Settings,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { AchievementBadges } from './AchievementBadges';
import { AdvancedProgressChart } from './AdvancedProgressChart';
import { GoalComparison } from './GoalComparison';
import { MotivationalMessages } from './MotivationalMessages';
import { ProgressChart } from './ProgressChart';
import { ProgressTracker } from './ProgressTracker';

interface ProgressDashboardProps {
  userId: string;
  categoryId: string;
  categoryName: string;
  showGoalSetting?: boolean;
}

export function ProgressDashboard({
  userId,
  categoryId,
  categoryName,
  showGoalSetting = false,
}: ProgressDashboardProps) {
  const { progressData, achievementData, loading, error } = useProgressTracking(
    userId,
    categoryId
  );
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className='p-6'>
                <div className='animate-pulse space-y-3'>
                  <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                  <div className='h-8 bg-gray-200 rounded'></div>
                  <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-red-600'>
            <p>{error}</p>
            <Button variant='outline' size='sm' className='mt-2'>
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 헤더 */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>{categoryName} 진행 현황</h1>
          <p className='text-gray-600'>학습 진행률과 성취를 확인해보세요</p>
        </div>
        <div className='flex space-x-2'>
          {showGoalSetting && (
            <Button variant='outline' size='sm'>
              <Settings className='h-4 w-4 mr-2' />
              목표 설정
            </Button>
          )}
          <Button variant='outline' size='sm'>
            <Download className='h-4 w-4 mr-2' />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {/* 주요 지표 카드 */}
      {progressData && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <Target className='h-5 w-5 text-blue-500' />
                <div>
                  <p className='text-sm text-gray-600'>이번 주 진행률</p>
                  <p className='text-2xl font-bold text-blue-600'>
                    {progressData.currentWeek.completion_rate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <TrendingUp className='h-5 w-5 text-green-500' />
                <div>
                  <p className='text-sm text-gray-600'>현재 연속 기록</p>
                  <p className='text-2xl font-bold text-green-600'>
                    {progressData.currentWeek.current_streak}일
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <Calendar className='h-5 w-5 text-purple-500' />
                <div>
                  <p className='text-sm text-gray-600'>총 일지 수</p>
                  <p className='text-2xl font-bold text-purple-600'>
                    {progressData.totalJournals}개
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <Award className='h-5 w-5 text-yellow-500' />
                <div>
                  <p className='text-sm text-gray-600'>달성한 성취</p>
                  <p className='text-2xl font-bold text-yellow-600'>
                    {achievementData?.achievements.filter(a => a.achieved)
                      .length || 0}
                    개
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='overview'>개요</TabsTrigger>
          <TabsTrigger value='progress'>진행률</TabsTrigger>
          <TabsTrigger value='achievements'>성취</TabsTrigger>
          <TabsTrigger value='analytics'>분석</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value='overview' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* 동기부여 메시지 */}
            {progressData && (
              <MotivationalMessages
                currentWeek={progressData.currentWeek}
                streakData={{
                  current: progressData.currentWeek.current_streak,
                  best: progressData.currentWeek.best_streak,
                }}
                consistencyScore={progressData.consistency.score}
                totalJournals={progressData.totalJournals}
                onActionClick={action => {
                  console.log('Action clicked:', action);
                  // 액션 처리 로직 추가
                }}
              />
            )}

            {/* 진행률 트래커 */}
            <ProgressTracker
              userId={userId}
              categoryId={categoryId}
              categoryName={categoryName}
              showDetailedView={true}
            />

            {/* 성취 배지 */}
            {achievementData && (
              <AchievementBadges
                achievements={achievementData.achievements}
                newAchievements={achievementData.newAchievements}
                compact={true}
              />
            )}
          </div>

          {/* 목표 비교 */}
          {progressData && (
            <GoalComparison
              currentWeek={progressData.currentWeek}
              previousWeek={progressData.history[1]}
              personalBest={
                progressData.history.reduce(
                  (best, current) =>
                    current.completion_rate > (best?.completion_rate || 0)
                      ? current
                      : best,
                  null as ProgressTracking | null
                ) || undefined
              }
              onGoalUpdate={newGoal => {
                console.log('Goal update:', newGoal);
                // 목표 업데이트 로직 추가
              }}
            />
          )}
        </TabsContent>

        {/* 진행률 탭 */}
        <TabsContent value='progress' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {progressData && (
              <>
                <ProgressChart
                  data={progressData.history}
                  title='주간 진행률 추이'
                />
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center space-x-2'>
                      <BarChart3 className='h-5 w-5' />
                      <span>상세 통계</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <p className='text-sm text-gray-600'>평균 완료율</p>
                        <p className='text-lg font-semibold'>
                          {Math.round(
                            progressData.history.reduce(
                              (sum, record) => sum + record.completion_rate,
                              0
                            ) / Math.max(progressData.history.length, 1)
                          )}
                          %
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-gray-600'>최고 연속 기록</p>
                        <p className='text-lg font-semibold'>
                          {progressData.currentWeek.best_streak}일
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-gray-600'>일관성 점수</p>
                        <p className='text-lg font-semibold'>
                          {progressData.consistency.score}%
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-gray-600'>목표 달성 주</p>
                        <p className='text-lg font-semibold'>
                          {
                            progressData.history.filter(
                              r => r.completion_rate >= 100
                            ).length
                          }
                          주
                        </p>
                      </div>
                    </div>

                    {/* 예측 정보 */}
                    <div className='pt-4 border-t border-gray-200'>
                      <h4 className='font-medium mb-2'>
                        이번 주 목표 달성 예측
                      </h4>
                      <div className='bg-blue-50 p-3 rounded-lg'>
                        <p className='text-sm text-blue-800'>
                          {progressData.prediction.recommendation}
                        </p>
                        <div className='flex items-center justify-between mt-2 text-xs text-blue-600'>
                          <span>
                            달성 확률: {progressData.prediction.confidence}%
                          </span>
                          <span>
                            {progressData.prediction.willComplete
                              ? '✅ 달성 가능'
                              : '⚠️ 추가 노력 필요'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* 성취 탭 */}
        <TabsContent value='achievements'>
          {achievementData && (
            <AchievementBadges
              achievements={achievementData.achievements}
              newAchievements={achievementData.newAchievements}
              showAll={true}
            />
          )}
        </TabsContent>

        {/* 분석 탭 */}
        <TabsContent value='analytics' className='space-y-6'>
          {progressData && progressData.analysis && (
            <AdvancedProgressChart
              analysis={progressData.analysis}
              title='상세 진행률 분석'
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
