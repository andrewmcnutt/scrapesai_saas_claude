import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (token_hash && type === 'signup') {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'signup',
    })

    if (!error) {
      // Allocate 3 free credits on signup verification
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('credit_transactions').insert({
          user_id: user.id,
          amount: 3,
          type: 'signup_bonus',
          metadata: { source: 'email_verification' }
        })
      }

      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=verification_failed', request.url))
}
