import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel adds Authorization header automatically for cron jobs)
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabaseAdmin.rpc('refund_timeout_jobs')

  if (error) {
    console.error('[Cron] refund_timeout_jobs failed:', error)
    return NextResponse.json({ error: 'Refund timeout failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
