'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GenerationPolling } from '@/components/carousel/GenerationPolling'
import { SuccessScreen } from '@/components/carousel/SuccessScreen'
import { CarouselViewer } from '@/components/carousel/CarouselViewer'
import { CarouselStatusResponse } from '@/lib/carousel/poll-status'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

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
        setErrorMessage('Could not load this carousel. It may have been deleted or you may not have access.')
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-48" />
      </div>
    )
  }

  // Error state
  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-8">
        <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Generation Error</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">{errorMessage}</p>
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
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
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-4 w-48" />
    </div>
  )
}
