'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepIndicator } from './StepIndicator'
import { IdeaStep } from './IdeaStep'
import { TemplateStep } from './TemplateStep'
import { StyleStep } from './StyleStep'
import { initiateGeneration } from '@/app/(dashboard)/generate/actions'
import { IdeaStepSchema, TemplateStepSchema, StyleStepSchema } from '@/lib/validations/carousel'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

const STEPS = [
  { id: 'idea', label: 'Idea' },
  { id: 'template', label: 'Template' },
  { id: 'style', label: 'Style' },
]

export type WizardFormData = {
  topic: string
  keyPoints: string
  tone: string
  templateUrl: string
  imageStyle: string
  customStyleText: string
}

type WizardErrors = Partial<Record<keyof WizardFormData, string>>

type DefaultValues = Partial<WizardFormData>

type GenerationWizardProps = {
  defaultValues?: DefaultValues
}

export function GenerationWizard({ defaultValues }: GenerationWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<WizardFormData>({
    topic: defaultValues?.topic ?? '',
    keyPoints: defaultValues?.keyPoints ?? '',
    tone: defaultValues?.tone ?? 'professional',
    templateUrl: defaultValues?.templateUrl ?? '',
    imageStyle: defaultValues?.imageStyle ?? '',
    customStyleText: '',
  })
  const [errors, setErrors] = useState<WizardErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function handleNext() {
    setErrors({})

    if (currentStep === 0) {
      const result = IdeaStepSchema.safeParse({
        topic: formData.topic,
        keyPoints: formData.keyPoints,
        tone: formData.tone,
      })
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors
        setErrors({
          topic: fieldErrors.topic?.[0],
          keyPoints: fieldErrors.keyPoints?.[0],
          tone: fieldErrors.tone?.[0],
        })
        return
      }
    }

    if (currentStep === 1) {
      const result = TemplateStepSchema.safeParse({
        templateUrl: formData.templateUrl,
      })
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors
        setErrors({
          templateUrl: fieldErrors.templateUrl?.[0],
        })
        return
      }
    }

    setCurrentStep((prev) => prev + 1)
  }

  function handleBack() {
    setErrors({})
    setCurrentStep((prev) => prev - 1)
  }

  async function handleSubmit() {
    setErrors({})
    setSubmitError(null)

    // Determine effective imageStyle: if custom, use the custom text
    const effectiveImageStyle =
      formData.imageStyle === 'custom' ? formData.customStyleText : formData.imageStyle

    const result = StyleStepSchema.safeParse({
      imageStyle: effectiveImageStyle,
    })
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      setErrors({
        imageStyle: fieldErrors.imageStyle?.[0],
      })
      return
    }

    setIsSubmitting(true)

    try {
      const fd = new FormData()
      fd.append('topic', formData.topic)
      fd.append('keyPoints', formData.keyPoints)
      fd.append('tone', formData.tone)
      fd.append('templateUrl', formData.templateUrl)
      fd.append('imageStyle', effectiveImageStyle)

      const response = await initiateGeneration(null, fd)

      if (response.success && response.job_id) {
        router.push(`/carousel/${response.job_id}`)
      } else {
        setSubmitError(response.message ?? 'Could not start generation. Please check your connection and try again.')
        setIsSubmitting(false)
      }
    } catch {
      setSubmitError('Could not start generation. Please check your connection and try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <StepIndicator steps={STEPS} currentStep={currentStep} />

        <div className="min-h-[300px]">
          {currentStep === 0 && (
            <IdeaStep data={formData} setData={setFormData} errors={errors} />
          )}
          {currentStep === 1 && (
            <TemplateStep data={formData} setData={setFormData} errors={errors} />
          )}
          {currentStep === 2 && (
            <StyleStep
              data={formData}
              setData={setFormData}
              errors={errors}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {submitError && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between mt-8 pt-6 border-t">
          <div>
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Back
              </Button>
            )}
          </div>

          <div>
            {currentStep < 2 ? (
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Generating...' : 'Generate'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
