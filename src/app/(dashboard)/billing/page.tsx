import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, createPortalSession } from '@/lib/stripe/actions'

export default async function BillingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: subscription } = user
    ? await supabase
        .from('subscriptions')
        .select('status, current_period_end, cancel_at_period_end, stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null }

  const status = subscription?.status
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end ?? false
  const currentPeriodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Billing</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>

        {/* No subscription — Free Plan */}
        {!subscription && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-base font-medium text-gray-900">Free Plan</p>
                <p className="text-sm text-gray-500 mt-1">
                  Upgrade to Pro for unlimited carousel generations
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Free
              </span>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <form action={createCheckoutSession}>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Subscribe for $29.99/month
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Active subscription — no cancellation pending */}
        {status === 'active' && !cancelAtPeriodEnd && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-base font-medium text-gray-900">Pro Plan - Active</p>
                {currentPeriodEnd && (
                  <p className="text-sm text-gray-500 mt-1">
                    Renews on {currentPeriodEnd}
                  </p>
                )}
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <form action={createPortalSession}>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Manage Subscription
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Active subscription — cancellation scheduled */}
        {status === 'active' && cancelAtPeriodEnd && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-base font-medium text-gray-900">
                  Pro Plan - Cancels on {currentPeriodEnd}
                </p>
                <p className="text-sm text-amber-600 mt-1">
                  Your subscription will end at the current billing period. You can reactivate it anytime before then.
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Canceling
              </span>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <form action={createPortalSession}>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Manage Subscription
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Canceled */}
        {status === 'canceled' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-base font-medium text-gray-900">Subscription Canceled</p>
                <p className="text-sm text-gray-500 mt-1">
                  Your subscription has ended. Resubscribe to regain Pro access.
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Canceled
              </span>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <form action={createCheckoutSession}>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Resubscribe
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Past due */}
        {status === 'past_due' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-base font-medium text-gray-900">Payment Failed</p>
                <p className="text-sm text-red-600 mt-1">
                  We could not charge your card. Please update your payment method to keep your subscription active.
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Past Due
              </span>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <form action={createPortalSession}>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Update Payment Method
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Other statuses (incomplete, trialing, etc.) — show manage option */}
        {status &&
          status !== 'active' &&
          status !== 'canceled' &&
          status !== 'past_due' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-base font-medium text-gray-900">
                    Pro Plan - {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage your subscription in the billing portal.
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <form action={createPortalSession}>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Manage Subscription
                  </button>
                </form>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
