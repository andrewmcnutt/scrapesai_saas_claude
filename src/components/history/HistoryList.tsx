import type { Tables } from '@/types/database'
import { HistoryCard } from './HistoryCard'

interface HistoryListProps {
  carousels: Tables<'carousels'>[]
}

export function HistoryList({ carousels }: HistoryListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {carousels.map((carousel) => (
        <HistoryCard key={carousel.id} carousel={carousel} />
      ))}
    </div>
  )
}
