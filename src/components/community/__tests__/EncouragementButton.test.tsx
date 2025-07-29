import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  EncouragementButton,
  EncouragementCount,
  EncouragementIndicator,
  EncouragementStats,
} from '../EncouragementButton';

const defaultProps = {
  journalId: 'journal1',
  currentUserId: 'user1',
  encouragementCount: 5,
  hasUserEncouraged: false,
  onEncourage: jest.fn(),
};

describe('EncouragementButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders encouragement button with count', () => {
    render(<EncouragementButton {...defaultProps} />);

    expect(
      screen.getByRole('button', { name: /격려하기/ })
    ).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('👏')).toBeInTheDocument();
  });

  it('shows different state when user has already encouraged', () => {
    render(<EncouragementButton {...defaultProps} hasUserEncouraged={true} />);

    // 버튼 역할과 텍스트 내용 확인
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(screen.getByText('격려함')).toBeInTheDocument();
  });

  it('handles encouragement click', async () => {
    const mockOnEncourage = jest.fn().mockResolvedValue(undefined);
    render(
      <EncouragementButton {...defaultProps} onEncourage={mockOnEncourage} />
    );

    const button = screen.getByRole('button', { name: /격려하기/ });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnEncourage).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state during encouragement', async () => {
    const mockOnEncourage = jest
      .fn()
      .mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

    render(
      <EncouragementButton {...defaultProps} onEncourage={mockOnEncourage} />
    );

    const button = screen.getByRole('button', { name: /격려하기/ });
    fireEvent.click(button);

    // Should show loading state
    expect(screen.getByText('처리 중...')).toBeInTheDocument();
    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText('처리 중...')).not.toBeInTheDocument();
    });
  });

  it('is disabled when disabled prop is true', () => {
    render(<EncouragementButton {...defaultProps} disabled={true} />);

    const button = screen.getByRole('button', { name: /격려하기/ });
    expect(button).toBeDisabled();
  });

  it('prevents multiple clicks during loading', async () => {
    const mockOnEncourage = jest
      .fn()
      .mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

    render(
      <EncouragementButton {...defaultProps} onEncourage={mockOnEncourage} />
    );

    const button = screen.getByRole('button', { name: /격려하기/ });

    // Click multiple times rapidly
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnEncourage).toHaveBeenCalledTimes(1);
    });
  });

  it('applies different sizes correctly', () => {
    const { rerender } = render(
      <EncouragementButton {...defaultProps} size='sm' />
    );
    expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-sm');

    rerender(<EncouragementButton {...defaultProps} size='lg' />);
    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-base');

    rerender(<EncouragementButton {...defaultProps} size='md' />);
    expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2', 'text-sm');
  });

  it('shows animation when encouraging', async () => {
    const mockOnEncourage = jest.fn().mockResolvedValue(undefined);
    render(
      <EncouragementButton {...defaultProps} onEncourage={mockOnEncourage} />
    );

    const button = screen.getByRole('button', { name: /격려하기/ });
    fireEvent.click(button);

    // Should have scale animation class
    expect(button).toHaveClass('scale-105');

    await waitFor(() => {
      expect(mockOnEncourage).toHaveBeenCalled();
    });
  });

  it('handles encouragement error gracefully', async () => {
    const mockOnEncourage = jest
      .fn()
      .mockRejectedValue(new Error('Network error'));
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(
      <EncouragementButton {...defaultProps} onEncourage={mockOnEncourage} />
    );

    const button = screen.getByRole('button', { name: /격려하기/ });
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error encouraging journal:',
        expect.any(Error)
      );
    });

    // Button should not be stuck in loading state
    expect(screen.queryByText('처리 중...')).not.toBeInTheDocument();
    expect(button).not.toBeDisabled();

    consoleSpy.mockRestore();
  });
});

describe('EncouragementCount', () => {
  it('renders encouragement count', () => {
    render(<EncouragementCount count={10} />);

    expect(screen.getByText('👏')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('명이 격려했습니다')).toBeInTheDocument();
  });

  it('shows user encouraged state', () => {
    render(<EncouragementCount count={5} hasUserEncouraged={true} />);

    expect(screen.getByText('(내가 격려함)')).toBeInTheDocument();
  });

  it('does not render when count is 0', () => {
    const { container } = render(<EncouragementCount count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('applies different sizes', () => {
    const { rerender } = render(<EncouragementCount count={5} size='sm' />);
    expect(screen.getByText('👏').parentElement).toHaveClass('text-xs');

    rerender(<EncouragementCount count={5} size='lg' />);
    expect(screen.getByText('👏').parentElement).toHaveClass('text-base');
  });
});

describe('EncouragementIndicator', () => {
  it('renders encouragement indicator', () => {
    render(<EncouragementIndicator count={3} hasUserEncouraged={false} />);

    expect(screen.getByText('👏')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows user encouraged state with different color', () => {
    render(<EncouragementIndicator count={3} hasUserEncouraged={true} />);

    const container = screen.getByText('👏').parentElement;
    expect(container).toHaveClass('text-blue-600');
    expect(screen.getByText('(격려함)')).toBeInTheDocument();
  });

  it('does not render when count is 0', () => {
    const { container } = render(
      <EncouragementIndicator count={0} hasUserEncouraged={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('can hide text when showText is false', () => {
    render(
      <EncouragementIndicator
        count={3}
        hasUserEncouraged={true}
        showText={false}
      />
    );

    expect(screen.getByText('👏')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText('(격려함)')).not.toBeInTheDocument();
  });
});

describe('EncouragementStats', () => {
  it('renders encouragement statistics', () => {
    render(<EncouragementStats count={7} hasUserEncouraged={false} />);

    expect(screen.getByText('👏')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('shows user encouraged indicator', () => {
    render(<EncouragementStats count={7} hasUserEncouraged={true} />);

    expect(screen.getByText('내가 격려함')).toBeInTheDocument();
    expect(screen.getByText('내가 격려함')).toHaveClass('text-blue-600');
  });

  it('applies custom className', () => {
    render(
      <EncouragementStats
        count={7}
        hasUserEncouraged={false}
        className='custom-class'
      />
    );

    // 최상위 div 요소를 찾아서 클래스 확인
    const container = screen.getByText('👏').parentElement?.parentElement;
    expect(container).toHaveClass('custom-class');
  });
});
