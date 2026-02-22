import { CreditBalance } from '@/components/CreditBalance'
import { createClient } from '@/lib/supabase/server'
import { checkBrandProfileComplete } from '@/lib/brand/check-completion'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isComplete = await checkBrandProfileComplete()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

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
            Complete Brand Profile →
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

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
          <p className="text-sm text-gray-600">
            Brand setup and carousel generation coming in Phase 2 & 3
          </p>
        </div>
      </div>
    </div>
  )
}
