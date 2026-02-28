import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function GenerateLoading() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>

      <Card>
        <CardContent className="p-8 space-y-6">
          {/* Step indicator skeleton */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-3 w-12 mt-1" />
                </div>
                {step < 3 && <Skeleton className="flex-1 h-0.5 mx-2 mb-5" />}
              </div>
            ))}
          </div>

          {/* Form fields skeleton */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-28 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-28 rounded-full" />
                ))}
              </div>
            </div>
          </div>

          <Skeleton className="h-px w-full mt-8" />
          <div className="flex justify-end">
            <Skeleton className="h-10 w-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
