'use client'

import { createClient } from '@/lib/supabase/client'
import { createCheckoutSession } from '@/lib/stripe/actions'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SubscriptionState {
  balance: number
  isActiveSub: boolean
  isPastDue: boolean
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
}

export function CreditBalance() {
  const [state, setState] = useState<SubscriptionState | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const [transactionsResult, subscriptionResult] = await Promise.all([
        supabase.from('credit_transactions').select('amount').eq('user_id', user.id),
        supabase
          .from('subscriptions')
          .select('status, cancel_at_period_end, current_period_end')
          .eq('user_id', user.id)
          .maybeSingle(),
      ])

      const transactions = transactionsResult.data ?? []
      const balance = transactions.reduce((sum, tx) => sum + tx.amount, 0)
      const sub = subscriptionResult.data

      const isActiveSub = sub?.status === 'active' || sub?.status === 'trialing'
      const isPastDue = sub?.status === 'past_due'

      setState({
        balance,
        isActiveSub,
        isPastDue,
        cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
        currentPeriodEnd: sub?.current_period_end ?? null,
      })
      setLoading(false)
    }

    loadStatus()
  }, [supabase])

  if (loading) {
    return <div className="text-gray-600">Loading credits...</div>
  }

  if (!state) {
    return null
  }

  const { balance, isActiveSub, isPastDue, cancelAtPeriodEnd, currentPeriodEnd } = state

  // Past due state
  if (isPastDue) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border border-yellow-300">
        <h2 className="text-lg font-semibold mb-2 text-yellow-900">Pro Plan - Payment Issue</h2>
        <p className="text-4xl font-bold text-yellow-600">{balance}</p>
        <p className="text-sm text-yellow-700 mt-2">Credits available (payment update required)</p>
        <Link
          href="/billing"
          className="mt-4 inline-block bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 text-sm font-medium"
        >
          Update payment method
        </Link>
      </div>
    )
  }

  // Paid (active subscription) state
  if (isActiveSub) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Pro Plan</h2>
        <p className="text-4xl font-bold text-indigo-600">{balance}</p>
        <p className="text-sm text-gray-600 mt-2">{balance} credits available</p>
        {cancelAtPeriodEnd && currentPeriodEnd && (
          <p className="text-sm text-yellow-600 mt-2">
            Cancels on{' '}
            {new Date(currentPeriodEnd).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}
        {balance < 3 && (
          <p className="text-sm text-orange-600 mt-2 font-medium">Credits are running low</p>
        )}
        <Link
          href="/billing"
          className="mt-4 inline-block text-sm text-indigo-600 hover:underline"
        >
          Manage subscription
        </Link>
      </div>
    )
  }

  // Free tier state
  const hasCreditsLeft = balance > 0

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2">Free Plan</h2>
      <p className="text-4xl font-bold text-blue-600">{balance} of 3</p>
      <p className="text-sm text-gray-600 mt-2">
        {hasCreditsLeft
          ? `You have ${balance} free carousel${balance === 1 ? '' : 's'} remaining`
          : "You've used all 3 free carousels"}
      </p>
      {/* Progress bar showing credit usage */}
      <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-blue-600 h-1.5 rounded-full"
          style={{ width: `${Math.max(0, (balance / 3) * 100)}%` }}
        />
      </div>
      <form action={createCheckoutSession} className="mt-4">
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm"
        >
          Upgrade to Pro - $29.99/mo
        </button>
      </form>
    </div>
  )
}
