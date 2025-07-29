import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';

export default function EducationPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* 헤더 섹션 */}
        <div className='text-center mb-16 animate-fade-in'>
          <h1 className='text-5xl font-light text-neutral-900 mb-6'>
            생각습관{' '}
            <span className='font-semibold text-primary-600'>교육</span>
          </h1>
          <p className='text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed'>
            아픈 생각습관을 건강한 생각습관으로 바꾸는 체계적인 교육
            프로그램입니다. 수영을 배우듯 단계별로 훈련하여 생각의 근육을
            키워보세요.
          </p>
        </div>

        {/* 생각습관이란? */}
        <section className='mb-20'>
          <Card variant='elevated' shadow='md' className='overflow-hidden'>
            <div className='grid md:grid-cols-2 gap-0'>
              <div className='p-8 lg:p-12'>
                <h2 className='text-3xl font-semibold text-neutral-900 mb-6'>
                  생각습관이란?
                </h2>
                <div className='space-y-4 text-neutral-700'>
                  <p className='text-lg'>
                    생각습관은 우리가 일상에서 자동으로 하는 사고 패턴입니다.
                    마치 걷기나 숨쉬기처럼 의식하지 않고 반복되는 생각의
                    방식이죠.
                  </p>
                  <p>
                    <strong className='text-primary-600'>
                      건강한 생각습관
                    </strong>
                    은 문제를 객관적으로 바라보고, 균형잡힌 판단을 하며,
                    건설적인 해결책을 찾는 사고 방식입니다.
                  </p>
                  <p>
                    <strong className='text-red-600'>아픈 생각습관</strong>은
                    극단적 사고, 부정적 추론, 자기비난 등으로 스트레스와 불안을
                    증가시키는 사고 패턴입니다.
                  </p>
                </div>
              </div>
              <div className='bg-gradient-to-br from-primary-50 to-secondary-50 p-8 lg:p-12 flex items-center justify-center'>
                <div className='text-center'>
                  <div className='w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-soft mx-auto'>
                    <svg
                      className='w-16 h-16 text-primary-600'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
                      />
                    </svg>
                  </div>
                  <p className='text-lg font-medium text-neutral-700'>
                    생각도 습관입니다
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* 아픈 생각습관 유형들 */}
        <section className='mb-20'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-semibold text-neutral-900 mb-4'>
              주요 아픈 생각습관 유형
            </h2>
            <p className='text-lg text-neutral-600'>
              다음과 같은 생각 패턴들이 우리의 마음을 아프게 합니다
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[
              {
                title: '완벽주의',
                description: '완벽하지 않으면 의미없다고 생각하는 패턴',
                icon: '🎯',
                color: 'red',
                examples: [
                  '100점이 아니면 실패',
                  '실수는 용납할 수 없다',
                  '완벽하게 할 수 없다면 시작하지 않는다',
                ],
              },
              {
                title: '흑백논리',
                description: '모든 것을 극단적으로 판단하는 패턴',
                icon: '⚫',
                color: 'gray',
                examples: [
                  '성공 아니면 실패',
                  '좋은 사람 vs 나쁜 사람',
                  '전부 아니면 전무',
                ],
              },
              {
                title: '파국적 사고',
                description: '최악의 상황만 상상하는 패턴',
                icon: '⚡',
                color: 'yellow',
                examples: [
                  '이번엔 정말 끝이다',
                  '돌이킬 수 없는 일이 벌어질 것',
                  '모든 게 망할 것이다',
                ],
              },
              {
                title: '개인화',
                description: '모든 문제를 자신 탓으로 돌리는 패턴',
                icon: '👤',
                color: 'blue',
                examples: [
                  '내가 잘못했다',
                  '내 탓이다',
                  '내가 부족해서 그렇다',
                ],
              },
              {
                title: '감정적 추론',
                description: '감정을 사실로 받아들이는 패턴',
                icon: '💭',
                color: 'purple',
                examples: [
                  '불안하니까 위험하다',
                  '우울하니까 희망이 없다',
                  '화가 나니까 잘못된 것이다',
                ],
              },
              {
                title: '마음 읽기',
                description: '다른 사람의 생각을 추측하는 패턴',
                icon: '🔮',
                color: 'green',
                examples: [
                  '저 사람은 나를 싫어한다',
                  '분명 나를 무시하고 있다',
                  '실망했을 것이다',
                ],
              },
            ].map((habit, index) => (
              <Card
                key={index}
                variant='elevated'
                shadow='md'
                hover
                className='group'
              >
                <CardHeader>
                  <div className='text-4xl mb-3'>{habit.icon}</div>
                  <CardTitle className='text-xl group-hover:text-primary-600 transition-colors'>
                    {habit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-neutral-600 mb-4'>{habit.description}</p>
                  <div className='space-y-2'>
                    <p className='text-sm font-medium text-neutral-700'>
                      예시:
                    </p>
                    <ul className='text-sm text-neutral-600 space-y-1'>
                      {habit.examples.map((example, i) => (
                        <li key={i} className='flex items-start'>
                          <span className='text-neutral-400 mr-2'>•</span>
                          <span>"{example}"</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 교육 과정 */}
        <section className='mb-20'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-semibold text-neutral-900 mb-4'>
              체계적인 교육 과정
            </h2>
            <p className='text-lg text-neutral-600'>
              수영 강습처럼 단계별로 생각습관을 훈련합니다
            </p>
          </div>

          <div className='grid md:grid-cols-3 gap-8'>
            {[
              {
                step: '1단계',
                title: '진단 & 발견',
                description: '나의 아픈 생각습관 패턴을 정확히 파악합니다',
                icon: '🔍',
                features: [
                  '개인별 맞춤 진단',
                  '생각습관 유형 분석',
                  '구체적인 처방 제공',
                ],
              },
              {
                step: '2단계',
                title: '교육 & 이해',
                description: '왜 이런 생각을 하게 되는지 원리를 학습합니다',
                icon: '📚',
                features: [
                  '생각습관 형성 원리',
                  '인지 편향 이해',
                  '건강한 사고법 학습',
                ],
              },
              {
                step: '3단계',
                title: '훈련 & 실습',
                description: '일상에서 반복 훈련으로 새로운 습관을 만듭니다',
                icon: '💪',
                features: ['일지 작성 훈련', '실시간 피드백', '커뮤니티 지원'],
              },
            ].map((phase, index) => (
              <Card
                key={index}
                variant='elevated'
                shadow='md'
                className='text-center group hover:shadow-strong transition-all'
              >
                <CardContent className='p-8'>
                  <div className='text-5xl mb-4'>{phase.icon}</div>
                  <div className='text-sm font-medium text-primary-600 mb-2'>
                    {phase.step}
                  </div>
                  <h3 className='text-xl font-semibold text-neutral-900 mb-4'>
                    {phase.title}
                  </h3>
                  <p className='text-neutral-600 mb-6'>{phase.description}</p>
                  <ul className='space-y-2 text-sm text-neutral-700'>
                    {phase.features.map((feature, i) => (
                      <li key={i} className='flex items-center justify-center'>
                        <svg
                          className='w-4 h-4 text-secondary-600 mr-2'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className='text-center'>
          <Card
            variant='elevated'
            shadow='lg'
            className='p-12 bg-gradient-to-r from-primary-50 to-secondary-50'
          >
            <h2 className='text-3xl font-semibold text-neutral-900 mb-4'>
              지금 바로 시작해보세요
            </h2>
            <p className='text-lg text-neutral-600 mb-8 max-w-2xl mx-auto'>
              생각습관 진단부터 시작하여 체계적인 훈련으로 더 건강하고 행복한
              마음을 만들어보세요.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link href='/diagnosis'>
                <Button size='lg' className='w-full sm:w-auto'>
                  무료 진단 시작하기
                </Button>
              </Link>
              <Link href='/training'>
                <Button
                  variant='outline'
                  size='lg'
                  className='w-full sm:w-auto'
                >
                  훈련 일지 체험하기
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
