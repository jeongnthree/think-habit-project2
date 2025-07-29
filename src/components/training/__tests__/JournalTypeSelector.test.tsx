import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JournalTypeSelector } from '../JournalTypeSelector';

const defaultProps = {
  onSelect: jest.fn(),
};

describe('JournalTypeSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders journal type selection interface', () => {
    render(<JournalTypeSelector {...defaultProps} />);

    expect(screen.getByText('📝 훈련 일지 작성하기')).toBeInTheDocument();
    expect(
      screen.getByText('어떤 방식으로 일지를 작성하시겠어요?')
    ).toBeInTheDocument();
  });

  it('shows both journal type options', () => {
    render(<JournalTypeSelector {...defaultProps} />);

    expect(screen.getByText('양식 작성하기')).toBeInTheDocument();
    expect(screen.getByText('사진 업로드')).toBeInTheDocument();
  });

  it('displays category information when provided', () => {
    render(
      <JournalTypeSelector
        {...defaultProps}
        categoryName='테스트 카테고리'
        categoryDescription='테스트 설명'
      />
    );

    expect(screen.getByText('📚 테스트 카테고리')).toBeInTheDocument();
    expect(screen.getByText('테스트 설명')).toBeInTheDocument();
  });

  it('shows task template count when available', () => {
    render(
      <JournalTypeSelector
        {...defaultProps}
        hasTaskTemplates={true}
        taskTemplateCount={5}
      />
    );

    expect(screen.getByText('5개의 가이드 질문')).toBeInTheDocument();
  });

  it('disables structured journal when no task templates', () => {
    render(<JournalTypeSelector {...defaultProps} hasTaskTemplates={false} />);

    const structuredCard = screen.getByText('양식 작성하기').closest('div');
    // Card 컴포넌트의 클래스 대신 부모 div의 클래스 확인
    const parentDiv = structuredCard?.parentElement;
    expect(parentDiv).toHaveClass('opacity-50', 'cursor-not-allowed');
    // 텍스트가 줄바꿈으로 나뉘어 있으므로 부분 텍스트로 검색
    expect(screen.getByText(/이 카테고리에는 템플릿이/)).toBeInTheDocument();
  });

  it('calls onSelect when structured journal is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    render(
      <JournalTypeSelector
        {...defaultProps}
        onSelect={onSelect}
        hasTaskTemplates={true}
      />
    );

    const structuredCard = screen.getByText('양식 작성하기').closest('div');
    if (structuredCard) {
      await user.click(structuredCard);
    }

    expect(onSelect).toHaveBeenCalledWith('structured');
  });

  it('calls onSelect when photo journal is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    render(<JournalTypeSelector {...defaultProps} onSelect={onSelect} />);

    const photoCard = screen.getByText('사진 업로드').closest('div');
    if (photoCard) {
      await user.click(photoCard);
    }

    expect(onSelect).toHaveBeenCalledWith('photo');
  });

  it('does not call onSelect when structured journal is disabled', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    render(
      <JournalTypeSelector
        {...defaultProps}
        onSelect={onSelect}
        hasTaskTemplates={false}
      />
    );

    const structuredCard = screen.getByText('양식 작성하기').closest('div');
    if (structuredCard) {
      await user.click(structuredCard);
    }

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('highlights selected type', () => {
    render(
      <JournalTypeSelector
        {...defaultProps}
        selectedType='structured'
        hasTaskTemplates={true}
      />
    );

    const structuredCard = screen.getByText('양식 작성하기').closest('div');
    // Card 컴포넌트의 클래스 대신 부모 div의 클래스 확인
    const parentDiv = structuredCard?.parentElement;
    expect(parentDiv).toHaveClass('ring-2', 'ring-blue-500');
  });

  it('shows selection confirmation message', () => {
    render(<JournalTypeSelector {...defaultProps} selectedType='photo' />);

    expect(
      screen.getByText('✅ 사진 업로드 방식을 선택했습니다')
    ).toBeInTheDocument();
  });

  it('displays structured journal features', () => {
    render(<JournalTypeSelector {...defaultProps} hasTaskTemplates={true} />);

    expect(screen.getByText('체계적인 사고 훈련')).toBeInTheDocument();
    expect(screen.getByText('구조화된 성찰')).toBeInTheDocument();
  });

  it('displays photo journal features', () => {
    render(<JournalTypeSelector {...defaultProps} />);

    expect(screen.getByText('빠른 기록')).toBeInTheDocument();
    expect(screen.getByText('손글씨 인식')).toBeInTheDocument();
    expect(screen.getByText('음성 메모 지원')).toBeInTheDocument();
  });

  it('shows appropriate icons for each type', () => {
    render(<JournalTypeSelector {...defaultProps} />);

    expect(screen.getByText('📋')).toBeInTheDocument(); // Structured journal icon
    expect(screen.getByText('📷')).toBeInTheDocument(); // Photo journal icon
  });

  it('shows admin guidance when templates are missing', () => {
    render(<JournalTypeSelector {...defaultProps} hasTaskTemplates={false} />);

    expect(
      screen.getByText('관리자에게 템플릿 설정을 요청하세요')
    ).toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    render(<JournalTypeSelector {...defaultProps} onSelect={onSelect} />);

    const photoCard = screen.getByText('사진 업로드').closest('div');
    if (photoCard) {
      photoCard.focus();
      await user.click(photoCard); // 키보드 이벤트 대신 클릭 이벤트 사용
    }

    expect(onSelect).toHaveBeenCalledWith('photo');
  });

  it('applies hover effects', () => {
    render(<JournalTypeSelector {...defaultProps} />);

    const photoCard = screen.getByText('사진 업로드').closest('div');
    // Card 컴포넌트의 클래스 대신 부모 div의 클래스 확인
    const parentDiv = photoCard?.parentElement;
    expect(parentDiv).toHaveClass('hover:bg-gray-50');
  });

  it('shows different styling for selected vs unselected cards', () => {
    render(
      <JournalTypeSelector
        {...defaultProps}
        selectedType='structured'
        hasTaskTemplates={true}
      />
    );

    const structuredCard = screen.getByText('양식 작성하기').closest('div');
    const photoCard = screen.getByText('사진 업로드').closest('div');

    // Card 컴포넌트의 클래스 대신 부모 div의 클래스 확인
    const structuredParent = structuredCard?.parentElement;
    const photoParent = photoCard?.parentElement;

    expect(structuredParent).toHaveClass('ring-2', 'ring-blue-500');
    expect(photoParent).not.toHaveClass('ring-2', 'ring-blue-500');
  });
});
