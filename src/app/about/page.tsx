'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  ChevronRight,
  FileText,
  GraduationCap,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

// 책 데이터 타입
interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  description: string;
  publishYear: string;
  category: string;
  link?: string;
}

// 교재 데이터 타입
interface Material {
  id: string;
  title: string;
  type: string;
  coverImage: string;
  description: string;
  targetAudience: string;
  downloadLink?: string;
}

// 샘플 책 데이터
const books: Book[] = [
  {
    id: 'book-1',
    title: '생각습관의 힘',
    author: '생각습관 연구소',
    coverImage: '/images/books/book-1.jpg',
    description:
      '일상에서 형성되는 생각습관이 우리의 삶에 미치는 영향과 이를 개선하는 방법을 소개합니다.',
    publishYear: '2023',
    category: '자기계발',
  },
  {
    id: 'book-2',
    title: '아이의 생각습관 길들이기',
    author: '생각습관 연구소',
    coverImage: '/images/books/book-2.jpg',
    description:
      '아이들의 건강한 생각습관 형성을 위한 부모와 교사를 위한 가이드북입니다.',
    publishYear: '2022',
    category: '교육',
  },
  {
    id: 'book-3',
    title: '생각습관 일지 작성법',
    author: '생각습관 연구소',
    coverImage: '/images/books/book-3.jpg',
    description:
      '효과적인 생각습관 일지 작성을 통해 자신의 사고 패턴을 분석하고 개선하는 방법을 안내합니다.',
    publishYear: '2024',
    category: '자기계발',
  },
  {
    id: 'book-4',
    title: '생각교육의 이론과 실제',
    author: '생각교육 아카데미',
    coverImage: '/images/books/book-4.jpg',
    description:
      '생각교육의 이론적 배경과 실제 교육 현장에서의 적용 방법을 다룬 전문 서적입니다.',
    publishYear: '2021',
    category: '교육',
  },
];

// 샘플 교재 데이터
const materials: Material[] = [
  {
    id: 'material-1',
    title: '초등학생을 위한 생각습관 워크북',
    type: '워크북',
    coverImage: '/images/materials/material-1.jpg',
    description:
      '초등학생들이 재미있게 생각습관을 기를 수 있는 활동지와 연습문제가 포함된 워크북입니다.',
    targetAudience: '초등학생',
    downloadLink: '#',
  },
  {
    id: 'material-2',
    title: '청소년 생각습관 트레이닝',
    type: '교재',
    coverImage: '/images/materials/material-2.jpg',
    description:
      '청소년들의 비판적 사고와 창의적 사고를 기르기 위한 체계적인 교육 프로그램입니다.',
    targetAudience: '중고등학생',
    downloadLink: '#',
  },
  {
    id: 'material-3',
    title: '생각습관 교사 가이드',
    type: '교사용 지침서',
    coverImage: '/images/materials/material-3.jpg',
    description:
      '교사들이 학생들의 생각습관을 효과적으로 지도할 수 있는 방법과 교수 전략을 제공합니다.',
    targetAudience: '교사',
    downloadLink: '#',
  },
  {
    id: 'material-4',
    title: '기업용 생각습관 트레이닝 키트',
    type: '트레이닝 키트',
    coverImage: '/images/materials/material-4.jpg',
    description:
      '기업 환경에서 직원들의 창의적 사고와 문제 해결 능력을 향상시키기 위한 트레이닝 자료입니다.',
    targetAudience: '기업 및 조직',
    downloadLink: '#',
  },
];

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState('about');

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* 헤더 */}
      <header className='bg-white shadow-sm'>
        <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
          <div className='flex items-center'>
            <Link href='/'>
              <Image
                src='/images/think-habit-logo.png'
                alt='생각도 습관입니다 - 생각습관 로고'
                width={180}
                height={60}
                priority
                className='object-contain'
              />
            </Link>
          </div>
          <div className='flex items-center space-x-4'>
            <Link
              href='/login'
              className='text-sm font-medium text-gray-700 hover:text-blue-600'
            >
              로그인
            </Link>
            <Link
              href='/signup'
              className='text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'
            >
              회원가입
            </Link>
          </div>
        </div>
      </header>

      {/* 페이지 제목 */}
      <div className='bg-blue-600 text-white py-12'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-col items-center text-center'>
            <h1 className='text-4xl font-bold mb-4'>생각습관과 생각교육</h1>
            <p className='text-xl max-w-3xl'>
              생각도 습관입니다. 체계적인 교육과 훈련을 통해 더 나은 생각습관을
              기를 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 탭 내비게이션 */}
      <div className='container mx-auto px-4 py-8'>
        <Tabs
          defaultValue='about'
          value={activeTab}
          onValueChange={setActiveTab}
          className='w-full'
        >
          <TabsList className='flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8'>
            <TabsTrigger value='about' className='flex-1 py-3'>
              <div className='flex items-center justify-center space-x-2'>
                <FileText className='h-5 w-5' />
                <span>소개</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value='books' className='flex-1 py-3'>
              <div className='flex items-center justify-center space-x-2'>
                <BookOpen className='h-5 w-5' />
                <span>도서</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value='materials' className='flex-1 py-3'>
              <div className='flex items-center justify-center space-x-2'>
                <GraduationCap className='h-5 w-5' />
                <span>교재</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value='team' className='flex-1 py-3'>
              <div className='flex items-center justify-center space-x-2'>
                <Users className='h-5 w-5' />
                <span>연구진</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* 소개 탭 */}
          <TabsContent value='about' className='space-y-8'>
            <div className='bg-white rounded-lg shadow-sm p-8'>
              <h2 className='text-3xl font-bold mb-6'>생각습관이란?</h2>
              <div className='prose max-w-none'>
                <p className='text-lg mb-4'>
                  생각습관은 우리가 일상적으로 사고하는 방식과 패턴을
                  의미합니다. 마치 신체적 습관처럼, 생각습관도 반복을 통해
                  형성되며 우리의 삶에 지대한 영향을 미칩니다.
                </p>
                <p className='mb-4'>
                  건강한 생각습관은 긍정적인 심리 상태, 효과적인 문제 해결 능력,
                  그리고 더 나은 인간관계로 이어집니다. 반면, 부정적인
                  생각습관은 스트레스, 불안, 우울증과 같은 정신 건강 문제를
                  야기할 수 있습니다.
                </p>
                <p>
                  생각습관은 고정된 것이 아니라 의식적인 노력과 훈련을 통해
                  변화시킬 수 있습니다. 이것이 바로 생각습관 교육과 훈련의
                  핵심입니다.
                </p>
              </div>
            </div>

            <div className='bg-white rounded-lg shadow-sm p-8'>
              <h2 className='text-3xl font-bold mb-6'>생각교육의 중요성</h2>
              <div className='prose max-w-none'>
                <p className='text-lg mb-4'>
                  생각교육은 단순한 지식 전달을 넘어, 사고 방식 자체를 개선하는
                  교육입니다. 이는 비판적 사고, 창의적 사고, 메타인지 등 다양한
                  사고 기술을 포함합니다.
                </p>
                <p className='mb-4'>
                  현대 사회에서 생각교육의 중요성은 더욱 커지고 있습니다. 빠르게
                  변화하는 세상에서 단순 암기나 기존 지식의 습득만으로는
                  충분하지 않습니다. 새로운 상황에 적응하고 복잡한 문제를
                  해결하기 위해서는 효과적인 사고 능력이 필수적입니다.
                </p>
                <p>
                  생각교육은 학교 교육뿐만 아니라 가정, 직장, 그리고 평생 학습의
                  모든 영역에서 중요한 역할을 합니다. 체계적인 생각교육을 통해
                  우리는 더 나은 의사결정을 내리고, 더 창의적인 해결책을 찾으며,
                  더 건강한 정신 상태를 유지할 수 있습니다.
                </p>
              </div>
            </div>

            <div className='bg-white rounded-lg shadow-sm p-8'>
              <h2 className='text-3xl font-bold mb-6'>생각습관 훈련 방법</h2>
              <div className='prose max-w-none'>
                <p className='text-lg mb-4'>
                  생각습관 훈련은 체계적이고 지속적인 접근이 필요합니다. 다음은
                  효과적인 생각습관 훈련 방법입니다:
                </p>
                <ol className='list-decimal pl-6 space-y-3'>
                  <li>
                    <strong>인식하기</strong>: 자신의 생각 패턴을 인식하는 것이
                    첫 단계입니다. 일지 작성을 통해 자신의 생각을 객관적으로
                    관찰하세요.
                  </li>
                  <li>
                    <strong>질문하기</strong>: 자신의 생각에 질문을 던지세요.
                    "이 생각은 사실에 기반한 것인가?", "다른 관점은 없을까?"
                    등의 질문이 도움이 됩니다.
                  </li>
                  <li>
                    <strong>대체하기</strong>: 부정적이거나 비생산적인 생각을
                    발견하면, 더 건설적인 생각으로 대체하는 연습을 하세요.
                  </li>
                  <li>
                    <strong>실천하기</strong>: 새로운 사고 방식을 일상 생활에
                    적용해보세요. 작은 상황부터 시작하여 점차 확장해 나갈 수
                    있습니다.
                  </li>
                  <li>
                    <strong>지속하기</strong>: 생각습관의 변화는 시간이
                    필요합니다. 꾸준한 연습과 인내심을 가지고 접근하세요.
                  </li>
                </ol>
                <p className='mt-4'>
                  생각습관 플랫폼은 이러한 훈련 과정을 체계적으로 지원하기 위해
                  설계되었습니다. 템플릿 기반의 일지 작성, 커뮤니티 지원, 그리고
                  개인별 맞춤 피드백을 통해 더 효과적인 생각습관 훈련이
                  가능합니다.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* 도서 탭 */}
          <TabsContent value='books' className='space-y-8'>
            <div className='bg-white rounded-lg shadow-sm p-8'>
              <h2 className='text-3xl font-bold mb-6'>생각습관 관련 도서</h2>
              <p className='text-lg mb-8'>
                생각습관과 생각교육에 관한 다양한 도서를 소개합니다. 이론적
                배경부터 실천 방법까지, 다양한 주제의 책을 통해 더 깊은 이해를
                얻을 수 있습니다.
              </p>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                {books.map(book => (
                  <div
                    key={book.id}
                    className='flex border rounded-lg overflow-hidden'
                  >
                    <div className='w-1/3 bg-gray-100 flex items-center justify-center p-4'>
                      <div className='relative w-full aspect-[3/4]'>
                        <div className='absolute inset-0 bg-gray-200 rounded flex items-center justify-center'>
                          <BookOpen className='h-12 w-12 text-gray-400' />
                        </div>
                      </div>
                    </div>
                    <div className='w-2/3 p-4'>
                      <h3 className='font-bold text-lg mb-1'>{book.title}</h3>
                      <p className='text-sm text-gray-600 mb-2'>
                        저자: {book.author}
                      </p>
                      <p className='text-sm text-gray-600 mb-3'>
                        {book.publishYear} | {book.category}
                      </p>
                      <p className='text-sm mb-3 line-clamp-3'>
                        {book.description}
                      </p>
                      {book.link && (
                        <a
                          href={book.link}
                          className='text-sm text-blue-600 hover:text-blue-800 flex items-center'
                        >
                          자세히 보기
                          <ChevronRight className='h-4 w-4 ml-1' />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className='mt-8 text-center'>
                <p className='text-gray-600 mb-4'>
                  더 많은 도서를 확인하고 싶으시다면 아래 버튼을 클릭하세요.
                </p>
                <Link
                  href='/books'
                  className='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700'
                >
                  전체 도서 보기
                </Link>
              </div>
            </div>
          </TabsContent>

          {/* 교재 탭 */}
          <TabsContent value='materials' className='space-y-8'>
            <div className='bg-white rounded-lg shadow-sm p-8'>
              <h2 className='text-3xl font-bold mb-6'>생각교육 교재</h2>
              <p className='text-lg mb-8'>
                다양한 연령대와 환경에 맞춘 생각교육 교재를 제공합니다. 학교,
                가정, 직장 등 다양한 환경에서 활용할 수 있는 교육 자료입니다.
              </p>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                {materials.map(material => (
                  <div
                    key={material.id}
                    className='flex border rounded-lg overflow-hidden'
                  >
                    <div className='w-1/3 bg-gray-100 flex items-center justify-center p-4'>
                      <div className='relative w-full aspect-[3/4]'>
                        <div className='absolute inset-0 bg-gray-200 rounded flex items-center justify-center'>
                          <GraduationCap className='h-12 w-12 text-gray-400' />
                        </div>
                      </div>
                    </div>
                    <div className='w-2/3 p-4'>
                      <h3 className='font-bold text-lg mb-1'>
                        {material.title}
                      </h3>
                      <p className='text-sm text-gray-600 mb-2'>
                        유형: {material.type}
                      </p>
                      <p className='text-sm text-gray-600 mb-3'>
                        대상: {material.targetAudience}
                      </p>
                      <p className='text-sm mb-3 line-clamp-3'>
                        {material.description}
                      </p>
                      {material.downloadLink && (
                        <a
                          href={material.downloadLink}
                          className='text-sm text-blue-600 hover:text-blue-800 flex items-center'
                        >
                          자료 다운로드
                          <ChevronRight className='h-4 w-4 ml-1' />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className='mt-8 text-center'>
                <p className='text-gray-600 mb-4'>
                  더 많은 교육 자료를 확인하고 싶으시다면 아래 버튼을
                  클릭하세요.
                </p>
                <Link
                  href='/materials'
                  className='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700'
                >
                  전체 교재 보기
                </Link>
              </div>
            </div>
          </TabsContent>

          {/* 연구진 탭 */}
          <TabsContent value='team' className='space-y-8'>
            <div className='bg-white rounded-lg shadow-sm p-8'>
              <h2 className='text-3xl font-bold mb-6'>생각습관 연구진</h2>
              <p className='text-lg mb-8'>
                생각습관과 생각교육의 이론적 기반을 연구하고 실천 방법을
                개발하는 전문가 그룹을 소개합니다.
              </p>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
                {/* 연구진 프로필 예시 */}
                <div className='flex flex-col items-center text-center'>
                  <div className='w-32 h-32 bg-gray-200 rounded-full mb-4 flex items-center justify-center'>
                    <Users className='h-16 w-16 text-gray-400' />
                  </div>
                  <h3 className='font-bold text-lg'>김교수</h3>
                  <p className='text-sm text-gray-600 mb-2'>
                    생각습관 연구소장
                  </p>
                  <p className='text-sm mb-3'>
                    인지심리학 전문가로, 20년간 생각습관 연구를 이끌어왔습니다.
                  </p>
                </div>

                <div className='flex flex-col items-center text-center'>
                  <div className='w-32 h-32 bg-gray-200 rounded-full mb-4 flex items-center justify-center'>
                    <Users className='h-16 w-16 text-gray-400' />
                  </div>
                  <h3 className='font-bold text-lg'>이박사</h3>
                  <p className='text-sm text-gray-600 mb-2'>
                    교육과정 개발 책임자
                  </p>
                  <p className='text-sm mb-3'>
                    교육학 박사로, 다양한 연령대를 위한 생각교육 프로그램을
                    개발합니다.
                  </p>
                </div>

                <div className='flex flex-col items-center text-center'>
                  <div className='w-32 h-32 bg-gray-200 rounded-full mb-4 flex items-center justify-center'>
                    <Users className='h-16 w-16 text-gray-400' />
                  </div>
                  <h3 className='font-bold text-lg'>박연구원</h3>
                  <p className='text-sm text-gray-600 mb-2'>임상 연구 책임자</p>
                  <p className='text-sm mb-3'>
                    임상심리학자로, 생각습관 훈련의 효과성을 연구합니다.
                  </p>
                </div>
              </div>

              <div className='mt-12'>
                <h3 className='text-xl font-bold mb-4'>연구 및 출판</h3>
                <ul className='space-y-3'>
                  <li className='border-b pb-3'>
                    <p className='font-medium'>
                      생각습관과 정신 건강의 상관관계 연구 (2023)
                    </p>
                    <p className='text-sm text-gray-600'>
                      한국심리학회지, 제45권, pp. 123-145
                    </p>
                  </li>
                  <li className='border-b pb-3'>
                    <p className='font-medium'>
                      청소년 생각습관 교육 프로그램의 효과성 (2022)
                    </p>
                    <p className='text-sm text-gray-600'>
                      교육연구, 제32권, pp. 78-96
                    </p>
                  </li>
                  <li className='border-b pb-3'>
                    <p className='font-medium'>
                      디지털 시대의 생각습관 변화 (2021)
                    </p>
                    <p className='text-sm text-gray-600'>
                      미래교육연구, 제18권, pp. 201-220
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 푸터 */}
      <footer className='bg-gray-800 text-gray-300 py-12 mt-12'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-col md:flex-row justify-between'>
            <div className='mb-8 md:mb-0'>
              <Image
                src='/images/think-habit-logo.png'
                alt='생각도 습관입니다 - 생각습관 로고'
                width={150}
                height={50}
                className='object-contain mb-4'
              />
              <p className='text-sm'>© 2025 생각습관. All rights reserved.</p>
              <p className='text-sm mt-1'>
                생각습관™ 및 생각습관.com™은 등록된 상표입니다.
              </p>
            </div>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-8'>
              <div>
                <h3 className='text-white font-medium mb-4'>서비스</h3>
                <ul className='space-y-2 text-sm'>
                  <li>
                    <Link href='/about' className='hover:text-white'>
                      소개
                    </Link>
                  </li>
                  <li>
                    <Link href='/features' className='hover:text-white'>
                      기능
                    </Link>
                  </li>
                  <li>
                    <Link href='/pricing' className='hover:text-white'>
                      요금제
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className='text-white font-medium mb-4'>지원</h3>
                <ul className='space-y-2 text-sm'>
                  <li>
                    <Link href='/faq' className='hover:text-white'>
                      자주 묻는 질문
                    </Link>
                  </li>
                  <li>
                    <Link href='/contact' className='hover:text-white'>
                      문의하기
                    </Link>
                  </li>
                  <li>
                    <Link href='/support' className='hover:text-white'>
                      고객 지원
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className='text-white font-medium mb-4'>법적 고지</h3>
                <ul className='space-y-2 text-sm'>
                  <li>
                    <Link href='/terms' className='hover:text-white'>
                      이용약관
                    </Link>
                  </li>
                  <li>
                    <Link href='/privacy' className='hover:text-white'>
                      개인정보처리방침
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
