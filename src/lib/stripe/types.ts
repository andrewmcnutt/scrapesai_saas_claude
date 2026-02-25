export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'unpaid'
  | 'paused';

export interface UserSubscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
}

export type UserTier = 'free' | 'paid';

export interface UserSubscriptionStatus {
  balance: number;
  isActiveSub: boolean;
  isFree: boolean;
  tier: UserTier;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}
