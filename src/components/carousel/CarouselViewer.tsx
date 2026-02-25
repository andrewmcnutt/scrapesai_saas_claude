'use client'

import { useState, useCallback } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Thumbs, FreeMode } from 'swiper/modules'
import type { Swiper as SwiperClass } from 'swiper'
import { downloadCarouselZip } from '@/lib/carousel/download-zip'

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
      alert('Failed to download ZIP. Please try again.')
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
        <h2 className="text-xl font-semibold text-gray-900 truncate max-w-md">
          {ideaTopic}
        </h2>
        <span className="text-sm text-gray-500 ml-4 shrink-0">
          {activeIndex + 1} / {imageUrls.length}
        </span>
      </div>

      {/* Main slide viewer */}
      <div className="relative rounded-lg overflow-hidden bg-gray-100 shadow-sm">
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
      <div className="rounded-lg overflow-hidden bg-gray-50 p-2">
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
                    ? 'border-blue-600 opacity-100'
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
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            LinkedIn Post
          </h3>
          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
          >
            {copySuccess ? (
              <>
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {postBodyText}
        </p>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleDownloadZip}
          disabled={isDownloading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isDownloading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download ZIP
            </>
          )}
        </button>

        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Regenerate
          </button>
        )}
      </div>
    </div>
  )
}
