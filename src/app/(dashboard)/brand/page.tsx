import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BrandSettingsForm } from './brand-settings-form'

export default async function BrandPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch brand profile using .single() (expect exactly one row due to 1:1 relationship)
  const { data: profile, error } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching brand profile:', error)
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <h2 className="font-semibold text-red-800">Error loading brand settings</h2>
          <p className="text-sm text-red-600 mt-1">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Brand Settings</h1>
      <p className="text-gray-600 mb-8">
        Customize your brand identity to personalize carousel generation.
      </p>

      <BrandSettingsForm
        initialData={{
          brandName: profile.brand_name,
          primaryColor: profile.primary_color,
          secondaryColor: profile.secondary_color,
          voiceGuidelines: profile.voice_guidelines,
          productDescription: profile.product_description,
          targetAudience: profile.target_audience,
          ctaText: profile.cta_text,
        }}
      />
    </div>
  )
}
