'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { GenerationPolling } from '@/components/carousel/GenerationPolling'
import { SuccessScreen } from '@/components/carousel/SuccessScreen'
import { CarouselViewer } from '@/components/carousel/CarouselViewer'
import { CarouselStatusResponse } from '@/lib/carousel/poll-status'

type PagePhase = 'loading' | 'polling' | 'success' | 'viewing' | 'error'

interface CarouselData {
  status: string
  image_urls: string[] | null
  post_body_text: string | null
  error_message: string | null
  idea_topic: string
  idea_key_points: string
  idea_tone: string
  template_url: string
  image_style: string
  created_at: string
  completed_at: string | null
}

interface CarouselPageClientProps {
  params: Promise<{ id: string }>
}

export default function CarouselPage({ params }: CarouselPageClientProps) {
  const router = useRouter()
  const [carouselId, setCarouselId] = useState<string | null>(null)
  const [phase, setPhase] = useState<PagePhase>('loading')
  const [carouselData, setCarouselData] = useState<CarouselData | null>(null)
  const [viewerData, setViewerData] = useState<CarouselStatusResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Resolve params (Next.js 15 async params)
  useEffect(() => {
    params.then(({ id }) => setCarouselId(id))
  }, [params])

  // Fetch initial carousel state once we have the ID
  useEffect(() => {
    if (!carouselId) return

    async function fetchInitialCarousel() {
      const response = await fetch(`/api/carousel/${carouselId}`)

      if (response.status === 404) {
        setErrorMessage('Carousel not found.')
        setPhase('error')
        return
      }

      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (!response.ok) {
        setErrorMessage('Failed to load carousel. Please try again.')
        setPhase('error')
        return
      }

      const data: CarouselData = await response.json()
      setCarouselData(data)

      if (data.status === 'completed') {
        // Already done — go straight to viewer
        setViewerData({
          status: 'completed',
          image_urls: data.image_urls,
          post_body_text: data.post_body_text,
          error_message: data.error_message,
          created_at: data.created_at,
          completed_at: data.completed_at,
        })
        setPhase('viewing')
      } else if (data.status === 'failed' || data.status === 'timeout') {
        setErrorMessage(
          data.error_message ??
            'Generation failed. Your credit has been refunded. Please try again.'
        )
        setPhase('error')
      } else {
        // Pending or processing — start polling
        setPhase('polling')
      }
    }

    fetchInitialCarousel().catch(() => {
      setErrorMessage('Failed to load carousel. Please refresh the page.')
      setPhase('error')
    })
  }, [carouselId, router])

  const handlePollingComplete = useCallback((data: CarouselStatusResponse) => {
    setViewerData(data)
    setPhase('success')
  }, [])

  const handlePollingError = useCallback((error: string) => {
    setErrorMessage(error)
    setPhase('error')
  }, [])

  const handleViewCarousel = useCallback(() => {
    setPhase('viewing')
  }, [])

  function handleRegenerate() {
    if (!carouselData) return
    const params = new URLSearchParams({
      topic: carouselData.idea_topic,
      keyPoints: carouselData.idea_key_points,
      tone: carouselData.idea_tone,
      templateUrl: carouselData.template_url,
      imageStyle: carouselData.image_style,
    })
    router.push(`/generate?${params.toString()}`)
  }

  // Loading state
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  // Error state
  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-8">
        <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-500 mb-6 max-w-sm">{errorMessage}</p>
        <a
          href="/dashboard"
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    )
  }

  // Polling state
  if (phase === 'polling' && carouselId) {
    return (
      <GenerationPolling
        jobId={carouselId}
        onComplete={handlePollingComplete}
        onError={handlePollingError}
      />
    )
  }

  // Success screen
  if (phase === 'success') {
    return <SuccessScreen onViewCarousel={handleViewCarousel} />
  }

  // Viewer state
  if (phase === 'viewing' && viewerData?.image_urls && viewerData.image_urls.length > 0) {
    return (
      <CarouselViewer
        imageUrls={viewerData.image_urls}
        postBodyText={viewerData.post_body_text ?? ''}
        carouselId={carouselId ?? ''}
        ideaTopic={carouselData?.idea_topic ?? 'Carousel'}
        onRegenerate={carouselData ? handleRegenerate : undefined}
      />
    )
  }

  // Fallback
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )
}
