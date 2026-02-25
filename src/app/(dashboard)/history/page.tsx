import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { HistoryList } from '@/components/history/HistoryList'
import { Pagination } from '@/components/history/Pagination'
import type { Tables } from '@/types/database'

const PAGE_SIZE = 20

interface HistoryPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const resolvedParams = await searchParams
  const currentPage = Math.max(1, parseInt(resolvedParams.page ?? '1', 10) || 1)
  const offset = (currentPage - 1) * PAGE_SIZE

  const supabase = await createClient()

  // Get authenticated user (layout handles redirect if unauthenticated)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get total count for pagination
  const { count } = await supabase
    .from('carousels')
    .select('*', { count: 'exact', head: true })

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Get paginated carousels (RLS ensures only user's own carousels)
  const { data: carousels, error } = await supabase
    .from('carousels')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-red-600 text-sm">Failed to load history. Please refresh the page.</p>
      </div>
    )
  }

  const typedCarousels = (carousels ?? []) as Tables<'carousels'>[]

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Carousel History</h1>
        <p className="mt-1 text-sm text-gray-500">
          {totalCount === 0
            ? 'No carousels generated yet'
            : `${totalCount} carousel${totalCount === 1 ? '' : 's'} generated`}
        </p>
      </div>

      {/* Empty state */}
      {typedCarousels.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No carousels yet</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm">
            Create your first carousel to see it here.
          </p>
          <Link
            href="/generate"
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create your first one
          </Link>
        </div>
      ) : (
        <>
          <HistoryList carousels={typedCarousels} />
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </>
      )}
    </div>
  )
}
