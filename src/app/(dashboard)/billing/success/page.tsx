import { redirect } from 'next/navigation'
import Link from 'next/link'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import { SubscriptionActivating } from '@/components/billing/SubscriptionActivating'

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id } = await searchParams

  if (!session_id) {
    redirect('/dashboard')
  }

  // Query Stripe directly to confirm payment status -- handles webhook race condition (PAY-11)
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
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold mb-2">Subscription Active!</h1>
            <p className="text-muted-foreground mb-2">
              Welcome to ScrapesAI Pro. Your subscription is now active.
            </p>
            <p className="text-sm text-blue-600 font-medium mb-6">
              You&apos;ve been credited 10 monthly credits to get started.
            </p>

            <Button asChild size="lg">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Webhook hasn't arrived yet -- show auto-polling activating component
  return <SubscriptionActivating sessionId={session_id} />
}
