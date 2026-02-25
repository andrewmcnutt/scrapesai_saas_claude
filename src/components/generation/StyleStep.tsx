'use client'

import Image from 'next/image'
import { IMAGE_STYLES } from '@/lib/carousel/constants'
import type { WizardFormData } from './GenerationWizard'

type StyleStepProps = {
  data: WizardFormData
  setData: React.Dispatch<React.SetStateAction<WizardFormData>>
  errors: Partial<Record<keyof WizardFormData, string>>
  isSubmitting: boolean
}

export function StyleStep({ data, setData, errors, isSubmitting }: StyleStepProps) {
  const isCustomSelected = data.imageStyle === 'custom'

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Select Image Style</h2>
      <p className="text-sm text-gray-500 mb-6">
        Choose the visual style for the images in your carousel.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {IMAGE_STYLES.map((style) => {
          const isSelected = data.imageStyle === style.id

          return (
            <button
              key={style.id}
              type="button"
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  imageStyle: style.id,
                  // Reset custom text if switching away from custom
                  customStyleText: style.id !== 'custom' ? '' : prev.customStyleText,
                }))
              }
              disabled={isSubmitting}
              className={`
                relative rounded-lg overflow-hidden border-2 transition-all text-left
                ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-2'
                    : 'border-gray-200 hover:border-blue-300'
                }
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {/* Thumbnail area */}
              <div className="relative w-full aspect-[4/3] bg-gray-100">
                <Image
                  src={style.thumbnailUrl}
                  alt={style.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                  unoptimized
                />
                {/* Placeholder shown behind image in case it fails */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <span className="text-xs text-gray-400 text-center px-2">{style.name}</span>
                </div>
              </div>

              {/* Style info */}
              <div className="p-3 bg-white">
                <p className={`text-xs font-semibold mb-1 ${isSelected ? 'text-blue-600' : 'text-gray-800'}`}>
                  {style.name}
                </p>
                <p className="text-xs text-gray-500 leading-snug line-clamp-2">
                  {style.description}
                </p>
              </div>

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Custom style text input — expands when Custom is selected */}
      {isCustomSelected && (
        <div className="mt-4">
          <label htmlFor="customStyleText" className="block text-sm font-medium text-gray-700 mb-1">
            Describe your custom style
          </label>
          <textarea
            id="customStyleText"
            value={data.customStyleText}
            onChange={(e) => setData((prev) => ({ ...prev, customStyleText: e.target.value }))}
            rows={3}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
            placeholder="Describe your desired image style..."
          />
        </div>
      )}

      {errors.imageStyle && (
        <p className="text-red-500 text-sm mt-3">{errors.imageStyle}</p>
      )}
    </div>
  )
}
