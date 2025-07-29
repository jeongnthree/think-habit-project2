import { Metadata } from 'next';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noIndex?: boolean;
}

const defaultSEO = {
  title: 'Think-Habit Lite',
  description: '생각하는 습관을 기르는 간단하고 효과적인 훈련 플랫폼',
  keywords: ['생각습관', '비판적사고', '창의적사고', '감정조절', '훈련', '일지'],
  image: '/og-image.png',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  type: 'website' as const,
};

export function generateMetadata({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  noIndex = false,
}: SEOProps = {}): Metadata {
  const seoTitle = title ? `${title} | ${defaultSEO.title}` : defaultSEO.title;
  const seoDescription = description || defaultSEO.description;
  const seoImage = image || defaultSEO.image;
  const seoUrl = url || defaultSEO.url;
  const seoKeywords = keywords ? [...defaultSEO.keywords, ...keywords] : defaultSEO.keywords;

  const metadata: Metadata = {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords.join(', '),
    
    // Open Graph
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: seoUrl,
      siteName: defaultSEO.title,
      images: [
        {
          url: seoImage,
          width: 1200,
          height: 630,
          alt: seoTitle,
        },
      ],
      locale: 'ko_KR',
      type: type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && type === 'article' && { authors: [author] }),
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [seoImage],
      creator: '@thinkhablite',
    },

    // 추가 메타 태그
    alternates: {
      canonical: seoUrl,
    },

    // 로봇 설정
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // 앱 관련 메타데이터
    applicationName: defaultSEO.title,
    generator: 'Next.js',
    referrer: 'origin-when-cross-origin',
    
    // 모바일 최적화
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 1,
    },

    // 아이콘
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
    },

    // 매니페스트
    manifest: '/site.webmanifest',
  };

  return metadata;
}

// 페이지별 SEO 설정
export const pageSEO = {
  dashboard: {
    title: '대시보드',
    description: '나의 훈련 진행 상황과 통계를 한눈에 확인하세요.',
    keywords: ['대시보드', '진행률', '통계'],
  },
  
  training: {
    title: '훈련',
    description: '다양한 카테고리의 생각 훈련을 통해 사고력을 기르세요.',
    keywords: ['훈련', '일지작성', '사고력'],
  },
  
  community: {
    title: '커뮤니티',
    description: '다른 학습자들과 경험을 공유하고 서로 격려해보세요.',
    keywords: ['커뮤니티', '공유', '격려'],
  },
  
  admin: {
    title: '관리',
    description: '카테고리 관리 및 학습자 할당을 관리하세요.',
    keywords: ['관리', '카테고리', '할당'],
    noIndex: true, // 관리자 페이지는 검색 엔진에 노출하지 않음
  },
};

// JSON-LD 구조화 데이터 생성
export function generateJsonLd(type: 'WebSite' | 'Article' | 'Organization', data: any) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
  };

  switch (type) {
    case 'WebSite':
      return {
        ...baseData,
        name: defaultSEO.title,
        description: defaultSEO.description,
        url: defaultSEO.url,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${defaultSEO.url}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
        ...data,
      };

    case 'Article':
      return {
        ...baseData,
        headline: data.title,
        description: data.description,
        image: data.image,
        datePublished: data.publishedTime,
        dateModified: data.modifiedTime,
        author: {
          '@type': 'Person',
          name: data.author,
        },
        publisher: {
          '@type': 'Organization',
          name: defaultSEO.title,
          logo: {
            '@type': 'ImageObject',
            url: `${defaultSEO.url}/logo.png`,
          },
        },
        ...data,
      };

    case 'Organization':
      return {
        ...baseData,
        name: defaultSEO.title,
        description: defaultSEO.description,
        url: defaultSEO.url,
        logo: `${defaultSEO.url}/logo.png`,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          availableLanguage: 'Korean',
        },
        ...data,
      };

    default:
      return baseData;
  }
}