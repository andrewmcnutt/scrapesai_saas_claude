'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Tables } from '@/types/database'
import { downloadCarouselZip } from '@/lib/carousel/download-zip'

interface HistoryCardProps {
  carousel: Tables<'carousels'>
}

type CarouselStatus = Tables<'carousels'>['status']

function StatusBadge({ status }: { status: CarouselStatus }) {
  const config: Record<CarouselStatus, { label: string; className: string }> = {
    completed: {
      label: 'Completed',
      className: 'bg-green-100 text-green-700',
    },
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-700',
    },
    processing: {
      label: 'Processing',
      className: 'bg-blue-100 text-blue-700',
    },
    failed: {
      label: 'Failed',
      className: 'bg-red-100 text-red-700',
    },
    timeout: {
      label: 'Timed out',
      className: 'bg-orange-100 text-orange-700',
    },
  }

  const { label, className } = config[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-700',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {label}
    </span>
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
  // Convert snake_case or camelCase to Title Case
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
    // Remove file extension and format
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
      setDownloadError('Download failed. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const templateName = extractTemplateName(carousel.template_url)
  const imageStyleLabel = formatImageStyle(carousel.image_style)
  const dateLabel = formatDate(carousel.created_at)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {/* Thumbnail / Status area */}
      <div className="relative w-full aspect-video bg-gray-100 flex-shrink-0">
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
            <svg
              className="w-12 h-12 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Status badge overlay */}
        <div className="absolute top-2 right-2">
          <StatusBadge status={carousel.status} />
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 flex-1">
          {carousel.idea_topic}
        </h3>

        {/* Metadata */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
          <span title="Template">{templateName}</span>
          <span title="Image style">{imageStyleLabel}</span>
          <span title="Created">{dateLabel}</span>
        </div>

        {/* Error message for failed/timeout */}
        {(carousel.status === 'failed' || carousel.status === 'timeout') &&
          carousel.error_message && (
            <p className="text-xs text-red-500 mb-3 line-clamp-2">{carousel.error_message}</p>
          )}

        {/* Download error */}
        {downloadError && (
          <p className="text-xs text-red-500 mb-3">{downloadError}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
          <Link
            href={`/carousel/${carousel.id}`}
            className="flex-1 text-center px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            View
          </Link>

          {carousel.status === 'completed' && carousel.image_urls && carousel.image_urls.length > 0 && (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <>
                  <svg
                    className="w-3.5 h-3.5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Downloading
                </>
              ) : (
                <>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
