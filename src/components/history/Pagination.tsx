import Link from 'next/link'

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
      // Near the start: 1 2 3 4 ... N
      pages.push(2, 3, 4, 'ellipsis', totalPages)
    } else if (currentPage >= totalPages - 2) {
      // Near the end: 1 ... N-3 N-2 N-1 N
      pages.push('ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      // Middle: 1 ... X-1 X X+1 ... N
      pages.push('ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages)
    }

    return pages
  }

  const pages = getPageNumbers()

  const linkClass =
    'inline-flex items-center justify-center w-9 h-9 rounded-md text-sm font-medium transition-colors'
  const activeClass = 'bg-blue-600 text-white'
  const inactiveClass = 'text-gray-700 hover:bg-gray-100'
  const disabledClass = 'text-gray-300 cursor-not-allowed pointer-events-none'

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 mt-8"
    >
      {/* Previous button */}
      {currentPage <= 1 ? (
        <span className={`${linkClass} ${disabledClass}`} aria-disabled="true">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </span>
      ) : (
        <Link
          href={`/history?page=${currentPage - 1}`}
          className={`${linkClass} ${inactiveClass}`}
          aria-label="Previous page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      )}

      {/* Page numbers */}
      {pages.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span key={`ellipsis-${index}`} className={`${linkClass} text-gray-400`}>
              &hellip;
            </span>
          )
        }

        return (
          <Link
            key={page}
            href={`/history?page=${page}`}
            className={`${linkClass} ${page === currentPage ? activeClass : inactiveClass}`}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </Link>
        )
      })}

      {/* Next button */}
      {currentPage >= totalPages ? (
        <span className={`${linkClass} ${disabledClass}`} aria-disabled="true">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      ) : (
        <Link
          href={`/history?page=${currentPage + 1}`}
          className={`${linkClass} ${inactiveClass}`}
          aria-label="Next page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </nav>
  )
}
