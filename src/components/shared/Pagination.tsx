'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  totalPages: number;
  className?: string;
}

export function Pagination({ totalPages, className }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get('page')) || 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center gap-2 justify-center py-8", className)}>
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage <= 1}
        asChild={currentPage > 1}
      >
        {currentPage <= 1 ? (
          <span aria-disabled="true"><ChevronLeft className="h-4 w-4" /></span>
        ) : (
          <Link href={createPageURL(currentPage - 1)} aria-label="Previous Page">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        )}
      </Button>

      <span className="text-sm font-medium mx-4 text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="icon"
        disabled={currentPage >= totalPages}
        asChild={currentPage < totalPages}
      >
        {currentPage >= totalPages ? (
          <span aria-disabled="true"><ChevronRight className="h-4 w-4" /></span>
        ) : (
          <Link href={createPageURL(currentPage + 1)} aria-label="Next Page">
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </Button>
    </div>
  );
}
