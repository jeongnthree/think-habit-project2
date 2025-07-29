import { HelpCircle } from 'lucide-react';
import { useState } from 'react';

export default function CommunityHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className='p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-colors'
        aria-label='커뮤니티 도움말'
      >
        <HelpCircle className='w-5 h-5' />
      </button>

      {isOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-lg mx-4'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              커뮤니티 이용 안내
            </h3>

            <div className='space-y-4 text-sm'>
              <div>
                <h4 className='font-medium text-gray-900 mb-1'>
                  공개 일지 보기
                </h4>
                <p className='text-gray-600'>
                  다른 학습자들이 공개한 훈련 일지를 볼 수 있습니다.
                  카테고리별로 필터링하여 원하는 주제의 일지를 찾아볼 수
                  있습니다.
                </p>
              </div>

              <div>
                <h4 className='font-medium text-gray-900 mb-1'>댓글 작성</h4>
                <p className='text-gray-600'>
                  일지에 댓글을 작성하여 의견을 나눌 수 있습니다. 댓글 유형을
                  선택하여 일반 댓글, 격려, 조언, 질문 등 다양한 형태로 소통할
                  수 있습니다.
                </p>
              </div>

              <div>
                <h4 className='font-medium text-gray-900 mb-1'>격려하기</h4>
                <p className='text-gray-600'>
                  다른 학습자의 일지에 격려 버튼을 클릭하여 응원의 마음을 전할
                  수 있습니다. 격려는 언제든지 취소할 수 있습니다.
                </p>
              </div>

              <div>
                <h4 className='font-medium text-gray-900 mb-1'>
                  부적절한 콘텐츠 신고
                </h4>
                <p className='text-gray-600'>
                  부적절한 내용이 포함된 일지나 댓글을 발견하면 신고 기능을
                  이용해주세요. 관리자가 검토 후 적절한 조치를 취할 것입니다.
                </p>
              </div>

              <div>
                <h4 className='font-medium text-gray-900 mb-1'>
                  내 일지 공개하기
                </h4>
                <p className='text-gray-600'>
                  훈련 일지 작성 시 '공개' 옵션을 선택하면 커뮤니티에 일지가
                  공개됩니다. 언제든지 공개 설정을 변경할 수 있습니다.
                </p>
              </div>
            </div>

            <div className='mt-6 flex justify-end'>
              <button
                onClick={() => setIsOpen(false)}
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors'
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
