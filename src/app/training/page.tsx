import Link from 'next/link';

export default function TrainingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      <div className="max-w-4xl mx-auto pt-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            훈련일지 📚
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            생각습관 훈련을 기록하고 성장하는 공간입니다
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-6">🏃‍♂️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            준비 중입니다
          </h2>
          <p className="text-gray-600 mb-8">
            훈련일지 기능을 열심히 개발하고 있습니다.<br />
            더 나은 훈련 경험을 위해 노력하고 있어요!
          </p>
          
          <Link 
            href="/dashboard"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}