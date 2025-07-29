'use client';

import Image from 'next/image';
import { useState } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  quality?: number;
}

export default function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  quality = 75,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative ${className || ''}`}>
      {!isLoaded && (
        <div
          className='absolute inset-0 bg-gray-200 animate-pulse'
          style={{ width: '100%', height: '100%' }}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        quality={quality}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}
