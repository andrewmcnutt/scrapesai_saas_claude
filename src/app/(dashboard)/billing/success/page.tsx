import { redirect } from 'next/navigation'
import Link from 'next/link'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  // Next.js 15 pattern: await searchParams
  const { session_id } = await searchParams

  if (!session_id) {
    redirect('/dashboard')
  }

  // Query Stripe directly to confirm payment status — handles webhook race condition (PAY-11)
  const session = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ['subscription'],
  })

  // Also check our local DB in case webhook arrived quickly
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: localSub } = user
    ? await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null }

  // Subscription is active if Stripe confirms payment OR local record is already active
  const isActivated =
    session.payment_status === 'paid' || localSub?.status === 'active'

  if (isActivated) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="bg-white shadow rounded-lg p-8">
          {/* Checkmark icon */}
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription Active!</h1>
          <p className="text-gray-600 mb-2">
            Welcome to ScrapesAI Pro. Your subscription is now active.
          </p>
          <p className="text-sm text-indigo-600 font-medium mb-6">
            You&apos;ve been credited 10 monthly credits to get started.
          </p>

          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Webhook hasn't arrived yet — show pending state with refresh option
  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="bg-white shadow rounded-lg p-8">
        {/* Spinner */}
        <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
          <svg
            className="w-8 h-8 text-indigo-600 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Activating subscription...</h1>
        <p className="text-gray-600 mb-2">Your payment was received. We&apos;re activating your subscription now.</p>
        <p className="text-sm text-gray-500 mb-6">
          This usually takes a few seconds. Please refresh if it takes longer.
        </p>

        <Link
          href={`/billing/success?session_id=${session_id}`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Refresh
        </Link>
      </div>
    </div>
  )
}
