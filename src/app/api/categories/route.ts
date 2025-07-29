import { NextResponse } from 'next/server';

// 임시 카테고리 데이터
const mockCategories = [
  {
    id: 'category1',
    name: '비판적 사고',
    description: '비판적으로 사고하는 능력을 키우는 훈련',
    order: 1,
  },
  {
    id: 'category2',
    name: '창의적 사고',
    description: '창의적으로 사고하는 능력을 키우는 훈련',
    order: 2,
  },
  {
    id: 'category3',
    name: '감정 조절',
    description: '감정을 인식하고 조절하는 능력을 키우는 훈련',
    order: 3,
  },
  {
    id: 'category4',
    name: '의사소통',
    description: '효과적으로 의사소통하는 능력을 키우는 훈련',
    order: 4,
  },
  {
    id: 'category5',
    name: '문제 해결',
    description: '문제를 효과적으로 해결하는 능력을 키우는 훈련',
    order: 5,
  },
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: mockCategories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
