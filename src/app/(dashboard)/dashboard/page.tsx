import { CreditBalance } from '@/components/CreditBalance'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe/actions'
import { checkBrandProfileComplete } from '@/lib/brand/check-completion'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

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
      <Card className="bg-gradient-to-r from-indigo-600 to-blue-500 border-0 mb-6">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Create a New Carousel</h2>
          <p className="text-indigo-100 mb-6">
            Turn your ideas into professional LinkedIn carousels in minutes
          </p>
          <Button asChild variant="secondary" size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50">
            <Link href="/generate">
              Generate Carousel &rarr;
            </Link>
          </Button>
        </CardContent>
      </Card>

      {!isComplete && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-900">
            Complete Your Brand Profile
          </AlertTitle>
          <AlertDescription className="text-yellow-800">
            <p className="mb-3">
              Set up your brand colors, voice, and messaging before generating carousels.
            </p>
            <Button asChild size="sm" className="bg-yellow-600 hover:bg-yellow-700">
              <Link href="/brand">
                Complete Brand Profile &rarr;
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Subscription cancellation warning */}
      {isCanceling && subscription?.current_period_end && (
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">
            Subscription Cancellation Scheduled
          </AlertTitle>
          <AlertDescription className="text-amber-800">
            <p>
              Your subscription cancels on{' '}
              {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              . You&apos;ll retain access until then.
            </p>
            <Button asChild variant="link" className="px-0 text-amber-700">
              <Link href="/billing">
                Manage subscription &rarr;
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <CreditBalance />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Email: {user?.email}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Status: {user?.email_confirmed_at ? 'Verified' : 'Unverified'}
            </p>
          </CardContent>
        </Card>

        {/* Upgrade card for free tier users */}
        {!isActiveSub && (
          <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100">
            <CardHeader>
              <CardTitle className="text-lg text-indigo-900">
                Unlock unlimited potential
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-indigo-700 mb-1 font-medium">
                $29.99/month
              </p>
              <p className="text-sm text-indigo-600 mb-4">10 credits with rollover</p>
              <form action={createCheckoutSession}>
                <Button type="submit" className="w-full">
                  Upgrade to Pro
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Quick actions card (shown for paid users) */}
        {isActiveSub && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="link" className="px-0">
                <Link href="/history">
                  View carousel history &rarr;
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
