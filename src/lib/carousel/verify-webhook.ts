import crypto from 'crypto'

/**
 * Verifies an HMAC-SHA256 webhook signature.
 *
 * Uses constant-time comparison (timingSafeEqual) to prevent timing attacks.
 * Buffer length mismatch is handled gracefully — returns false instead of throwing.
 *
 * @param rawBody - The raw request body string (must be the unmodified body)
 * @param signature - The signature provided in the request header
 * @param secret - The shared secret used to compute the expected HMAC
 * @returns true if the signature is valid, false otherwise
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')

    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8')
    const receivedBuffer = Buffer.from(signature, 'utf-8')

    // timingSafeEqual requires same-length buffers
    if (expectedBuffer.length !== receivedBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  } catch {
    // Any unexpected error (e.g., malformed buffers) means verification failed
    return false
  }
}
