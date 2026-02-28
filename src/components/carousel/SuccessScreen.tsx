'use client'

import { useEffect, useRef } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SuccessScreenProps {
  onViewCarousel: () => void
}

export function SuccessScreen({ onViewCarousel }: SuccessScreenProps) {
  const hasAutoTransitionedRef = useRef(false)

  // Auto-transition after 3 seconds if user hasn't already clicked
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasAutoTransitionedRef.current) {
        hasAutoTransitionedRef.current = true
        onViewCarousel()
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [onViewCarousel])

  function handleClick() {
    hasAutoTransitionedRef.current = true
    onViewCarousel()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-8 py-12">
      {/* Checkmark icon */}
      <div className="mb-6 flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-semibold mb-2">
        Your carousel is ready!
      </h2>

      <p className="text-muted-foreground mb-8 text-center">
        Your LinkedIn carousel has been generated successfully.
      </p>

      {/* View Carousel button */}
      <Button size="lg" onClick={handleClick}>
        View Carousel
      </Button>

      <p className="mt-4 text-xs text-muted-foreground">Redirecting automatically...</p>
    </div>
  )
}
