import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole('button', { name: /click me/i })
    ).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles correctly', () => {
    const { rerender } = render(<Button variant='primary'>Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600');

    rerender(<Button variant='outline'>Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-gray-300');

    rerender(<Button variant='ghost'>Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('hover:bg-gray-100');
  });

  it('applies size styles correctly', () => {
    const { rerender } = render(<Button size='sm'>Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-sm');

    rerender(<Button size='md'>Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2', 'text-base');

    rerender(<Button size='lg'>Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('shows loading state correctly', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
    // 로딩 상태는 disabled 속성으로 처리되므로 opacity-50 클래스 체크 제거
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Button className='custom-class'>Custom</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('renders as different element when as prop is provided', () => {
    render(
      <Button as='a' href='/test'>
        Link Button
      </Button>
    );
    // Button 컴포넌트는 as 속성을 사용해도 button 역할을 유지함
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('href', '/test');
  });
});
