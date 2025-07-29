import Link from 'next/link';

export const metadata = {
  title: 'Think-Habit Journal 다운로드',
  description:
    '생각 습관 개선을 위한 Think-Habit Journal 애플리케이션을 다운로드하세요.',
};

export default function DownloadPage() {
  return (
    <div className='container mx-auto px-4 py-12'>
      <div className='text-center mb-12'>
        <h1 className='text-4xl font-bold mb-4'>
          Think-Habit Journal 다운로드
        </h1>
        <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
          생각 습관 개선을 위한 강력한 도구, Think-Habit Journal을 지금
          다운로드하세요. 데스크톱에서 편리하게 일지를 작성하고 관리할 수
          있습니다.
        </p>
      </div>

      <div className='grid md:grid-cols-2 gap-12 mb-16'>
        <div>
          <div className='bg-gray-100 p-6 rounded-lg shadow-md mb-8'>
            <h2 className='text-2xl font-semibold mb-4'>주요 기능</h2>
            <ul className='space-y-3'>
              <li className='flex items-start'>
                <span className='text-blue-500 mr-2'>✓</span>
                <span>
                  구조화된 일지 작성 - 템플릿 기반의 체계적인 일지 작성
                </span>
              </li>
              <li className='flex items-start'>
                <span className='text-blue-500 mr-2'>✓</span>
                <span>사진 일지 - 이미지와 함께 기록하는 시각적 일지</span>
              </li>
              <li className='flex items-start'>
                <span className='text-blue-500 mr-2'>✓</span>
                <span>오프라인 작업 - 인터넷 연결 없이도 작업 가능</span>
              </li>
              <li className='flex items-start'>
                <span className='text-blue-500 mr-2'>✓</span>
                <span>
                  자동 동기화 - 온라인 상태가 되면 자동으로 데이터 동기화
                </span>
              </li>
              <li className='flex items-start'>
                <span className='text-blue-500 mr-2'>✓</span>
                <span>진행 상황 추적 - 직관적인 차트와 통계로 성장 확인</span>
              </li>
              <li className='flex items-start'>
                <span className='text-blue-500 mr-2'>✓</span>
                <span>데스크톱 알림 - 일지 작성 시간 알림 기능</span>
              </li>
            </ul>
          </div>

          <div className='bg-gray-100 p-6 rounded-lg shadow-md'>
            <h2 className='text-2xl font-semibold mb-4'>시스템 요구사항</h2>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <h3 className='font-medium mb-2'>Windows</h3>
                <ul className='text-sm space-y-1'>
                  <li>Windows 10 이상</li>
                  <li>4GB RAM</li>
                  <li>500MB 디스크 공간</li>
                </ul>
              </div>
              <div>
                <h3 className='font-medium mb-2'>macOS</h3>
                <ul className='text-sm space-y-1'>
                  <li>macOS 10.13 이상</li>
                  <li>4GB RAM</li>
                  <li>500MB 디스크 공간</li>
                </ul>
              </div>
              <div>
                <h3 className='font-medium mb-2'>Linux</h3>
                <ul className='text-sm space-y-1'>
                  <li>Ubuntu 18.04 이상</li>
                  <li>4GB RAM</li>
                  <li>500MB 디스크 공간</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className='bg-white p-8 rounded-lg shadow-lg border border-gray-200'>
            <h2 className='text-2xl font-semibold mb-6 text-center'>
              다운로드
            </h2>

            <div className='space-y-6'>
              <div className='p-4 border rounded-lg hover:bg-gray-50 transition-colors'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <div className='mr-4 text-3xl'>🪟</div>
                    <div>
                      <h3 className='font-medium'>Windows</h3>
                      <p className='text-sm text-gray-500'>Windows 10 이상</p>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <a
                      href='/api/downloads/think-habit-journal-setup-1.0.0.exe'
                      className='block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition-colors'
                    >
                      설치 프로그램 (.exe)
                    </a>
                    <a
                      href='/api/downloads/think-habit-journal-portable-1.0.0.exe'
                      className='block w-full px-4 py-2 bg-gray-200 text-gray-800 text-center rounded-md hover:bg-gray-300 transition-colors'
                    >
                      포터블 버전
                    </a>
                  </div>
                </div>
              </div>

              <div className='p-4 border rounded-lg hover:bg-gray-50 transition-colors'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <div className='mr-4 text-3xl'>🍎</div>
                    <div>
                      <h3 className='font-medium'>macOS</h3>
                      <p className='text-sm text-gray-500'>macOS 10.13 이상</p>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <a
                      href='/api/downloads/think-habit-journal-1.0.0.dmg'
                      className='block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition-colors'
                    >
                      DMG 파일
                    </a>
                    <a
                      href='/api/downloads/think-habit-journal-1.0.0-mac.zip'
                      className='block w-full px-4 py-2 bg-gray-200 text-gray-800 text-center rounded-md hover:bg-gray-300 transition-colors'
                    >
                      ZIP 아카이브
                    </a>
                  </div>
                </div>
              </div>

              <div className='p-4 border rounded-lg hover:bg-gray-50 transition-colors'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <div className='mr-4 text-3xl'>🐧</div>
                    <div>
                      <h3 className='font-medium'>Linux</h3>
                      <p className='text-sm text-gray-500'>
                        Ubuntu, Debian, Fedora
                      </p>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <a
                      href='/api/downloads/think-habit-journal-1.0.0.AppImage'
                      className='block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition-colors'
                    >
                      AppImage
                    </a>
                    <a
                      href='/api/downloads/think-habit-journal-1.0.0.deb'
                      className='block w-full px-4 py-2 bg-gray-200 text-gray-800 text-center rounded-md hover:bg-gray-300 transition-colors'
                    >
                      DEB 패키지
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className='mt-8 text-center text-sm text-gray-500'>
              <p>버전 1.0.0 | 업데이트: 2025년 7월 23일</p>
              <p className='mt-2'>
                <Link
                  href='/release-notes'
                  className='text-blue-600 hover:underline'
                >
                  릴리스 노트 보기
                </Link>
              </p>
            </div>
          </div>

          <div className='mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200'>
            <h3 className='text-lg font-medium mb-3 text-blue-800'>
              설치 가이드
            </h3>
            <p className='mb-4'>
              설치에 도움이 필요하신가요? 아래 링크에서 자세한 설치 가이드를
              확인하세요:
            </p>
            <div className='space-y-2'>
              <Link
                href='/guides/windows-installation'
                className='block text-blue-600 hover:underline'
              >
                Windows 설치 가이드
              </Link>
              <Link
                href='/guides/macos-installation'
                className='block text-blue-600 hover:underline'
              >
                macOS 설치 가이드
              </Link>
              <Link
                href='/guides/linux-installation'
                className='block text-blue-600 hover:underline'
              >
                Linux 설치 가이드
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-gray-100 p-8 rounded-lg'>
        <h2 className='text-2xl font-semibold mb-6 text-center'>스크린샷</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-white p-2 rounded shadow-md'>
            <div className='aspect-w-16 aspect-h-9 bg-gray-200 rounded'>
              {/* 실제 이미지로 교체 필요 */}
              <div className='w-full h-48 bg-gray-300 rounded flex items-center justify-center'>
                <span className='text-gray-600'>일지 작성 화면</span>
              </div>
            </div>
            <p className='mt-2 text-center text-sm'>구조화된 일지 작성 화면</p>
          </div>
          <div className='bg-white p-2 rounded shadow-md'>
            <div className='aspect-w-16 aspect-h-9 bg-gray-200 rounded'>
              {/* 실제 이미지로 교체 필요 */}
              <div className='w-full h-48 bg-gray-300 rounded flex items-center justify-center'>
                <span className='text-gray-600'>사진 일지 화면</span>
              </div>
            </div>
            <p className='mt-2 text-center text-sm'>사진 일지 작성 화면</p>
          </div>
          <div className='bg-white p-2 rounded shadow-md'>
            <div className='aspect-w-16 aspect-h-9 bg-gray-200 rounded'>
              {/* 실제 이미지로 교체 필요 */}
              <div className='w-full h-48 bg-gray-300 rounded flex items-center justify-center'>
                <span className='text-gray-600'>대시보드 화면</span>
              </div>
            </div>
            <p className='mt-2 text-center text-sm'>진행 상황 대시보드</p>
          </div>
        </div>
      </div>

      <div className='mt-12 text-center'>
        <h2 className='text-2xl font-semibold mb-4'>문제가 있으신가요?</h2>
        <p className='mb-6'>
          설치나 사용 중 문제가 발생하면 언제든지 문의해 주세요.
        </p>
        <div className='flex justify-center space-x-4'>
          <Link
            href='/support'
            className='px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
          >
            지원 받기
          </Link>
          <Link
            href='/faq'
            className='px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors'
          >
            자주 묻는 질문
          </Link>
        </div>
      </div>
    </div>
  );
}
