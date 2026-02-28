'use client'

import Image from 'next/image'
import { TEMPLATES } from '@/lib/carousel/constants'
import type { WizardFormData } from './GenerationWizard'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type TemplateStepProps = {
  data: WizardFormData
  setData: React.Dispatch<React.SetStateAction<WizardFormData>>
  errors: Partial<Record<keyof WizardFormData, string>>
}

export function TemplateStep({ data, setData, errors }: TemplateStepProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Choose a Template</h2>
      <p className="text-sm text-muted-foreground mb-6">
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
              className={cn(
                'relative rounded-xl border bg-card text-card-foreground shadow overflow-hidden text-left transition-all border-2',
                isSelected
                  ? 'border-primary ring-2 ring-primary ring-offset-2 scale-105'
                  : 'border-border hover:border-primary/50'
              )}
            >
              {/* Thumbnail area */}
              <div className="relative w-full aspect-[4/3] bg-muted">
                <Image
                  src={template.thumbnailUrl}
                  alt={template.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                  unoptimized
                />
                {/* Placeholder shown behind image in case it fails */}
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <span className="text-xs text-muted-foreground text-center px-2">{template.name}</span>
                </div>
              </div>

              {/* Template name */}
              <div className="p-2">
                <p className={cn('text-xs font-medium truncate', isSelected ? 'text-primary' : 'text-foreground')}>
                  {template.name}
                </p>
              </div>

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {errors.templateUrl && (
        <p className="text-destructive text-sm mt-3">{errors.templateUrl}</p>
      )}
    </div>
  )
}
