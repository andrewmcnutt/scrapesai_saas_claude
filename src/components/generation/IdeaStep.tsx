'use client'

import type { WizardFormData } from './GenerationWizard'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'educational', label: 'Educational' },
  { value: 'conversational', label: 'Conversational' },
]

type IdeaStepProps = {
  data: WizardFormData
  setData: React.Dispatch<React.SetStateAction<WizardFormData>>
  errors: Partial<Record<keyof WizardFormData, string>>
}

export function IdeaStep({ data, setData, errors }: IdeaStepProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Describe Your Idea</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Tell us what your carousel is about and we&apos;ll help you create something great.
      </p>

      <div className="space-y-5">
        {/* Topic input */}
        <div className="space-y-2">
          <Label htmlFor="topic">What&apos;s your carousel about?</Label>
          <Input
            type="text"
            id="topic"
            value={data.topic}
            onChange={(e) => setData((prev) => ({ ...prev, topic: e.target.value }))}
            placeholder="e.g., 5 productivity tips for remote workers"
          />
          {errors.topic && (
            <p className="text-destructive text-sm">{errors.topic}</p>
          )}
        </div>

        {/* Key Points textarea */}
        <div className="space-y-2">
          <Label htmlFor="keyPoints">Key points to cover</Label>
          <Textarea
            id="keyPoints"
            value={data.keyPoints}
            onChange={(e) => setData((prev) => ({ ...prev, keyPoints: e.target.value }))}
            rows={5}
            placeholder="List the main points you want to include in your carousel. One per line."
          />
          {errors.keyPoints && (
            <p className="text-destructive text-sm">{errors.keyPoints}</p>
          )}
        </div>

        {/* Tone selector */}
        <div className="space-y-2">
          <Label>Tone</Label>
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={data.tone === option.value ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => setData((prev) => ({ ...prev, tone: option.value }))}
              >
                {option.label}
              </Button>
            ))}
          </div>
          {errors.tone && (
            <p className="text-destructive text-sm">{errors.tone}</p>
          )}
        </div>
      </div>
    </div>
  )
}
