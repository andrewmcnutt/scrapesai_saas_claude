'use server'

import { createClient } from '@/lib/supabase/server'
import { GenerationSchema } from '@/lib/validations/carousel'

export async function initiateGeneration(
  prevState: unknown,
  formData: FormData
) {
  // Validate form data using GenerationSchema
  const validatedFields = GenerationSchema.safeParse({
    topic: formData.get('topic'),
    keyPoints: formData.get('keyPoints'),
    tone: formData.get('tone'),
    templateUrl: formData.get('templateUrl'),
    imageStyle: formData.get('imageStyle'),
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

  // Fetch brand profile for the user
  const { data: brandProfile, error: brandError } = await supabase
    .from('brand_profiles')
    .select('brand_name, primary_color, secondary_color, voice_guidelines, product_description, target_audience, cta_text')
    .eq('user_id', user.id)
    .maybeSingle()

  if (brandError || !brandProfile) {
    return {
      message: 'No brand profile found. Please complete your brand profile first.',
    }
  }

  // Check if brand profile is completed (not default values)
  const isBrandComplete = (
    brandProfile.brand_name !== 'My Brand' &&
    brandProfile.voice_guidelines !== 'Professional and helpful' &&
    brandProfile.product_description !== 'Enter your product description'
  )

  if (!isBrandComplete) {
    return {
      message: 'Please complete your brand profile before generating carousels.',
    }
  }

  // Step 1: Atomically deduct credit using the deduct_credit RPC
  const { data: deductionResult, error: deductionError } = await supabase.rpc(
    'deduct_credit',
    {
      p_user_id: user.id,
      p_amount: 1,
      p_type: 'generation_deduction',
      p_metadata: { action: 'carousel_generation' },
    }
  )

  if (deductionError || !deductionResult) {
    console.error('Credit deduction failed:', deductionError)

    // Determine tier-aware error message based on subscription status
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle()

    const isActiveSub =
      subscription?.status === 'active' || subscription?.status === 'trialing'

    if (!isActiveSub) {
      // Free tier: no active subscription — show upgrade prompt
      return {
        message: "You've used all 3 free carousels. Upgrade to Pro for 10 credits/month.",
        needsUpgrade: true,
      }
    }

    // Active subscription but out of credits — billing cycle refresh message
    return {
      message: 'No credits remaining. Your credits will refresh on your next billing date.',
      needsUpgrade: false,
    }
  }

  const transactionId = deductionResult.transaction_id

  // Step 2: Insert carousel job into carousels table with status 'pending'
  const { data: carousel, error: insertError } = await supabase
    .from('carousels')
    .insert({
      user_id: user.id,
      status: 'pending',
      idea_topic: validatedFields.data.topic,
      idea_key_points: validatedFields.data.keyPoints,
      idea_tone: validatedFields.data.tone,
      template_url: validatedFields.data.templateUrl,
      image_style: validatedFields.data.imageStyle,
      transaction_id: transactionId,
    })
    .select('id')
    .single()

  if (insertError || !carousel) {
    console.error('Carousel insert failed:', insertError)
    // Refund credit since job creation failed
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        amount: 1,
        type: 'refund',
        metadata: { reason: 'job_creation_failed' },
      })
    return {
      message: 'Failed to create generation job. Your credit has been refunded.',
    }
  }

  // Step 3: Send generation request to N8N webhook
  // If N8N call fails, do NOT refund — job is created and N8N may retry
  try {
    const n8nPayload = {
      job_id: carousel.id,
      idea: {
        topic: validatedFields.data.topic,
        key_points: validatedFields.data.keyPoints,
        tone: validatedFields.data.tone,
      },
      template_url: validatedFields.data.templateUrl,
      image_style: validatedFields.data.imageStyle,
      brand: {
        name: brandProfile.brand_name,
        primary_color: brandProfile.primary_color,
        secondary_color: brandProfile.secondary_color,
        voice_guidelines: brandProfile.voice_guidelines,
        product_description: brandProfile.product_description,
        target_audience: brandProfile.target_audience,
        cta_text: brandProfile.cta_text,
      },
    }

    const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload),
    })

    if (!n8nResponse.ok) {
      console.error('N8N webhook call failed with status:', n8nResponse.status)
      // Do NOT refund — job exists and can be retried or timed out
    }
  } catch (n8nError) {
    console.error('N8N webhook call threw an error:', n8nError)
    // Do NOT refund — same reason as above
  }

  return {
    success: true,
    job_id: carousel.id,
  }
}
