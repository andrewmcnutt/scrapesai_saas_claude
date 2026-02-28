'use client'

import { createClient } from '@/lib/supabase/client'
import { createCheckoutSession } from '@/lib/stripe/actions'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

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
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!state) {
    return null
  }

  const { balance, isActiveSub, isPastDue, cancelAtPeriodEnd, currentPeriodEnd } = state

  // Past due state
  if (isPastDue) {
    return (
      <Card className="border-yellow-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-yellow-900">Pro Plan</CardTitle>
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Payment Issue</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-yellow-600">{balance}</p>
          <p className="text-sm text-yellow-700 mt-2">Credits available (payment update required)</p>
        </CardContent>
        <CardFooter>
          <Button asChild className="bg-yellow-600 hover:bg-yellow-700">
            <Link href="/billing">Update payment method</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Paid (active subscription) state
  if (isActiveSub) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Credits</CardTitle>
            <Badge variant="secondary">Pro Plan</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-primary">{balance}</p>
          <p className="text-sm text-muted-foreground mt-2">{balance} credits available</p>
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
            <Alert className="mt-3 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-600 font-medium">
                Credits are running low
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild variant="link" className="px-0">
            <Link href="/billing">Manage subscription</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Free tier state
  const hasCreditsLeft = balance > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Credits</CardTitle>
          <Badge variant="outline">Free Plan</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold text-primary">{balance} of 3</p>
        <p className="text-sm text-muted-foreground mt-2">
          {hasCreditsLeft
            ? `You have ${balance} free carousel${balance === 1 ? '' : 's'} remaining`
            : "You've used all 3 free carousels"}
        </p>
        <Progress value={Math.max(0, (balance / 3) * 100)} className="mt-3" />
        <form action={createCheckoutSession} className="mt-4">
          <Button type="submit" className="w-full">
            Upgrade to Pro - $29.99/mo
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
