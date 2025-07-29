import { Button, Card } from '@/components/ui';
import React from 'react';

interface DownloadCardProps {
  id: string;
  name: string;
  description: string;
  version: string;
  size: string;
  platform: string;
  icon: string;
  downloadUrl: string;
  isAvailable: boolean;
  releaseDate: string;
  onDownload: () => void;
}

export const DownloadCard: React.FC<DownloadCardProps> = ({
  name,
  description,
  version,
  size,
  platform,
  icon,
  isAvailable,
  releaseDate,
  onDownload,
}) => {
  return (
    <Card className='p-6 hover:shadow-lg transition-all duration-300 group'>
      <div className='flex items-start justify-between mb-4'>
        <div className='text-4xl group-hover:scale-110 transition-transform duration-300'>
          {icon}
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            isAvailable
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {isAvailable ? '✅ 다운로드 가능' : '🚧 개발 중'}
        </div>
      </div>

      <h3 className='text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors'>
        {name}
      </h3>

      <p className='text-gray-600 text-sm mb-4 leading-relaxed'>
        {description}
      </p>

      <div className='space-y-2 text-xs text-gray-500 mb-6'>
        <div className='flex justify-between items-center'>
          <span className='flex items-center'>
            <span className='w-2 h-2 bg-blue-500 rounded-full mr-2'></span>
            버전
          </span>
          <span className='font-medium'>{version}</span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='flex items-center'>
            <span className='w-2 h-2 bg-green-500 rounded-full mr-2'></span>
            크기
          </span>
          <span className='font-medium'>{size}</span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='flex items-center'>
            <span className='w-2 h-2 bg-purple-500 rounded-full mr-2'></span>
            플랫폼
          </span>
          <span className='font-medium'>{platform}</span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='flex items-center'>
            <span className='w-2 h-2 bg-orange-500 rounded-full mr-2'></span>
            출시일
          </span>
          <span className='font-medium'>
            {new Date(releaseDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      <Button
        onClick={onDownload}
        className={`w-full transition-all duration-300 ${
          isAvailable
            ? 'hover:shadow-lg hover:scale-105'
            : 'opacity-60 cursor-not-allowed'
        }`}
        disabled={!isAvailable}
        variant={isAvailable ? 'primary' : 'outline'}
      >
        {isAvailable ? (
          <>
            <span className='mr-2'>📥</span>
            다운로드
          </>
        ) : (
          <>
            <span className='mr-2'>🚧</span>
            개발 중
          </>
        )}
      </Button>

      {!isAvailable && (
        <p className='text-xs text-center text-gray-500 mt-2'>
          곧 출시될 예정입니다! 🚀
        </p>
      )}
    </Card>
  );
};
