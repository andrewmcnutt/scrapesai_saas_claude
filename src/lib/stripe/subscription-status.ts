import { SupabaseClient } from '@supabase/supabase-js'
import { UserSubscriptionStatus } from '@/lib/stripe/types'

export async function getUserSubscriptionStatus(
  userId: string,
  supabase: SupabaseClient
): Promise<UserSubscriptionStatus> {
  const [subscriptionResult, transactionsResult] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('status, current_period_end, cancel_at_period_end')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('credit_transactions')
      .select('amount')
      .eq('user_id', userId),
  ])

  const sub = subscriptionResult.data
  const transactions = transactionsResult.data ?? []

  const balance = transactions.reduce((sum, tx) => sum + tx.amount, 0)
  const isActiveSub = sub?.status === 'active' || sub?.status === 'trialing'

  return {
    balance,
    isActiveSub,
    isFree: !isActiveSub,
    tier: isActiveSub ? 'paid' : 'free',
    cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
    currentPeriodEnd: sub?.current_period_end ?? null,
  }
}
