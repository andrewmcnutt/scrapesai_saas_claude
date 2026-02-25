import { GenerationWizard } from '@/components/generation/GenerationWizard'

export default function GeneratePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create Carousel</h1>
        <p className="text-gray-600 mt-1">Follow the steps below to generate your branded carousel</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-8">
        <GenerationWizard />
      </div>
    </div>
  )
}
