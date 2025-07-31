'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProgressAnalysis, ProgressTrend } from '@/utils/progress-calculation';
import { BarChart3, Calendar, TrendingUp, Zap } from 'lucide-react';

interface AdvancedProgressChartProps {
  analysis: ProgressAnalysis;
  loading?: boolean;
  title?: string;
}

export function AdvancedProgressChart({
  analysis,
  loading = false,
  title = '상세 진행률 분석',
}: AdvancedProgressChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse space-y-4'>
            <div className='h-32 bg-gray-200 rounded'></div>
            <div className='grid grid-cols-3 gap-4'>
              {[...Array(3)].map((_, i) => (
                <div key={i} className='h-16 bg-gray-200 rounded'></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis || analysis.trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center text-gray-500 py-8'>
            <BarChart3 className='h-12 w-12 mx-auto mb-2 text-gray-300' />
            <p>분석할 데이터가 충분하지 않습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center space-x-2'>
          <BarChart3 className='h-5 w-5' />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue='trends' className='space-y-4'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='trends'>추세</TabsTrigger>
            <TabsTrigger value='consistency'>일관성</TabsTrigger>
            <TabsTrigger value='streaks'>연속기록</TabsTrigger>
            <TabsTrigger value='seasonal'>계절분석</TabsTrigger>
          </TabsList>

          {/* 추세 분석 탭 */}
          <TabsContent value='trends' className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='bg-blue-50 p-3 rounded-lg'>
                <div className='flex items-center space-x-2'>
                  <TrendingUp className='h-4 w-4 text-blue-600' />
                  <span className='text-sm font-medium'>평균 완료율</span>
                </div>
                <p className='text-2xl font-bold text-blue-600'>
                  {analysis.averageCompletionRate}%
                </p>
              </div>

              <div className='bg-green-50 p-3 rounded-lg'>
                <div className='flex items-center space-x-2'>
                  <Calendar className='h-4 w-4 text-green-600' />
                  <span className='text-sm font-medium'>최고 주간</span>
                </div>
                <p className='text-2xl font-bold text-green-600'>
                  {analysis.bestWeek?.rate || 0}%
                </p>
                {analysis.bestWeek && (
                  <p className='text-xs text-green-600'>
                    {analysis.bestWeek.monthName}
                  </p>
                )}
              </div>

              <div className='bg-purple-50 p-3 rounded-lg'>
                <div className='flex items-center space-x-2'>
                  <Zap className='h-4 w-4 text-purple-600' />
                  <span className='text-sm font-medium'>일관성 점수</span>
                </div>
                <p className='text-2xl font-bold text-purple-600'>
                  {analysis.consistencyScore}%
                </p>
              </div>
            </div>

            {/* 주간 추세 차트 */}
            <div className='space-y-3'>
              <h4 className='font-medium flex items-center space-x-2'>
                <span>주간 진행률 추세</span>
                <Badge
                  variant={
                    analysis.improvementTrend === 'improving'
                      ? 'default'
                      : analysis.improvementTrend === 'declining'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {analysis.improvementTrend === 'improving' && '상승 추세'}
                  {analysis.improvementTrend === 'declining' && '하락 추세'}
                  {analysis.improvementTrend === 'stable' && '안정적'}
                </Badge>
              </h4>

              <WeeklyTrendChart trends={analysis.trends} />
            </div>
          </TabsContent>

          {/* 일관성 분석 탭 */}
          <TabsContent value='consistency' className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-3'>
                <h4 className='font-medium'>변동성 분석</h4>
                <div className='flex items-center space-x-2'>
                  <span className='text-sm'>변동성 수준:</span>
                  <Badge
                    variant={
                      analysis.volatility === 'low'
                        ? 'default'
                        : analysis.volatility === 'medium'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {analysis.volatility === 'low' && '낮음 (안정적)'}
                    {analysis.volatility === 'medium' && '보통'}
                    {analysis.volatility === 'high' && '높음 (불안정)'}
                  </Badge>
                </div>
                <p className='text-sm text-gray-600'>
                  {analysis.volatility === 'low' &&
                    '매우 안정적인 학습 패턴을 보이고 있습니다.'}
                  {analysis.volatility === 'medium' &&
                    '적당한 변동성을 보이며, 전반적으로 양호합니다.'}
                  {analysis.volatility === 'high' &&
                    '진행률 변동이 큽니다. 더 일관된 학습 패턴을 만들어보세요.'}
                </p>
              </div>

              <div className='space-y-3'>
                <h4 className='font-medium'>연속 주간 분석</h4>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-sm'>현재 연속 주간</span>
                    <span className='font-medium'>
                      {analysis.streakAnalysis.currentStreakWeeks}주
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm'>최장 연속 주간</span>
                    <span className='font-medium'>
                      {analysis.streakAnalysis.longestStreakWeeks}주
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm'>평균 일일 연속</span>
                    <span className='font-medium'>
                      {analysis.streakAnalysis.averageStreak}일
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 연속 기록 탭 */}
          <TabsContent value='streaks' className='space-y-4'>
            <StreakAnalysisChart analysis={analysis.streakAnalysis} />
          </TabsContent>

          {/* 계절별 분석 탭 */}
          <TabsContent value='seasonal' className='space-y-4'>
            <SeasonalAnalysisChart
              seasonalPattern={analysis.seasonalPattern}
              trends={analysis.trends}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// 주간 추세 차트 컴포넌트
function WeeklyTrendChart({ trends }: { trends: ProgressTrend[] }) {
  const maxValue = Math.max(...trends.map(t => t.rate), 100);

  return (
    <div className='space-y-2'>
      {trends.map((trend, index) => (
        <div key={trend.period} className='space-y-1'>
          <div className='flex justify-between items-center text-sm'>
            <span className='text-gray-600'>
              {trend.monthName} {trend.weekNumber}주차
            </span>
            <div className='flex items-center space-x-2'>
              <span className='text-xs text-gray-500'>
                {trend.completed}/{trend.target}
              </span>
              <span
                className={`font-semibold ${
                  trend.rate >= 100
                    ? 'text-green-600'
                    : trend.rate >= 80
                      ? 'text-blue-600'
                      : trend.rate >= 50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                }`}
              >
                {trend.rate}%
              </span>
            </div>
          </div>

          <div className='relative'>
            <div className='h-4 bg-gray-100 rounded-full overflow-hidden'>
              <div
                className={`h-full transition-all duration-500 ${
                  trend.rate >= 100
                    ? 'bg-green-500'
                    : trend.rate >= 80
                      ? 'bg-blue-500'
                      : trend.rate >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                }`}
                style={{
                  width: `${Math.min((trend.rate / maxValue) * 100, 100)}%`,
                }}
              />
            </div>

            {trend.streak > 0 && (
              <div className='absolute -top-1 right-0 flex items-center space-x-1 text-xs text-orange-600'>
                <span>🔥</span>
                <span>{trend.streak}일</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// 연속 기록 분석 차트
function StreakAnalysisChart({
  analysis,
}: {
  analysis: {
    currentStreakWeeks: number;
    longestStreakWeeks: number;
    averageStreak: number;
  };
}) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      <div className='bg-orange-50 p-4 rounded-lg text-center'>
        <div className='text-3xl mb-2'>🔥</div>
        <p className='text-2xl font-bold text-orange-600'>
          {analysis.currentStreakWeeks}
        </p>
        <p className='text-sm text-orange-700'>현재 연속 주간</p>
      </div>

      <div className='bg-red-50 p-4 rounded-lg text-center'>
        <div className='text-3xl mb-2'>🏆</div>
        <p className='text-2xl font-bold text-red-600'>
          {analysis.longestStreakWeeks}
        </p>
        <p className='text-sm text-red-700'>최장 연속 주간</p>
      </div>

      <div className='bg-yellow-50 p-4 rounded-lg text-center'>
        <div className='text-3xl mb-2'>⭐</div>
        <p className='text-2xl font-bold text-yellow-600'>
          {analysis.averageStreak}
        </p>
        <p className='text-sm text-yellow-700'>평균 일일 연속</p>
      </div>
    </div>
  );
}

// 계절별 분석 차트
function SeasonalAnalysisChart({
  seasonalPattern,
  trends,
}: {
  seasonalPattern: {
    bestMonth: string;
    worstMonth: string;
    monthlyAverages: { [month: string]: number };
  };
  trends: ProgressTrend[];
}) {
  const monthlyData = Object.entries(seasonalPattern.monthlyAverages);

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='bg-green-50 p-3 rounded-lg'>
          <h4 className='font-medium text-green-800 mb-2'>최고 성과 월</h4>
          <p className='text-2xl font-bold text-green-600'>
            {seasonalPattern.bestMonth}
          </p>
          <p className='text-sm text-green-700'>
            평균 {seasonalPattern.monthlyAverages[seasonalPattern.bestMonth]}%
            완료
          </p>
        </div>

        <div className='bg-red-50 p-3 rounded-lg'>
          <h4 className='font-medium text-red-800 mb-2'>개선 필요 월</h4>
          <p className='text-2xl font-bold text-red-600'>
            {seasonalPattern.worstMonth}
          </p>
          <p className='text-sm text-red-700'>
            평균 {seasonalPattern.monthlyAverages[seasonalPattern.worstMonth]}%
            완료
          </p>
        </div>
      </div>

      {monthlyData.length > 0 && (
        <div className='space-y-2'>
          <h4 className='font-medium'>월별 평균 완료율</h4>
          {monthlyData.map(([month, average]) => (
            <div key={month} className='flex items-center space-x-3'>
              <span className='text-sm w-12'>{month}</span>
              <div className='flex-1 h-3 bg-gray-100 rounded-full overflow-hidden'>
                <div
                  className={`h-full ${
                    average >= 90
                      ? 'bg-green-500'
                      : average >= 70
                        ? 'bg-blue-500'
                        : average >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                  }`}
                  style={{ width: `${average}%` }}
                />
              </div>
              <span className='text-sm font-medium w-12'>{average}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
