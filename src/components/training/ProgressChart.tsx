'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressTracking } from '@/types/database';
import {
  formatDateForDB,
  getWeekStartDate,
} from '@/utils/progress-calculation';

interface ProgressChartProps {
  data: ProgressTracking[];
  loading?: boolean;
  title?: string;
}

export function ProgressChart({
  data,
  loading = false,
  title = '주간 진행률',
}: ProgressChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse space-y-3'>
            {[...Array(6)].map((_, i) => (
              <div key={i} className='flex items-center space-x-3'>
                <div className='h-4 bg-gray-200 rounded w-16'></div>
                <div className='flex-1 h-6 bg-gray-200 rounded'></div>
                <div className='h-4 bg-gray-200 rounded w-12'></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center text-gray-500 py-8'>
            <p>표시할 데이터가 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 데이터를 최신순으로 정렬하고 최대 12주만 표시
  const sortedData = [...data]
    .sort(
      (a, b) =>
        new Date(b.week_start_date).getTime() -
        new Date(a.week_start_date).getTime()
    )
    .slice(0, 12)
    .reverse(); // 차트에서는 오래된 것부터 표시

  const maxValue = Math.max(...sortedData.map(d => d.completion_rate), 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {sortedData.map((record, index) => {
            const weekStart = new Date(record.week_start_date);
            const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
            const isCurrentWeek =
              formatDateForDB(getWeekStartDate()) === record.week_start_date;

            return (
              <div key={record.id || index} className='space-y-1'>
                <div className='flex justify-between items-center text-sm'>
                  <span
                    className={`font-medium ${isCurrentWeek ? 'text-blue-600' : 'text-gray-600'}`}
                  >
                    {weekLabel} {isCurrentWeek && '(이번 주)'}
                  </span>
                  <div className='flex items-center space-x-2'>
                    <span className='text-xs text-gray-500'>
                      {record.completed_count}/{record.target_count}
                    </span>
                    <span
                      className={`font-semibold ${
                        record.completion_rate >= 100
                          ? 'text-green-600'
                          : record.completion_rate >= 80
                            ? 'text-blue-600'
                            : record.completion_rate >= 50
                              ? 'text-yellow-600'
                              : 'text-red-600'
                      }`}
                    >
                      {record.completion_rate}%
                    </span>
                  </div>
                </div>

                <div className='relative'>
                  <div className='h-6 bg-gray-100 rounded-full overflow-hidden'>
                    <div
                      className={`h-full transition-all duration-500 ease-out ${
                        record.completion_rate >= 100
                          ? 'bg-green-500'
                          : record.completion_rate >= 80
                            ? 'bg-blue-500'
                            : record.completion_rate >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.min((record.completion_rate / maxValue) * 100, 100)}%`,
                      }}
                    />
                  </div>

                  {/* 목표선 (100%) */}
                  {maxValue > 100 && (
                    <div
                      className='absolute top-0 h-6 w-0.5 bg-gray-400'
                      style={{ left: `${(100 / maxValue) * 100}%` }}
                    />
                  )}
                </div>

                {/* 연속 기록 표시 */}
                {record.current_streak > 0 && (
                  <div className='flex items-center space-x-1 text-xs text-orange-600'>
                    <span>🔥</span>
                    <span>{record.current_streak}일 연속</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 범례 */}
        <div className='mt-4 pt-4 border-t border-gray-200'>
          <div className='flex flex-wrap gap-4 text-xs'>
            <div className='flex items-center space-x-1'>
              <div className='w-3 h-3 bg-green-500 rounded'></div>
              <span>100% 이상</span>
            </div>
            <div className='flex items-center space-x-1'>
              <div className='w-3 h-3 bg-blue-500 rounded'></div>
              <span>80-99%</span>
            </div>
            <div className='flex items-center space-x-1'>
              <div className='w-3 h-3 bg-yellow-500 rounded'></div>
              <span>50-79%</span>
            </div>
            <div className='flex items-center space-x-1'>
              <div className='w-3 h-3 bg-red-500 rounded'></div>
              <span>50% 미만</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 간단한 미니 차트 컴포넌트 (대시보드용)
export function MiniProgressChart({
  data,
  className,
}: {
  data: ProgressTracking[];
  className?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className={`h-8 bg-gray-100 rounded ${className}`}>
        <div className='flex items-center justify-center h-full text-xs text-gray-500'>
          데이터 없음
        </div>
      </div>
    );
  }

  const sortedData = [...data]
    .sort(
      (a, b) =>
        new Date(a.week_start_date).getTime() -
        new Date(b.week_start_date).getTime()
    )
    .slice(-8); // 최근 8주

  return (
    <div className={`flex items-end space-x-1 h-8 ${className}`}>
      {sortedData.map((record, index) => (
        <div
          key={record.id || index}
          className={`flex-1 rounded-sm transition-all duration-300 ${
            record.completion_rate >= 100
              ? 'bg-green-500'
              : record.completion_rate >= 80
                ? 'bg-blue-500'
                : record.completion_rate >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
          }`}
          style={{
            height: `${Math.max((record.completion_rate / 100) * 100, 10)}%`,
          }}
          title={`${new Date(record.week_start_date).toLocaleDateString()}: ${record.completion_rate}%`}
        />
      ))}
    </div>
  );
}
