'use client'

import { useActionState } from 'react'
import { saveBrandProfile } from './actions'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useEffect, useRef } from 'react'

type BrandProfile = {
  brandName: string
  primaryColor: string
  secondaryColor: string
  voiceGuidelines: string
  productDescription: string
  targetAudience: string
  ctaText: string
}

type FormState = {
  errors?: {
    brandName?: string[]
    primaryColor?: string[]
    secondaryColor?: string[]
    voiceGuidelines?: string[]
    productDescription?: string[]
    targetAudience?: string[]
    ctaText?: string[]
  }
  message?: string
}

export function BrandSettingsForm({ initialData }: { initialData: BrandProfile }) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    saveBrandProfile,
    {}
  )

  const prevMessageRef = useRef(state.message)

  // Show toast on successful save
  useEffect(() => {
    if (state.message && state.message !== prevMessageRef.current && !state.errors) {
      toast.success(state.message)
    }
    prevMessageRef.current = state.message
  }, [state.message, state.errors])

  return (
    <form action={formAction} className="space-y-6">
      {/* Brand Name */}
      <div className="space-y-2">
        <Label htmlFor="brandName">Brand Name</Label>
        <Input
          type="text"
          id="brandName"
          name="brandName"
          defaultValue={initialData.brandName}
          placeholder="e.g., My Company"
          required
        />
        {state.errors?.brandName && (
          <p className="text-destructive text-sm">{state.errors.brandName[0]}</p>
        )}
      </div>

      {/* Primary Color */}
      <div className="space-y-2">
        <Label htmlFor="primaryColor">Primary Brand Color</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            id="primaryColor"
            name="primaryColor"
            defaultValue={initialData.primaryColor}
            className="h-10 w-20 border border-input rounded cursor-pointer"
            required
          />
          <span className="text-sm text-muted-foreground">{initialData.primaryColor}</span>
        </div>
        {state.errors?.primaryColor && (
          <p className="text-destructive text-sm">{state.errors.primaryColor[0]}</p>
        )}
      </div>

      {/* Secondary Color */}
      <div className="space-y-2">
        <Label htmlFor="secondaryColor">Secondary Brand Color</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            id="secondaryColor"
            name="secondaryColor"
            defaultValue={initialData.secondaryColor}
            className="h-10 w-20 border border-input rounded cursor-pointer"
            required
          />
          <span className="text-sm text-muted-foreground">{initialData.secondaryColor}</span>
        </div>
        {state.errors?.secondaryColor && (
          <p className="text-destructive text-sm">{state.errors.secondaryColor[0]}</p>
        )}
      </div>

      {/* Voice Guidelines */}
      <div className="space-y-2">
        <Label htmlFor="voiceGuidelines">Brand Voice Guidelines</Label>
        <Textarea
          id="voiceGuidelines"
          name="voiceGuidelines"
          defaultValue={initialData.voiceGuidelines}
          rows={4}
          placeholder="Describe your brand voice (e.g., professional, casual, technical)"
          required
        />
        {state.errors?.voiceGuidelines && (
          <p className="text-destructive text-sm">{state.errors.voiceGuidelines[0]}</p>
        )}
      </div>

      {/* Product Description */}
      <div className="space-y-2">
        <Label htmlFor="productDescription">Product Description</Label>
        <Textarea
          id="productDescription"
          name="productDescription"
          defaultValue={initialData.productDescription}
          rows={4}
          placeholder="Describe what your product/service does"
          required
        />
        {state.errors?.productDescription && (
          <p className="text-destructive text-sm">{state.errors.productDescription[0]}</p>
        )}
      </div>

      {/* Target Audience */}
      <div className="space-y-2">
        <Label htmlFor="targetAudience">Target Audience</Label>
        <Textarea
          id="targetAudience"
          name="targetAudience"
          defaultValue={initialData.targetAudience}
          rows={3}
          placeholder="Describe your ideal customer"
          required
        />
        {state.errors?.targetAudience && (
          <p className="text-destructive text-sm">{state.errors.targetAudience[0]}</p>
        )}
      </div>

      {/* CTA Text */}
      <div className="space-y-2">
        <Label htmlFor="ctaText">Call-to-Action Text</Label>
        <Input
          type="text"
          id="ctaText"
          name="ctaText"
          defaultValue={initialData.ctaText}
          placeholder="e.g., Learn More, Get Started"
          required
        />
        {state.errors?.ctaText && (
          <p className="text-destructive text-sm">{state.errors.ctaText[0]}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex items-center gap-4 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Brand Settings'}
        </Button>

        {state.message && state.errors && (
          <p className="text-destructive text-sm">{state.message}</p>
        )}
      </div>
    </form>
  )
}
