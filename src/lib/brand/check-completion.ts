import { createClient } from '@/lib/supabase/server'

export async function checkBrandProfileComplete(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  // Use maybeSingle() not single() to gracefully handle zero-row case
  const { data: profile, error } = await supabase
    .from('brand_profiles')
    .select('brand_name, voice_guidelines, product_description')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !profile) return false

  // Check if profile has been customized beyond defaults
  return (
    profile.brand_name !== 'My Brand' &&
    profile.voice_guidelines !== 'Professional and helpful' &&
    profile.product_description !== 'Enter your product description'
  )
}
