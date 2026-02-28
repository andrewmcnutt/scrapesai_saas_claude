"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnimatedSection } from "./AnimatedSection";

const plans = [
  {
    name: "Free Plan",
    price: "$0",
    period: "forever",
    description: "3 carousels",
    highlighted: false,
    buttonText: "Get Started",
    buttonVariant: "outline" as const,
    features: [
      "3 carousel credits",
      "Basic templates",
      "Standard image quality",
      "Download as images",
    ],
  },
  {
    name: "Pro Plan",
    price: "$29.99",
    period: "/mo",
    description: "10 credits/month with rollover",
    highlighted: true,
    buttonText: "Start Pro Plan",
    buttonVariant: "default" as const,
    features: [
      "10 credits per month",
      "Unused credits roll over",
      "All premium templates",
      "High-resolution exports",
      "Priority AI generation",
      "Brand kit support",
    ],
  },
];

export function PricingSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start for free, upgrade when you need more.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <AnimatedSection key={plan.name} delay={index * 0.15}>
              <Card
                className={cn(
                  "h-full flex flex-col",
                  plan.highlighted && "ring-2 ring-blue-600 relative"
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 hover:bg-blue-600">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  </div>
                  <CardDescription className="text-base mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="flex-1 pt-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-blue-600 shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    asChild
                    variant={plan.buttonVariant}
                    size="lg"
                    className="w-full"
                  >
                    <Link href="/signup">{plan.buttonText}</Link>
                  </Button>
                </CardFooter>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
