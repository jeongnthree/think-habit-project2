'use client';

import { Button, Card } from '@/components/ui';
import { Category, Comment, Journal } from '@/types/database';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// 임시 사용자 ID (실제로는 인증에서 가져와야 함)
const CURRENT_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

// 임시 일지 데이터 (실제로는 API에서 가져와야 함)
const mockJournal: Journal & { category: Category } = {
  id: 'journal1',
  student_id: CURRENT_USER_ID,
  category_id: 'category1',
  title: '비판적 사고 훈련 - 뉴스 분석',
  content: `오늘 접한 뉴스 기사에 대해 비판적으로 분석해보았습니다.

1. 이 정보의 출처는 신뢰할 만한가?
- 출처: 주요 언론사의 기사
- 기자의 전문성과 이전 보도 이력 확인
- 1차 자료와 2차 자료 구분

2. 다른 관점에서는 어떻게 볼 수 있을까?
- 반대 입장의 의견도 찾아보기
- 다양한 이해관계자의 관점 고려
- 문화적, 사회적 배경 차이 인식

3. 숨겨진 가정이나 편견은 없을까?
- 기사에서 당연하게 여기는 전제들 점검
- 언어 선택에서 드러나는 편향성 분석
- 생략된 정보나 맥락 파악

4. 결론을 내리기에 충분한 근거가 있는가?
- 제시된 증거의 질과 양 평가
- 논리적 연결고리 검토
- 추가로 필요한 정보 식별

이번 훈련을 통해 정보를 무비판적으로 받아들이지 않고, 다각도로 검토하는 습관을 기를 수 있었습니다.`,
  attachments: ['news-article-screenshot.png'],
  is_public: true,
  created_at: new Date(Date.now() - 86400000).toISOString(),
  updated_at: new Date(Date.now() - 86400000).toISOString(),
  category: {
    id: 'category1',
    name: '비판적 사고',
    description: '정보를 분석하고 평가하는 능력을 기르는 훈련',
    template: '오늘 접한 정보나 상황에 대해 다음 질문들을 생각해보세요...',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

// 임시 댓글 데이터
const mockComments: Comment[] = [
  {
    id: 'comment1',
    journal_id: 'journal1',
    author_id: 'teacher1',
    content:
      '정말 체계적으로 분석하셨네요! 특히 다양한 관점에서 바라보려는 노력이 인상적입니다. 다음에는 정보의 시간적 맥락(언제 작성되었는지, 상황이 변했는지)도 고려해보시면 더 좋을 것 같습니다.',
    comment_type: 'advice',
    created_at: new Date(Date.now() - 43200000).toISOString(), // 12시간 전
  },
  {
    id: 'comment2',
    journal_id: 'journal1',
    author_id: 'coach1',
    content:
      '비판적 사고의 핵심 요소들을 잘 적용하셨습니다! 꾸준히 이런 훈련을 계속하시면 분명 큰 발전이 있을 거예요. 화이팅! 💪',
    comment_type: 'encouragement',
    created_at: new Date(Date.now() - 21600000).toISOString(), // 6시간 전
  },
];

export default function JournalDetailPage() {
  const [journal, setJournal] = useState<
    (Journal & { category: Category }) | null
  >(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useParams();
  const router = useRouter();
  const journalId = params?.id as string;

  // 일지 및 댓글 로드
  const loadJournalData = async () => {
    try {
      setLoading(true);
      // 실제로는 API 호출
      // const [journalResponse, commentsResponse] = await Promise.all([
      //   getJournalById(journalId),
      //   getComments(journalId)
      // ]);

      // 임시 데이터 사용
      setJournal(mockJournal);
      setComments(mockComments);
    } catch (err) {
      setError('일지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJournalData();
  }, [journalId]);

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error || !journal) {
    return (
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='bg-red-50 border border-red-200 rounded-md p-4'>
          <div className='text-red-700'>
            {error || '일지를 찾을 수 없습니다.'}
          </div>
        </div>
        <div className='mt-4'>
          <Link href='/training' className='text-blue-600 hover:text-blue-800'>
            ← 훈련 페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* 네비게이션 */}
      <div className='mb-6'>
        <Link
          href='/training'
          className='text-blue-600 hover:text-blue-800 text-sm'
        >
          ← 훈련 페이지로 돌아가기
        </Link>
      </div>

      {/* 일지 헤더 */}
      <Card className='mb-8 p-6'>
        <div className='flex justify-between items-start mb-4'>
          <div className='flex-1'>
            <div className='flex items-center mb-2'>
              <span className='px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full mr-3'>
                {journal.category.name}
              </span>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  journal.is_public
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {journal.is_public ? '공개' : '비공개'}
              </span>
            </div>
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>
              {journal.title}
            </h1>
            <div className='text-sm text-gray-500'>
              작성일: {new Date(journal.created_at).toLocaleString()}
              {journal.updated_at !== journal.created_at && (
                <span className='ml-4'>
                  수정일: {new Date(journal.updated_at).toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <div className='flex space-x-2 ml-4'>
            <Link href={`/training/journal/${journal.id}/edit`}>
              <Button size='sm'>수정</Button>
            </Link>
            <Button
              size='sm'
              variant='danger'
              onClick={() => {
                if (confirm('정말 삭제하시겠습니까?')) {
                  // 삭제 로직
                  router.push('/training');
                }
              }}
            >
              삭제
            </Button>
          </div>
        </div>
      </Card>

      {/* 일지 내용 */}
      <Card className='mb-8 p-6'>
        <div className='prose max-w-none'>
          <div className='whitespace-pre-wrap text-gray-800 leading-relaxed'>
            {journal.content}
          </div>
        </div>

        {/* 첨부파일 */}
        {journal.attachments && journal.attachments.length > 0 && (
          <div className='mt-6 pt-6 border-t border-gray-200'>
            <h3 className='text-sm font-medium text-gray-900 mb-3'>첨부파일</h3>
            <div className='space-y-2'>
              {journal.attachments.map((filename, index) => (
                <div
                  key={index}
                  className='flex items-center p-2 bg-gray-50 rounded'
                >
                  <span className='text-2xl mr-3'>📎</span>
                  <span className='text-sm text-gray-700'>{filename}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* 댓글 섹션 */}
      <Card className='p-6'>
        <h2 className='text-lg font-semibold text-gray-900 mb-6'>
          피드백 ({comments.length})
        </h2>

        {comments.length > 0 ? (
          <div className='space-y-6'>
            {comments.map(comment => (
              <div key={comment.id} className='border-l-4 border-blue-200 pl-4'>
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center'>
                    <span className='font-medium text-gray-900'>
                      {comment.author_id === 'teacher1'
                        ? '김선생님'
                        : '박코치님'}
                    </span>
                    <span
                      className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        comment.comment_type === 'advice'
                          ? 'bg-blue-100 text-blue-800'
                          : comment.comment_type === 'encouragement'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {comment.comment_type === 'advice'
                        ? '조언'
                        : comment.comment_type === 'encouragement'
                          ? '격려'
                          : '질문'}
                    </span>
                  </div>
                  <span className='text-sm text-gray-500'>
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <p className='text-gray-700 leading-relaxed'>
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-8 text-gray-500'>
            <div className='text-4xl mb-2'>💬</div>
            <p>아직 피드백이 없습니다.</p>
            <p className='text-sm'>
              선생님이나 코치님의 피드백을 기다려보세요!
            </p>
          </div>
        )}
      </Card>

      {/* 관련 액션 */}
      <div className='mt-8 flex justify-center space-x-4'>
        <Link href={`/training/journals?categoryId=${journal.category_id}`}>
          <Button variant='outline'>같은 카테고리 일지 보기</Button>
        </Link>
        <Link href={`/training/journal/new?categoryId=${journal.category_id}`}>
          <Button>새 일지 작성</Button>
        </Link>
      </div>
    </div>
  );
}
