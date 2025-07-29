import Link from 'next/link';
import React from 'react';

interface DownloadButtonProps {
  className?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  className = '',
}) => {
  return (
    <Link
      href='/download'
      className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${className}`}
    >
      <svg
        xmlns='http://www.w3.org/2000/svg'
        className='h-5 w-5 mr-2'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
        />
      </svg>
      다운로드
    </Link>
  );
};

export default DownloadButton;
