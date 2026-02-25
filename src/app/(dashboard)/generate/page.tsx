import { GenerationWizard } from '@/components/generation/GenerationWizard'

export default async function GeneratePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const defaultValues = {
    topic: params.topic,
    keyPoints: params.keyPoints,
    tone: params.tone,
    templateUrl: params.templateUrl,
    imageStyle: params.imageStyle,
    customStyleText: params.customStyleText,
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create Carousel</h1>
        <p className="text-gray-600 mt-1">Follow the steps below to generate your branded carousel</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-8">
        <GenerationWizard defaultValues={defaultValues} />
      </div>
    </div>
  )
}
