import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, createPortalSession } from '@/lib/stripe/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

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
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          {/* No subscription -- Free Plan */}
          {!subscription && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-base font-medium">Free Plan</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upgrade to Pro for unlimited carousel generations
                  </p>
                </div>
                <Badge variant="secondary">Free</Badge>
              </div>
              <Separator className="mb-4" />
              <form action={createCheckoutSession}>
                <Button type="submit">
                  Subscribe for $29.99/month
                </Button>
              </form>
            </div>
          )}

          {/* Active subscription -- no cancellation pending */}
          {status === 'active' && !cancelAtPeriodEnd && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-base font-medium">Pro Plan - Active</p>
                  {currentPeriodEnd && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Renews on {currentPeriodEnd}
                    </p>
                  )}
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
              </div>
              <Separator className="mb-4" />
              <form action={createPortalSession}>
                <Button type="submit" variant="outline">
                  Manage Subscription
                </Button>
              </form>
            </div>
          )}

          {/* Active subscription -- cancellation scheduled */}
          {status === 'active' && cancelAtPeriodEnd && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-base font-medium">
                    Pro Plan - Cancels on {currentPeriodEnd}
                  </p>
                  <p className="text-sm text-amber-600 mt-1">
                    Your subscription will end at the current billing period. You can reactivate it anytime before then.
                  </p>
                </div>
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">Canceling</Badge>
              </div>
              <Separator className="mb-4" />
              <form action={createPortalSession}>
                <Button type="submit" variant="outline">
                  Manage Subscription
                </Button>
              </form>
            </div>
          )}

          {/* Canceled */}
          {status === 'canceled' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-base font-medium">Subscription Canceled</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your subscription has ended. Resubscribe to regain Pro access.
                  </p>
                </div>
                <Badge variant="destructive">Canceled</Badge>
              </div>
              <Separator className="mb-4" />
              <form action={createCheckoutSession}>
                <Button type="submit">
                  Resubscribe
                </Button>
              </form>
            </div>
          )}

          {/* Past due */}
          {status === 'past_due' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-base font-medium">Payment Failed</p>
                  <p className="text-sm text-destructive mt-1">
                    We could not charge your card. Please update your payment method to keep your subscription active.
                  </p>
                </div>
                <Badge variant="destructive">Past Due</Badge>
              </div>
              <Separator className="mb-4" />
              <form action={createPortalSession}>
                <Button type="submit" variant="destructive">
                  Update Payment Method
                </Button>
              </form>
            </div>
          )}

          {/* Other statuses (incomplete, trialing, etc.) */}
          {status &&
            status !== 'active' &&
            status !== 'canceled' &&
            status !== 'past_due' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-base font-medium">
                      Pro Plan - {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage your subscription in the billing portal.
                    </p>
                  </div>
                </div>
                <Separator className="mb-4" />
                <form action={createPortalSession}>
                  <Button type="submit" variant="outline">
                    Manage Subscription
                  </Button>
                </form>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
