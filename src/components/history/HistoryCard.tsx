'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Tables } from '@/types/database'
import { downloadCarouselZip } from '@/lib/carousel/download-zip'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ImageIcon, Download, Loader2, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface HistoryCardProps {
  carousel: Tables<'carousels'>
}

type CarouselStatus = Tables<'carousels'>['status']

function StatusBadge({ status }: { status: CarouselStatus }) {
  const config: Record<CarouselStatus, { label: string; className: string }> = {
    completed: {
      label: 'Completed',
      className: 'bg-green-100 text-green-700 border-green-200',
    },
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    },
    processing: {
      label: 'Processing',
      className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    failed: {
      label: 'Failed',
      className: 'bg-red-100 text-red-700 border-red-200',
    },
    timeout: {
      label: 'Timed out',
      className: 'bg-orange-100 text-orange-700 border-orange-200',
    },
  }

  const { label, className } = config[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-700',
  }

  return (
    <Badge variant="outline" className={cn('rounded-full', className)}>
      {label}
    </Badge>
  )
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString))
}

function formatImageStyle(style: string): string {
  return style
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function extractTemplateName(templateUrl: string): string {
  try {
    const url = new URL(templateUrl)
    const segments = url.pathname.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1] ?? 'Template'
    return lastSegment
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  } catch {
    return 'Template'
  }
}

export function HistoryCard({ carousel }: HistoryCardProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const firstImageUrl =
    carousel.status === 'completed' && carousel.image_urls && carousel.image_urls.length > 0
      ? carousel.image_urls[0]
      : null

  async function handleDownload() {
    if (!carousel.image_urls || carousel.image_urls.length === 0) return

    setIsDownloading(true)
    setDownloadError(null)

    try {
      await downloadCarouselZip(carousel.image_urls, carousel.idea_topic)
    } catch {
      toast.error('Download failed. Please check your connection and try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const templateName = extractTemplateName(carousel.template_url)
  const imageStyleLabel = formatImageStyle(carousel.image_style)
  const dateLabel = formatDate(carousel.created_at)

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {/* Thumbnail / Status area */}
      <div className="relative w-full aspect-video bg-muted flex-shrink-0">
        {firstImageUrl ? (
          <Image
            src={firstImageUrl}
            alt={`Carousel: ${carousel.idea_topic}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Status badge overlay */}
        <div className="absolute top-2 right-2">
          <StatusBadge status={carousel.status} />
        </div>
      </div>

      {/* Card body */}
      <CardContent className="p-4 flex flex-col flex-1">
        {/* Title */}
        <h3 className="font-semibold text-sm line-clamp-2 mb-2 flex-1">
          {carousel.idea_topic}
        </h3>

        {/* Metadata */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
          <span title="Template">{templateName}</span>
          <span title="Image style">{imageStyleLabel}</span>
          <span title="Created">{dateLabel}</span>
        </div>

        {/* Error message for failed/timeout */}
        {(carousel.status === 'failed' || carousel.status === 'timeout') &&
          carousel.error_message && (
            <p className="text-xs text-destructive mb-3 line-clamp-2">{carousel.error_message}</p>
          )}

        {/* Download error */}
        {downloadError && (
          <p className="text-xs text-destructive mb-3">{downloadError}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/carousel/${carousel.id}`}>
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              View
            </Link>
          </Button>

          {carousel.status === 'completed' && carousel.image_urls && carousel.image_urls.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Downloading
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
