'use client'

import { useActionState } from 'react'
import { saveBrandProfile } from './actions'

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

  return (
    <form action={formAction} className="space-y-6">
      {/* Brand Name */}
      <div>
        <label htmlFor="brandName" className="block text-sm font-medium text-gray-700 mb-1">
          Brand Name
        </label>
        <input
          type="text"
          id="brandName"
          name="brandName"
          defaultValue={initialData.brandName}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., My Company"
          required
        />
        {state.errors?.brandName && (
          <p className="text-red-500 text-sm mt-1">{state.errors.brandName[0]}</p>
        )}
      </div>

      {/* Primary Color */}
      <div>
        <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-1">
          Primary Brand Color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            id="primaryColor"
            name="primaryColor"
            defaultValue={initialData.primaryColor}
            className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
            required
          />
          <span className="text-sm text-gray-600">{initialData.primaryColor}</span>
        </div>
        {state.errors?.primaryColor && (
          <p className="text-red-500 text-sm mt-1">{state.errors.primaryColor[0]}</p>
        )}
      </div>

      {/* Secondary Color */}
      <div>
        <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700 mb-1">
          Secondary Brand Color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            id="secondaryColor"
            name="secondaryColor"
            defaultValue={initialData.secondaryColor}
            className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
            required
          />
          <span className="text-sm text-gray-600">{initialData.secondaryColor}</span>
        </div>
        {state.errors?.secondaryColor && (
          <p className="text-red-500 text-sm mt-1">{state.errors.secondaryColor[0]}</p>
        )}
      </div>

      {/* Voice Guidelines */}
      <div>
        <label htmlFor="voiceGuidelines" className="block text-sm font-medium text-gray-700 mb-1">
          Brand Voice Guidelines
        </label>
        <textarea
          id="voiceGuidelines"
          name="voiceGuidelines"
          defaultValue={initialData.voiceGuidelines}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe your brand voice (e.g., professional, casual, technical)"
          required
        />
        {state.errors?.voiceGuidelines && (
          <p className="text-red-500 text-sm mt-1">{state.errors.voiceGuidelines[0]}</p>
        )}
      </div>

      {/* Product Description */}
      <div>
        <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700 mb-1">
          Product Description
        </label>
        <textarea
          id="productDescription"
          name="productDescription"
          defaultValue={initialData.productDescription}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe what your product/service does"
          required
        />
        {state.errors?.productDescription && (
          <p className="text-red-500 text-sm mt-1">{state.errors.productDescription[0]}</p>
        )}
      </div>

      {/* Target Audience */}
      <div>
        <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-1">
          Target Audience
        </label>
        <textarea
          id="targetAudience"
          name="targetAudience"
          defaultValue={initialData.targetAudience}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe your ideal customer"
          required
        />
        {state.errors?.targetAudience && (
          <p className="text-red-500 text-sm mt-1">{state.errors.targetAudience[0]}</p>
        )}
      </div>

      {/* CTA Text */}
      <div>
        <label htmlFor="ctaText" className="block text-sm font-medium text-gray-700 mb-1">
          Call-to-Action Text
        </label>
        <input
          type="text"
          id="ctaText"
          name="ctaText"
          defaultValue={initialData.ctaText}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Learn More, Get Started"
          required
        />
        {state.errors?.ctaText && (
          <p className="text-red-500 text-sm mt-1">{state.errors.ctaText[0]}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Saving...' : 'Save Brand Settings'}
        </button>

        {state.message && (
          <p className={state.errors ? 'text-red-600' : 'text-green-600'}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  )
}
