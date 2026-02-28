'use client'

import { useState, useCallback } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Thumbs, FreeMode } from 'swiper/modules'
import type { Swiper as SwiperClass } from 'swiper'
import { downloadCarouselZip } from '@/lib/carousel/download-zip'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw, Copy, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/thumbs'
import 'swiper/css/free-mode'

interface CarouselViewerProps {
  imageUrls: string[]
  postBodyText: string
  carouselId: string
  ideaTopic: string
  onRegenerate?: () => void
}

export function CarouselViewer({
  imageUrls,
  postBodyText,
  carouselId,
  ideaTopic,
  onRegenerate,
}: CarouselViewerProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperClass | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const handleThumbsSwiper = useCallback((swiper: SwiperClass) => {
    setThumbsSwiper(swiper)
  }, [])

  async function handleDownloadZip() {
    setIsDownloading(true)
    try {
      await downloadCarouselZip(imageUrls, ideaTopic)
    } catch (error) {
      console.error('ZIP download failed:', error)
      toast.error('Download failed. Please check your connection and try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(postBodyText)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      console.error('Copy to clipboard failed')
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Slide counter */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold truncate max-w-md">
          {ideaTopic}
        </h2>
        <span className="text-sm text-muted-foreground ml-4 shrink-0">
          {activeIndex + 1} / {imageUrls.length}
        </span>
      </div>

      {/* Main slide viewer */}
      <div className="relative rounded-lg overflow-hidden bg-muted shadow-sm">
        <Swiper
          modules={[Navigation, Thumbs, FreeMode]}
          navigation
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          className="carousel-main-swiper"
          style={{ '--swiper-navigation-color': '#2563eb' } as React.CSSProperties}
        >
          {imageUrls.map((url, index) => (
            <SwiperSlide key={`${carouselId}-slide-${index}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Carousel slide ${index + 1}`}
                className="w-full h-auto object-contain max-h-[500px]"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Thumbnail strip */}
      <div className="rounded-lg overflow-hidden bg-muted/50 p-2">
        <Swiper
          modules={[FreeMode, Thumbs]}
          onSwiper={handleThumbsSwiper}
          spaceBetween={8}
          slidesPerView="auto"
          freeMode
          watchSlidesProgress
          className="carousel-thumbs-swiper"
        >
          {imageUrls.map((url, index) => (
            <SwiperSlide key={`${carouselId}-thumb-${index}`} style={{ width: 'auto' }}>
              <div
                className={`w-16 h-16 rounded cursor-pointer overflow-hidden border-2 transition-all ${
                  activeIndex === index
                    ? 'border-primary opacity-100'
                    : 'border-transparent opacity-60 hover:opacity-90'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Slide ${index + 1} thumbnail`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Post body text section */}
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            LinkedIn Post
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyText}
            className="gap-1.5 text-xs"
          >
            {copySuccess ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {postBodyText}
        </p>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={handleDownloadZip}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download ZIP
            </>
          )}
        </Button>

        {onRegenerate && (
          <Button variant="outline" onClick={onRegenerate}>
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </Button>
        )}
      </div>
    </div>
  )
}
