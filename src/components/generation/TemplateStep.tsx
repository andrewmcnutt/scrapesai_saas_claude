'use client'

import Image from 'next/image'
import { TEMPLATES } from '@/lib/carousel/constants'
import type { WizardFormData } from './GenerationWizard'

type TemplateStepProps = {
  data: WizardFormData
  setData: React.Dispatch<React.SetStateAction<WizardFormData>>
  errors: Partial<Record<keyof WizardFormData, string>>
}

export function TemplateStep({ data, setData, errors }: TemplateStepProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Choose a Template</h2>
      <p className="text-sm text-gray-500 mb-6">
        Select a visual layout for your carousel. Each template is designed for a specific type of content.
      </p>

      <div className="grid grid-cols-3 gap-4">
        {TEMPLATES.map((template) => {
          const isSelected = data.templateUrl === template.url

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => setData((prev) => ({ ...prev, templateUrl: template.url }))}
              className={`
                relative rounded-lg overflow-hidden border-2 transition-all text-left
                ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-2 scale-105'
                    : 'border-gray-200 hover:border-blue-300'
                }
              `}
            >
              {/* Thumbnail area */}
              <div className="relative w-full aspect-[4/3] bg-gray-100">
                <Image
                  src={template.thumbnailUrl}
                  alt={template.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    // If thumbnail not available, hide it and show placeholder
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                  unoptimized
                />
                {/* Placeholder shown behind image in case it fails */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <span className="text-xs text-gray-400 text-center px-2">{template.name}</span>
                </div>
              </div>

              {/* Template name */}
              <div className="p-2 bg-white">
                <p className={`text-xs font-medium truncate ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}>
                  {template.name}
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

      {errors.templateUrl && (
        <p className="text-red-500 text-sm mt-3">{errors.templateUrl}</p>
      )}
    </div>
  )
}
