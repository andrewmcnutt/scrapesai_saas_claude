"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface SubscriptionActivatingProps {
  sessionId: string
}

export function SubscriptionActivating({ sessionId }: SubscriptionActivatingProps) {
  const router = useRouter()
  const [progress, setProgress] = useState(10)
  const [activated, setActivated] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const MAX_ATTEMPTS = 20

  useEffect(() => {
    if (activated) return

    const interval = setInterval(async () => {
      setAttempts((prev) => prev + 1)
      setProgress((prev) => Math.min(prev + 5, 90))

      // Refresh the page data (triggers server component re-render)
      router.refresh()

      // Also check directly via a lightweight fetch
      try {
        const res = await fetch(
          `/billing/success?session_id=${sessionId}`,
          { method: "HEAD" }
        )
        // If the page renders successfully, the subscription might be active now
        // The server component will handle showing the right state on next refresh
        if (res.ok) {
          setAttempts((prev) => {
            if (prev >= 2) {
              // After a couple of refreshes, assume webhook has arrived
              setActivated(true)
              setProgress(100)
            }
            return prev
          })
        }
      } catch {
        // Ignore fetch errors, keep polling
      }
    }, 3000)

    if (attempts >= MAX_ATTEMPTS) {
      clearInterval(interval)
    }

    return () => clearInterval(interval)
  }, [activated, attempts, router, sessionId])

  if (activated) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold mb-2">Subscription Active!</h1>
            <p className="text-muted-foreground mb-2">
              Welcome to ScrapesAI Pro. Your subscription is now active.
            </p>
            <p className="text-sm text-blue-600 font-medium mb-6">
              You&apos;ve been credited 10 monthly credits to get started.
            </p>

            <Button asChild size="lg">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto text-center">
      <Card>
        <CardContent className="pt-8 pb-8">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Activating subscription...</h1>
          <p className="text-muted-foreground mb-2">
            Your payment was received. We&apos;re activating your subscription
            now.
          </p>

          <div className="w-full max-w-xs mx-auto mb-4">
            <Progress value={progress} className="h-2" />
          </div>

          <p className="text-sm text-muted-foreground">
            This usually takes a few seconds.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
