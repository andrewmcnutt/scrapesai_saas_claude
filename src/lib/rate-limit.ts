const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  ip: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = ip
  const record = rateLimitStore.get(key)

  // Clean up expired entries
  if (record && now > record.resetTime) {
    rateLimitStore.delete(key)
  }

  const currentRecord = rateLimitStore.get(key)

  if (!currentRecord) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs }
  }

  if (currentRecord.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: currentRecord.resetTime,
    }
  }

  currentRecord.count++
  rateLimitStore.set(key, currentRecord)

  return {
    allowed: true,
    remaining: limit - currentRecord.count,
    resetTime: currentRecord.resetTime,
  }
}
