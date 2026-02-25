'use client'

import type { WizardFormData } from './GenerationWizard'

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
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Describe Your Idea</h2>
      <p className="text-sm text-gray-500 mb-6">
        Tell us what your carousel is about and we&apos;ll help you create something great.
      </p>

      <div className="space-y-5">
        {/* Topic input */}
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
            What&apos;s your carousel about?
          </label>
          <input
            type="text"
            id="topic"
            value={data.topic}
            onChange={(e) => setData((prev) => ({ ...prev, topic: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 5 productivity tips for remote workers"
          />
          {errors.topic && (
            <p className="text-red-500 text-sm mt-1">{errors.topic}</p>
          )}
        </div>

        {/* Key Points textarea */}
        <div>
          <label htmlFor="keyPoints" className="block text-sm font-medium text-gray-700 mb-1">
            Key points to cover
          </label>
          <textarea
            id="keyPoints"
            value={data.keyPoints}
            onChange={(e) => setData((prev) => ({ ...prev, keyPoints: e.target.value }))}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="List the main points you want to include in your carousel. One per line."
          />
          {errors.keyPoints && (
            <p className="text-red-500 text-sm mt-1">{errors.keyPoints}</p>
          )}
        </div>

        {/* Tone selector */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">Tone</p>
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setData((prev) => ({ ...prev, tone: option.value }))}
                className={`
                  px-4 py-2 text-sm font-medium rounded-full border transition-colors
                  ${
                    data.tone === option.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
          {errors.tone && (
            <p className="text-red-500 text-sm mt-1">{errors.tone}</p>
          )}
        </div>
      </div>
    </div>
  )
}
