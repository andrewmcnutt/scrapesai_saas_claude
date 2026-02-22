import { CreditBalance } from '@/components/CreditBalance'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

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
