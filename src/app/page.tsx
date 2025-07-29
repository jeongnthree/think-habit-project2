import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      {/* 미니멀 헤더 */}
      <header className='absolute top-0 w-full z-10 bg-white/80 backdrop-blur-sm'>
        <div className='container mx-auto px-6 py-4'>
          <Image
            src='/images/think-habit-logo.png'
            alt='생각도 습관입니다'
            width={160}
            height={50}
            priority
            className='object-contain'
          />
        </div>
      </header>

      {/* 히어로 섹션 - 중앙 집중 */}
      <section className='min-h-screen flex items-center justify-center px-6'>
        <div className='text-center max-w-4xl mx-auto'>
          <h1 className='text-5xl md:text-7xl font-light text-gray-900 mb-6 tracking-tight'>
            생각도 <span className='font-semibold text-blue-600'>습관</span>
            입니다
          </h1>

          <p className='text-xl md:text-2xl text-gray-600 mb-12 font-light leading-relaxed'>
            가장 부족한(아픈) 생각습관을 찾아서 구체적인 처방으로 수영 강습처럼
            훈련하세요
          </p>

          {/* 창의적인 기능 배치 - 원형 레이아웃 */}
          <div className='relative w-80 h-80 mx-auto mb-16'>
            {/* 중앙 시작 버튼 */}
            <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10'>
              <Link
                href='/dashboard'
                className='w-20 h-20 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white font-medium transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 hover:scale-110'
              >
                시작
              </Link>
            </div>

            {/* 기능들을 원형으로 배치 */}
            <Link
              href='/diagnosis'
              className='absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 group'
            >
              <div className='w-16 h-16 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110'>
                <svg
                  className='w-8 h-8 text-red-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
              </div>
              <span className='absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-sm text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                진단
              </span>
            </Link>

            <Link
              href='/training'
              className='absolute top-1/4 right-0 transform translate-x-1/2 -translate-y-1/2 group'
            >
              <div className='w-16 h-16 bg-green-100 hover:bg-green-200 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110'>
                <svg
                  className='w-8 h-8 text-green-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                  />
                </svg>
              </div>
              <span className='absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-sm text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                훈련일지
              </span>
            </Link>

            <Link
              href='/community'
              className='absolute bottom-1/4 right-0 transform translate-x-1/2 translate-y-1/2 group'
            >
              <div className='w-16 h-16 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110'>
                <svg
                  className='w-8 h-8 text-blue-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                  />
                </svg>
              </div>
              <span className='absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-sm text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                커뮤니티
              </span>
            </Link>

            <Link
              href='/admin'
              className='absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 group'
            >
              <div className='w-16 h-16 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110'>
                <svg
                  className='w-8 h-8 text-orange-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                </svg>
              </div>
              <span className='absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-sm text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                관리
              </span>
            </Link>

            <Link
              href='/education'
              className='absolute bottom-1/4 left-0 transform -translate-x-1/2 translate-y-1/2 group'
            >
              <div className='w-16 h-16 bg-indigo-100 hover:bg-indigo-200 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110'>
                <svg
                  className='w-8 h-8 text-indigo-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                  />
                </svg>
              </div>
              <span className='absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-sm text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                교육
              </span>
            </Link>

            <Link
              href='/downloads'
              className='absolute bottom-0 left-1/4 transform -translate-x-1/2 translate-y-1/2 group'
            >
              <div className='w-16 h-16 bg-green-100 hover:bg-green-200 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110'>
                <svg
                  className='w-8 h-8 text-green-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
              </div>
              <span className='absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-sm text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                다운로드
              </span>
            </Link>

            <Link
              href='/dashboard'
              className='absolute top-1/4 left-0 transform -translate-x-1/2 -translate-y-1/2 group'
            >
              <div className='w-16 h-16 bg-purple-100 hover:bg-purple-200 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110'>
                <svg
                  className='w-8 h-8 text-purple-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                  />
                </svg>
              </div>
              <span className='absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-sm text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                대시보드
              </span>
            </Link>
          </div>

          {/* 간단한 설명 */}
          <p className='text-gray-500 text-sm max-w-md mx-auto'>
            각 기능을 클릭하여 플랫폼을 체험해보세요
          </p>
        </div>
      </section>

      {/* 미니멀 푸터 */}
      <footer className='py-8 text-center text-gray-400 text-sm'>
        <p>© 2025 생각습관. All rights reserved.</p>
      </footer>
    </div>
  );
}
