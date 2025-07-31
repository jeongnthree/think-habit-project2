'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Achievement } from '@/utils/progress-calculation';
import { Award, Lock, Star } from 'lucide-react';
import { useState } from 'react';

interface AchievementBadgesProps {
  achievements: Achievement[];
  newAchievements?: Achievement[];
  showAll?: boolean;
  compact?: boolean;
}

export function AchievementBadges({
  achievements,
  newAchievements = [],
  showAll = false,
  compact = false,
}: AchievementBadgesProps) {
  const [showUnlocked, setShowUnlocked] = useState(true);

  const unlockedAchievements = achievements.filter(a => a.achieved);
  const lockedAchievements = achievements.filter(a => !a.achieved);

  if (compact) {
    return (
      <div className='space-y-2'>
        {/* 새로운 성취 알림 */}
        {newAchievements.length > 0 && (
          <div className='bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3'>
            <div className='flex items-center space-x-2'>
              <Star className='h-4 w-4 text-yellow-600' />
              <span className='text-sm font-medium text-yellow-800'>
                새로운 성취 {newAchievements.length}개 달성!
              </span>
            </div>
          </div>
        )}

        {/* 컴팩트 배지 표시 */}
        <div className='flex flex-wrap gap-2'>
          {unlockedAchievements.slice(0, 6).map(achievement => (
            <div
              key={achievement.id}
              className='flex items-center space-x-1 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-1'
              title={achievement.description}
            >
              <span className='text-sm'>{achievement.icon}</span>
              <span className='text-xs font-medium text-yellow-800'>
                {achievement.name}
              </span>
            </div>
          ))}
          {unlockedAchievements.length > 6 && (
            <Badge variant='secondary' className='text-xs'>
              +{unlockedAchievements.length - 6}개 더
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg flex items-center space-x-2'>
            <Award className='h-5 w-5' />
            <span>성취 배지</span>
          </CardTitle>
          <div className='flex space-x-2'>
            <button
              onClick={() => setShowUnlocked(true)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                showUnlocked
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              달성 ({unlockedAchievements.length})
            </button>
            {showAll && (
              <button
                onClick={() => setShowUnlocked(false)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  !showUnlocked
                    ? 'bg-gray-100 text-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                미달성 ({lockedAchievements.length})
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 새로운 성취 알림 */}
        {newAchievements.length > 0 && (
          <div className='mb-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4'>
            <div className='flex items-center space-x-2 mb-2'>
              <Star className='h-5 w-5 text-green-600' />
              <span className='font-medium text-green-800'>
                🎉 새로운 성취를 달성했습니다!
              </span>
            </div>
            <div className='grid grid-cols-1 gap-2'>
              {newAchievements.map(achievement => (
                <div
                  key={achievement.id}
                  className='flex items-center space-x-3 bg-white rounded-lg p-2 border border-green-100'
                >
                  <span className='text-2xl'>{achievement.icon}</span>
                  <div>
                    <p className='font-medium text-green-800'>
                      {achievement.name}
                    </p>
                    <p className='text-sm text-green-600'>
                      {achievement.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 성취 목록 */}
        <div className='space-y-3'>
          {showUnlocked ? (
            unlockedAchievements.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {unlockedAchievements.map(achievement => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                  />
                ))}
              </div>
            ) : (
              <div className='text-center py-8 text-gray-500'>
                <Award className='h-12 w-12 mx-auto mb-2 text-gray-300' />
                <p>아직 달성한 성취가 없습니다.</p>
                <p className='text-sm'>
                  꾸준히 일지를 작성해서 첫 성취를 달성해보세요!
                </p>
              </div>
            )
          ) : lockedAchievements.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              {lockedAchievements.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  locked
                />
              ))}
            </div>
          ) : (
            <div className='text-center py-8 text-gray-500'>
              <p>모든 성취를 달성했습니다! 🎉</p>
            </div>
          )}
        </div>

        {/* 진행률 요약 */}
        {achievements.length > 0 && (
          <div className='mt-4 pt-4 border-t border-gray-200'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-gray-600'>전체 진행률</span>
              <span className='font-medium'>
                {unlockedAchievements.length} / {achievements.length}(
                {Math.round(
                  (unlockedAchievements.length / achievements.length) * 100
                )}
                %)
              </span>
            </div>
            <div className='mt-2 h-2 bg-gray-200 rounded-full overflow-hidden'>
              <div
                className='h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500'
                style={{
                  width: `${(unlockedAchievements.length / achievements.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AchievementCard({
  achievement,
  locked = false,
}: {
  achievement: Achievement;
  locked?: boolean;
}) {
  // 희귀도에 따른 스타일 결정
  const getRarityStyle = (rarity: string, isLocked: boolean) => {
    if (isLocked) return 'bg-gray-50 border-gray-200 opacity-60';

    switch (rarity) {
      case 'legendary':
        return 'bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 border-purple-300 shadow-lg';
      case 'epic':
        return 'bg-gradient-to-br from-orange-50 via-red-50 to-orange-50 border-orange-300 shadow-md';
      case 'rare':
        return 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border-blue-300';
      case 'common':
      default:
        return 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200';
    }
  };

  const getRarityBadgeVariant = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'default';
      case 'epic':
        return 'secondary';
      case 'rare':
        return 'outline';
      case 'common':
      default:
        return 'secondary';
    }
  };

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return '전설';
      case 'epic':
        return '영웅';
      case 'rare':
        return '희귀';
      case 'common':
      default:
        return '일반';
    }
  };

  return (
    <div
      className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${getRarityStyle(achievement.rarity, locked)}`}
    >
      <div className='flex items-start space-x-3'>
        <div className='relative'>
          <span className={`text-2xl ${locked ? 'grayscale' : ''}`}>
            {achievement.icon}
          </span>
          {locked && (
            <Lock className='absolute -bottom-1 -right-1 h-3 w-3 text-gray-400 bg-white rounded-full p-0.5' />
          )}
          {!locked && achievement.rarity === 'legendary' && (
            <div className='absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse' />
          )}
        </div>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center space-x-2 flex-wrap'>
            <h4
              className={`font-medium text-sm ${
                locked
                  ? 'text-gray-600'
                  : achievement.rarity === 'legendary'
                    ? 'text-purple-800'
                    : achievement.rarity === 'epic'
                      ? 'text-orange-800'
                      : achievement.rarity === 'rare'
                        ? 'text-blue-800'
                        : 'text-yellow-800'
              }`}
            >
              {achievement.name}
            </h4>
            <Badge
              variant={getRarityBadgeVariant(achievement.rarity)}
              className='text-xs'
            >
              {getRarityText(achievement.rarity)}
            </Badge>
            <Badge variant={locked ? 'outline' : 'default'} className='text-xs'>
              {achievement.type === 'streak' && '연속'}
              {achievement.type === 'weekly' && '주간'}
              {achievement.type === 'total' && '누적'}
              {achievement.type === 'consistency' && '일관성'}
              {achievement.type === 'milestone' && '이정표'}
              {achievement.type === 'special' && '특별'}
            </Badge>
          </div>
          <p
            className={`text-xs mt-1 ${
              locked
                ? 'text-gray-500'
                : achievement.rarity === 'legendary'
                  ? 'text-purple-700'
                  : achievement.rarity === 'epic'
                    ? 'text-orange-700'
                    : achievement.rarity === 'rare'
                      ? 'text-blue-700'
                      : 'text-yellow-700'
            }`}
          >
            {achievement.description}
          </p>

          {/* 점수 표시 */}
          <div className='flex items-center justify-between mt-2'>
            <div className='flex items-center space-x-2'>
              {achievement.achievedAt && !locked && (
                <p className='text-xs text-gray-600'>
                  {new Date(achievement.achievedAt).toLocaleDateString()} 달성
                </p>
              )}
              {locked && (
                <p className='text-xs text-gray-500'>
                  목표: {achievement.threshold}
                </p>
              )}
            </div>
            <Badge variant='outline' className='text-xs'>
              {achievement.points}pt
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
