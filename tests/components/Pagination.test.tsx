import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from '@/components/shared/Pagination';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('page=1'),
  usePathname: () => '/properties',
  useRouter: () => ({ push: vi.fn() }),
}));

describe('Pagination', () => {
  it('renders nothing if totalPages <= 1', () => {
    const { container } = render(<Pagination totalPages={1} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly with multiple pages', () => {
    render(<Pagination totalPages={5} />);

    // Check page text
    expect(screen.getByText(/Page 1 of 5/i)).toBeTruthy();

    // Check Next Page link
    const nextLink = screen.getByRole('link', { name: /Next Page/i });
    expect(nextLink).toBeTruthy();
    expect(nextLink.getAttribute('href')).toBe('/properties?page=2');

    // Check Previous Page (should be disabled/not a link because current page is 1)
    const prevLink = screen.queryByRole('link', { name: /Previous Page/i });
    expect(prevLink).toBeNull();
  });
});
