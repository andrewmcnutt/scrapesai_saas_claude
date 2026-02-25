'use client'

import { useEffect, useRef, useState } from 'react'
import { pollCarouselStatus, CarouselStatusResponse } from '@/lib/carousel/poll-status'

const PROGRESS_MESSAGES = [
  'AI is crafting your slides...',
  'Applying your brand style...',
  'Composing the visual layout...',
  'Polishing your content...',
  'Almost there...',
]

// Approximate max attempts used for progress bar calculation
const APPROX_MAX_ATTEMPTS = 40

interface GenerationPollingProps {
  jobId: string
  onComplete: (data: CarouselStatusResponse) => void
  onError: (error: string) => void
}

export function GenerationPolling({ jobId, onComplete, onError }: GenerationPollingProps) {
  const [attempt, setAttempt] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const hasStartedRef = useRef(false)

  // Cycle through helpful messages every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % PROGRESS_MESSAGES.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  // Start polling on mount
  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    pollCarouselStatus(jobId, (currentAttempt) => {
      setAttempt(currentAttempt)
    })
      .then((data) => {
        if (data.status === 'completed') {
          onComplete(data)
        } else if (data.status === 'timeout') {
          onError(
            'Generation is taking longer than expected. Please check back later or contact support if this persists.'
          )
        } else {
          onError(
            data.error_message ??
              'Generation failed. Your credit has been refunded. Please try again.'
          )
        }
      })
      .catch(() => {
        onError('An unexpected error occurred. Please refresh the page and try again.')
      })
  }, [jobId, onComplete, onError])

  // Progress bar: use attempt count as rough indicator (caps at 95% to avoid false 100%)
  const progressPercent = Math.min(
    Math.round((attempt / APPROX_MAX_ATTEMPTS) * 100),
    95
  )

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-8 py-12">
      {/* Spinner */}
      <div className="mb-8">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Generating your carousel...
      </h2>

      {/* Rotating message */}
      <p className="text-gray-500 mb-8 text-center transition-all duration-500">
        {PROGRESS_MESSAGES[messageIndex]}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-md mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Estimated time note */}
      <p className="text-sm text-gray-400 text-center max-w-sm">
        This typically takes 60&ndash;180 seconds. You can leave this page and check back
        later.
      </p>
    </div>
  )
}
