import { backOff } from 'exponential-backoff'

export interface CarouselStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'timeout'
  image_urls?: string[] | null
  post_body_text?: string | null
  error_message?: string | null
  created_at?: string
  completed_at?: string | null
}

/**
 * Polls the carousel status endpoint with exponential backoff.
 *
 * Polling intervals: 2s -> 4s -> 8s (capped) per GEN-13 requirement.
 * Returns when status is 'completed', 'failed', or 'timeout'.
 * If max attempts exceeded, returns { status: 'timeout' } without throwing.
 */
export async function pollCarouselStatus(
  jobId: string,
  onProgress?: (attempt: number) => void
): Promise<CarouselStatusResponse> {
  let attemptCount = 0

  try {
    const result = await backOff(
      async () => {
        attemptCount++
        if (onProgress) {
          onProgress(attemptCount)
        }

        const response = await fetch(`/api/carousel/${jobId}`)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data: CarouselStatusResponse = await response.json()

        // Terminal states — stop polling
        if (
          data.status === 'completed' ||
          data.status === 'failed' ||
          data.status === 'timeout'
        ) {
          return data
        }

        // Still processing — throw to trigger retry
        throw new Error(`Status: ${data.status}. Retrying...`)
      },
      {
        startingDelay: 2000,    // 2s initial delay
        timeMultiple: 2,        // doubles each retry: 2s, 4s, 8s, 8s, 8s...
        maxDelay: 8000,         // caps at 8s per GEN-13
        numOfAttempts: 40,      // ~5 minutes max coverage
        jitter: 'none',
        retry: () => true,      // always retry on throw
      }
    )

    return result
  } catch {
    // Max attempts exceeded — treat as client-side timeout
    return { status: 'timeout' }
  }
}
