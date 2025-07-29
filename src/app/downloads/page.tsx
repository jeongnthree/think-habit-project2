'use client';

import { Button, Card } from '@/components/ui';
import { useState } from 'react';

interface DownloadItem {
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
}

export default function DownloadsPage() {
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'mobile' | 'desktop' | 'browser'
  >('all');

  // 다운로드 가능한 앱/위젯 목록
  const downloadItems: DownloadItem[] = [
    // 모바일 앱
    {
      id: 'android-app',
      name: 'Think-Habit 안드로이드',
      description: '언제 어디서나 훈련 일지를 작성하고 커뮤니티와 소통하세요',
      version: 'v1.0.0',
      size: '25MB',
      platform: 'Android 8.0+',
      icon: '📱',
      downloadUrl: '/downloads/think-habit-android.apk',
      isAvailable: true, // 테스트용 활성화
      releaseDate: '2024-02-01',
    },
    {
      id: 'ios-app',
      name: 'Think-Habit iOS',
      description: 'iPhone과 iPad에서 편리하게 사고력 훈련을 진행하세요',
      version: 'v1.0.0',
      size: '30MB',
      platform: 'iOS 14.0+',
      icon: '🍎',
      downloadUrl: 'https://apps.apple.com/app/think-habit',
      isAvailable: true, // 테스트용 활성화
      releaseDate: '2024-02-15',
    },

    // 데스크톱 위젯
    {
      id: 'windows-widget',
      name: 'Think-Habit 윈도우 위젯',
      description: 'PC에서 항상 접근 가능한 데스크톱 위젯으로 빠른 일지 작성',
      version: 'v1.0.0',
      size: '15MB',
      platform: 'Windows 10/11',
      icon: '🖥️',
      downloadUrl: '/downloads/think-habit-windows.exe',
      isAvailable: true,
      releaseDate: '2024-01-20',
    },
    {
      id: 'mac-widget',
      name: 'Think-Habit 맥 위젯',
      description: 'macOS에서 메뉴바에 상주하는 편리한 위젯',
      version: 'v1.0.0',
      size: '12MB',
      platform: 'macOS 11.0+',
      icon: '💻',
      downloadUrl: '/downloads/think-habit-mac.dmg',
      isAvailable: true,
      releaseDate: '2024-01-25',
    },
    
    // 그룹 위젯
    {
      id: 'desktop-group-widget',
      name: 'Think-Habit 그룹 위젯',
      description: '팀과 함께 사용하는 데스크톱 그룹 활동 위젯. 실시간 활동 피드와 리더보드 제공',
      version: 'v1.0.0',
      size: '18MB',
      platform: 'Windows/Mac/Linux',
      icon: '👥',
      downloadUrl: '/downloads/think-habit-group-widget.zip',
      isAvailable: true,
      releaseDate: '2024-02-20',
    },

    // 브라우저 확장
    {
      id: 'chrome-extension',
      name: 'Think-Habit 크롬 확장',
      description: '웹서핑 중 바로 생각을 기록할 수 있는 브라우저 확장',
      version: 'v1.0.0',
      size: '2MB',
      platform: 'Chrome 90+',
      icon: '🌐',
      downloadUrl: 'https://chrome.google.com/webstore/detail/think-habit',
      isAvailable: true,
      releaseDate: '2024-01-15',
    },
    {
      id: 'firefox-extension',
      name: 'Think-Habit 파이어폭스 확장',
      description: 'Firefox에서 사용할 수 있는 생각 기록 도구',
      version: 'v1.0.0',
      size: '2MB',
      platform: 'Firefox 85+',
      icon: '🦊',
      downloadUrl: 'https://addons.mozilla.org/addon/think-habit',
      isAvailable: false, // 개발 중
      releaseDate: '2024-02-10',
    },
  ];

  // 카테고리별 필터링
  const filteredItems = downloadItems.filter(item => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'mobile')
      return ['android-app', 'ios-app'].includes(item.id);
    if (selectedCategory === 'desktop')
      return ['windows-widget', 'mac-widget', 'desktop-group-widget'].includes(item.id);
    if (selectedCategory === 'browser')
      return ['chrome-extension', 'firefox-extension'].includes(item.id);
    return true;
  });

  // 다운로드 처리
  const handleDownload = (item: DownloadItem) => {
    if (!item.isAvailable) {
      alert(
        '아직 개발 중인 앱입니다. 곧 출시될 예정이니 조금만 기다려주세요! 🚀'
      );
      return;
    }

    // 실제 다운로드 로직
    if (item.downloadUrl.startsWith('http')) {
      window.open(item.downloadUrl, '_blank');
    } else {
      // 로컬 파일 다운로드
      const link = document.createElement('a');
      link.href = item.downloadUrl;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* 헤더 */}
      <div className='text-center mb-12'>
        <h1 className='text-4xl font-bold text-gray-900 mb-4'>
          📱 Think-Habit 다운로드
        </h1>
        <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
          언제 어디서나 사고력 훈련을 할 수 있도록 다양한 플랫폼용 앱과 위젯을
          제공합니다
        </p>
      </div>

      {/* 통계 */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-12'>
        <Card className='p-6 text-center'>
          <div className='text-3xl font-bold text-blue-600 mb-2'>50,000+</div>
          <div className='text-gray-600'>총 다운로드</div>
        </Card>
        <Card className='p-6 text-center'>
          <div className='text-3xl font-bold text-green-600 mb-2'>4.8★</div>
          <div className='text-gray-600'>평균 평점</div>
        </Card>
        <Card className='p-6 text-center'>
          <div className='text-3xl font-bold text-purple-600 mb-2'>6개</div>
          <div className='text-gray-600'>지원 플랫폼</div>
        </Card>
      </div>

      {/* 카테고리 필터 */}
      <div className='flex flex-wrap justify-center gap-4 mb-8'>
        {[
          { key: 'all', label: '전체', icon: '📦' },
          { key: 'mobile', label: '모바일 앱', icon: '📱' },
          { key: 'desktop', label: '데스크톱 위젯', icon: '🖥️' },
          { key: 'browser', label: '브라우저 확장', icon: '🌐' },
        ].map(category => (
          <button
            key={category.key}
            onClick={() => setSelectedCategory(category.key as any)}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              selectedCategory === category.key
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.icon} {category.label}
          </button>
        ))}
      </div>

      {/* 다운로드 아이템들 */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12'>
        {filteredItems.map(item => (
          <Card key={item.id} className='p-6 hover:shadow-lg transition-shadow'>
            <div className='flex items-start justify-between mb-4'>
              <div className='text-4xl'>{item.icon}</div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.isAvailable
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {item.isAvailable ? '다운로드 가능' : '개발 중'}
              </div>
            </div>

            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              {item.name}
            </h3>

            <p className='text-gray-600 text-sm mb-4'>{item.description}</p>

            <div className='space-y-2 text-xs text-gray-500 mb-4'>
              <div className='flex justify-between'>
                <span>버전:</span>
                <span>{item.version}</span>
              </div>
              <div className='flex justify-between'>
                <span>크기:</span>
                <span>{item.size}</span>
              </div>
              <div className='flex justify-between'>
                <span>플랫폼:</span>
                <span>{item.platform}</span>
              </div>
              <div className='flex justify-between'>
                <span>출시일:</span>
                <span>{new Date(item.releaseDate).toLocaleDateString()}</span>
              </div>
            </div>

            <Button
              onClick={() => handleDownload(item)}
              className='w-full'
              disabled={!item.isAvailable}
              variant={item.isAvailable ? 'primary' : 'outline'}
            >
              {item.isAvailable ? '📥 다운로드' : '🚧 개발 중'}
            </Button>
          </Card>
        ))}
      </div>

      {/* 사용 가이드 */}
      <Card className='p-8 bg-gradient-to-r from-blue-50 to-purple-50'>
        <h2 className='text-2xl font-bold text-gray-900 mb-6 text-center'>
          📚 사용 가이드
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='text-center'>
            <div className='text-3xl mb-3'>1️⃣</div>
            <h3 className='font-semibold mb-2'>다운로드</h3>
            <p className='text-sm text-gray-600'>
              원하는 플랫폼의 앱을 다운로드하고 설치하세요
            </p>
          </div>

          <div className='text-center'>
            <div className='text-3xl mb-3'>2️⃣</div>
            <h3 className='font-semibold mb-2'>로그인</h3>
            <p className='text-sm text-gray-600'>
              웹사이트와 동일한 계정으로 로그인하세요
            </p>
          </div>

          <div className='text-center'>
            <div className='text-3xl mb-3'>3️⃣</div>
            <h3 className='font-semibold mb-2'>동기화</h3>
            <p className='text-sm text-gray-600'>
              모든 기기에서 일지가 자동으로 동기화됩니다
            </p>
          </div>
        </div>
      </Card>

      {/* FAQ */}
      <div className='mt-12'>
        <h2 className='text-2xl font-bold text-gray-900 mb-6 text-center'>
          ❓ 자주 묻는 질문
        </h2>

        <div className='space-y-4 max-w-3xl mx-auto'>
          <Card className='p-6'>
            <h3 className='font-semibold mb-2'>Q. 앱 사용료가 있나요?</h3>
            <p className='text-gray-600'>
              A. 웹사이트 구독 회원이라면 모든 앱을 무료로 사용할 수 있습니다.
            </p>
          </Card>

          <Card className='p-6'>
            <h3 className='font-semibold mb-2'>
              Q. 오프라인에서도 사용할 수 있나요?
            </h3>
            <p className='text-gray-600'>
              A. 네, 일지 작성은 오프라인에서도 가능하며 인터넷 연결 시 자동
              동기화됩니다.
            </p>
          </Card>

          <Card className='p-6'>
            <h3 className='font-semibold mb-2'>Q. 데이터는 안전한가요?</h3>
            <p className='text-gray-600'>
              A. 모든 데이터는 암호화되어 안전하게 보관되며, 개인정보보호정책을
              준수합니다.
            </p>
          </Card>
        </div>
      </div>

      {/* 지원 */}
      <div className='mt-12 text-center'>
        <Card className='p-8 bg-gray-50'>
          <h2 className='text-xl font-bold text-gray-900 mb-4'>
            🛠️ 도움이 필요하신가요?
          </h2>
          <p className='text-gray-600 mb-6'>
            설치나 사용 중 문제가 있으시면 언제든 문의해주세요
          </p>
          <div className='flex flex-wrap justify-center gap-4'>
            <Button variant='outline'>📧 이메일 문의</Button>
            <Button variant='outline'>💬 채팅 상담</Button>
            <Button variant='outline'>📞 전화 상담</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
