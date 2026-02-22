'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrandProfileSchema } from '@/lib/validations/brand'

export async function saveBrandProfile(
  prevState: any,
  formData: FormData
) {
  // Validate input with Zod
  const validatedFields = BrandProfileSchema.safeParse({
    brandName: formData.get('brandName'),
    primaryColor: formData.get('primaryColor'),
    secondaryColor: formData.get('secondaryColor'),
    voiceGuidelines: formData.get('voiceGuidelines'),
    productDescription: formData.get('productDescription'),
    targetAudience: formData.get('targetAudience'),
    ctaText: formData.get('ctaText'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check your inputs.',
    }
  }

  // Get authenticated user
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      message: 'Unauthorized. Please log in.',
    }
  }

  // Upsert brand profile (atomic insert-or-update)
  try {
    const { error } = await supabase
      .from('brand_profiles')
      .upsert({
        user_id: user.id,
        brand_name: validatedFields.data.brandName,
        primary_color: validatedFields.data.primaryColor,
        secondary_color: validatedFields.data.secondaryColor,
        voice_guidelines: validatedFields.data.voiceGuidelines,
        product_description: validatedFields.data.productDescription,
        target_audience: validatedFields.data.targetAudience,
        cta_text: validatedFields.data.ctaText,
      }, {
        onConflict: 'user_id', // Critical: use unique constraint, not primary key
      })

    if (error) {
      console.error('Supabase upsert error:', error)
      return {
        message: 'Failed to save brand profile. Please try again.',
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      message: 'Failed to save brand profile. Please try again.',
    }
  }

  // Revalidate cache and redirect (outside try/catch to prevent catching redirect throw)
  revalidatePath('/dashboard')
  revalidatePath('/brand')
  redirect('/dashboard')
}
