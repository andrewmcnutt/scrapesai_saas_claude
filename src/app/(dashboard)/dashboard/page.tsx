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

      {/* Generate Carousel CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-8 rounded-xl shadow-md mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Create a New Carousel</h2>
        <p className="text-indigo-100 mb-6">
          Turn your ideas into professional LinkedIn carousels in minutes
        </p>
        <Link
          href="/generate"
          className="inline-block px-6 py-3 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
        >
          Generate Carousel →
        </Link>
      </div>

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
          <Link
            href="/history"
            className="text-sm text-indigo-600 hover:underline"
          >
            View carousel history →
          </Link>
        </div>
      </div>
    </div>
  )
}
