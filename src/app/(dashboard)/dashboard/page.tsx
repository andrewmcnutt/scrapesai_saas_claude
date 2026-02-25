import { CreditBalance } from '@/components/CreditBalance'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe/actions'
import { checkBrandProfileComplete } from '@/lib/brand/check-completion'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isComplete = await checkBrandProfileComplete()

  // Fetch subscription status for upgrade card
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, cancel_at_period_end, current_period_end')
    .eq('user_id', user!.id)
    .maybeSingle()

  const isActiveSub =
    subscription?.status === 'active' || subscription?.status === 'trialing'
  const isCanceling = isActiveSub && subscription?.cancel_at_period_end

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Generate Carousel CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-8 rounded-xl shadow-md mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Create a New Carousel</h2>
        <p className="text-indigo-100 mb-6">
          Turn your ideas into professional LinkedIn carousels in minutes
        </p>
        <Link
          href="/generate"
          className="inline-block px-6 py-3 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
        >
          Generate Carousel &rarr;
        </Link>
      </div>

      {!isComplete && (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">
            Complete Your Brand Profile
          </h2>
          <p className="text-sm text-yellow-800 mb-3">
            Set up your brand colors, voice, and messaging before generating carousels.
          </p>
          <Link
            href="/brand"
            className="inline-block px-4 py-2 bg-yellow-600 text-white font-medium rounded-md hover:bg-yellow-700 transition-colors"
          >
            Complete Brand Profile &rarr;
          </Link>
        </div>
      )}

      {/* Subscription cancellation warning */}
      {isCanceling && subscription?.current_period_end && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold text-amber-900 mb-1">
            Subscription Cancellation Scheduled
          </h2>
          <p className="text-sm text-amber-800">
            Your subscription cancels on{' '}
            {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            . You&apos;ll retain access until then.
          </p>
          <Link
            href="/billing"
            className="mt-3 inline-block text-sm text-amber-700 font-medium hover:underline"
          >
            Manage subscription &rarr;
          </Link>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <CreditBalance />

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Account</h2>
          <p className="text-sm text-gray-600">Email: {user?.email}</p>
          <p className="text-sm text-gray-600 mt-1">
            Status: {user?.email_confirmed_at ? 'Verified' : 'Unverified'}
          </p>
        </div>

        {/* Upgrade card for free tier users */}
        {!isActiveSub && (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-lg shadow border border-indigo-100">
            <h2 className="text-lg font-semibold mb-1 text-indigo-900">
              Unlock unlimited potential
            </h2>
            <p className="text-sm text-indigo-700 mb-1 font-medium">
              $29.99/month
            </p>
            <p className="text-sm text-indigo-600 mb-4">10 credits with rollover</p>
            <form action={createCheckoutSession}>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm"
              >
                Upgrade to Pro
              </button>
            </form>
          </div>
        )}

        {/* Quick actions card (shown for paid users or when upgrade card not shown) */}
        {isActiveSub && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
            <Link href="/history" className="text-sm text-indigo-600 hover:underline">
              View carousel history &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
