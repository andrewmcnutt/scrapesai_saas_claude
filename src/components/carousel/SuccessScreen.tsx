'use client'

import { useEffect, useRef } from 'react'

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
        <svg
          className="w-10 h-10 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Your carousel is ready!
      </h2>

      <p className="text-gray-500 mb-8 text-center">
        Your LinkedIn carousel has been generated successfully.
      </p>

      {/* View Carousel button */}
      <button
        onClick={handleClick}
        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        View Carousel
      </button>

      <p className="mt-4 text-xs text-gray-400">Redirecting automatically...</p>
    </div>
  )
}
