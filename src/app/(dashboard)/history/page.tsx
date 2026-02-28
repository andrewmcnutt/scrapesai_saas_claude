import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { HistoryList } from '@/components/history/HistoryList'
import { Pagination } from '@/components/history/Pagination'
import type { Tables } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Archive } from 'lucide-react'

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
        <p className="text-destructive text-sm">Failed to load history. Please refresh the page.</p>
      </div>
    )
  }

  const typedCarousels = (carousels ?? []) as Tables<'carousels'>[]

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Carousel History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalCount === 0
            ? 'No carousels generated yet'
            : `${totalCount} carousel${totalCount === 1 ? '' : 's'} generated`}
        </p>
      </div>

      {/* Empty state */}
      {typedCarousels.length === 0 ? (
        <Card className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-muted">
              <Archive className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No carousels yet</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              Create your first carousel to see it here.
            </p>
            <Button asChild>
              <Link href="/generate">Create your first one</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <HistoryList carousels={typedCarousels} />
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </>
      )}
    </div>
  )
}
