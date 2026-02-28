import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null

  // Build page numbers to display (max 5 with ellipsis)
  function getPageNumbers(): (number | 'ellipsis')[] {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | 'ellipsis')[] = []

    // Always show first page
    pages.push(1)

    if (currentPage <= 3) {
      pages.push(2, 3, 4, 'ellipsis', totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push('ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push('ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages)
    }

    return pages
  }

  const pages = getPageNumbers()

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 mt-8"
    >
      {/* Previous button */}
      {currentPage <= 1 ? (
        <Button variant="outline" size="icon" disabled aria-disabled="true" className="h-9 w-9">
          <ChevronLeft className="w-4 h-4" />
        </Button>
      ) : (
        <Button asChild variant="outline" size="icon" className="h-9 w-9">
          <Link href={`/history?page=${currentPage - 1}`} aria-label="Previous page">
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </Button>
      )}

      {/* Page numbers */}
      {pages.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex items-center justify-center w-9 h-9 text-sm text-muted-foreground"
            >
              &hellip;
            </span>
          )
        }

        return (
          <Button
            key={page}
            asChild={page !== currentPage}
            variant={page === currentPage ? 'default' : 'outline'}
            size="icon"
            className="h-9 w-9"
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page === currentPage ? (
              <span>{page}</span>
            ) : (
              <Link href={`/history?page=${page}`}>
                {page}
              </Link>
            )}
          </Button>
        )
      })}

      {/* Next button */}
      {currentPage >= totalPages ? (
        <Button variant="outline" size="icon" disabled aria-disabled="true" className="h-9 w-9">
          <ChevronRight className="w-4 h-4" />
        </Button>
      ) : (
        <Button asChild variant="outline" size="icon" className="h-9 w-9">
          <Link href={`/history?page=${currentPage + 1}`} aria-label="Next page">
            <ChevronRight className="w-4 h-4" />
          </Link>
        </Button>
      )}
    </nav>
  )
}
