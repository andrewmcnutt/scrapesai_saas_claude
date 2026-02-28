import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BrandSettingsForm } from './brand-settings-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

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
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading brand settings</AlertTitle>
          <AlertDescription>Please try refreshing the page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Brand Settings</CardTitle>
          <CardDescription>
            Customize your brand identity to personalize carousel generation.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}
