import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, password, turnstileToken } = await request.json()

  // Verify Turnstile CAPTCHA
  const turnstileResponse = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      }),
    }
  )

  const outcome = await turnstileResponse.json()

  if (!outcome.success) {
    return NextResponse.json(
      { error: 'CAPTCHA verification failed. Please try again.' },
      { status: 400 }
    )
  }

  // Proceed with Supabase signup
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    message: 'Check your email to confirm your account',
    user: data.user,
  })
}
