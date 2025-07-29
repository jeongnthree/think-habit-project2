import { render, screen } from '@testing-library/react';
import { Card } from '../Card';

describe('Card Component', () => {
  it('renders card with children', () => {
    render(
      <Card>
        <h2>Card Title</h2>
        <p>Card content</p>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass(
      'bg-white',
      'rounded-xl',
      'shadow-sm',
      'border',
      'border-gray-200'
    );
  });

  it('applies custom className', () => {
    const { container } = render(<Card className='custom-class'>Content</Card>);
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass('custom-class');
    expect(card).toHaveClass('bg-white'); // Should still have default classes
  });

  it('forwards other props to the div element', () => {
    const { container } = render(
      <Card data-testid='test-card' role='article'>
        Content
      </Card>
    );
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveAttribute('data-testid', 'test-card');
    expect(card).toHaveAttribute('role', 'article');
  });
});
