'use client'

import Image from 'next/image'
import { IMAGE_STYLES } from '@/lib/carousel/constants'
import type { WizardFormData } from './GenerationWizard'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

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
      <h2 className="text-lg font-semibold mb-1">Select Image Style</h2>
      <p className="text-sm text-muted-foreground mb-6">
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
                  customStyleText: style.id !== 'custom' ? '' : prev.customStyleText,
                }))
              }
              disabled={isSubmitting}
              className={cn(
                'relative rounded-xl border bg-card text-card-foreground shadow overflow-hidden text-left transition-all border-2',
                isSelected
                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                  : 'border-border hover:border-primary/50',
                isSubmitting && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Thumbnail area */}
              <div className="relative w-full aspect-[4/3] bg-muted">
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
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/80">
                  <span className="text-xs text-muted-foreground text-center px-2">{style.name}</span>
                </div>
              </div>

              {/* Style info */}
              <div className="p-3">
                <p className={cn('text-xs font-semibold mb-1', isSelected ? 'text-primary' : 'text-foreground')}>
                  {style.name}
                </p>
                <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                  {style.description}
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

      {/* Custom style text input */}
      {isCustomSelected && (
        <div className="mt-4 space-y-2">
          <Label htmlFor="customStyleText">Describe your custom style</Label>
          <Textarea
            id="customStyleText"
            value={data.customStyleText}
            onChange={(e) => setData((prev) => ({ ...prev, customStyleText: e.target.value }))}
            rows={3}
            disabled={isSubmitting}
            placeholder="Describe your desired image style..."
          />
        </div>
      )}

      {errors.imageStyle && (
        <p className="text-destructive text-sm mt-3">{errors.imageStyle}</p>
      )}
    </div>
  )
}
