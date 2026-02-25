import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { N8nCallbackSchema } from '@/lib/validations/carousel'
import { verifyWebhookSignature } from '@/lib/carousel/verify-webhook'

export async function POST(request: NextRequest) {
  console.log('[N8N Callback] Received webhook request')

  // CRITICAL: Read raw body as text for HMAC verification
  // Must use .text() before .json() — once consumed, body cannot be re-read
  const rawBody = await request.text()

  // Get HMAC signature from header
  const signature = request.headers.get('x-n8n-signature')

  if (!signature) {
    console.warn('[N8N Callback] Missing x-n8n-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  // Verify HMAC-SHA256 signature (constant-time comparison prevents timing attacks)
  const isValid = verifyWebhookSignature(
    rawBody,
    signature,
    process.env.N8N_WEBHOOK_SECRET!
  )

  if (!isValid) {
    console.warn('[N8N Callback] Invalid signature — rejecting request')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  console.log('[N8N Callback] Signature verified successfully')

  // Parse raw body as JSON
  let parsedBody: unknown
  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    console.error('[N8N Callback] Failed to parse JSON body')
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Validate payload with Zod schema
  const validatedPayload = N8nCallbackSchema.safeParse(parsedBody)

  if (!validatedPayload.success) {
    console.error('[N8N Callback] Payload validation failed:', validatedPayload.error.flatten())
    return NextResponse.json(
      { error: 'Invalid payload', details: validatedPayload.error.flatten() },
      { status: 400 }
    )
  }

  const { job_id, image_urls, post_body_text, status } = validatedPayload.data

  console.log(`[N8N Callback] Processing job ${job_id} with status: ${status}`)

  // Use Supabase admin client with service role key to bypass RLS
  // This is a server-to-server webhook — no user session available
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Update carousel record: set status, image URLs, post body, and completion timestamp
  const { data: updatedRows, error: updateError } = await supabaseAdmin
    .from('carousels')
    .update({
      status,
      image_urls,
      post_body_text,
      completed_at: new Date().toISOString(),
    })
    .eq('id', job_id)
    .select('id')

  if (updateError) {
    console.error('[N8N Callback] Database update error:', updateError)
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
  }

  if (!updatedRows || updatedRows.length === 0) {
    console.warn(`[N8N Callback] No rows updated — job_id not found: ${job_id}`)
    return NextResponse.json({ error: 'Carousel job not found' }, { status: 404 })
  }

  console.log(`[N8N Callback] Successfully updated carousel job: ${job_id}`)

  return NextResponse.json({ success: true })
}
