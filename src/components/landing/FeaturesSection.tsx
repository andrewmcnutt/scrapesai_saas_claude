"use client";

import { Sparkles, Layout, Palette } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AnimatedSection } from "./AnimatedSection";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Content",
    description:
      "Generate compelling carousel copy from a simple prompt. Our AI crafts engaging slides that resonate with your audience.",
  },
  {
    icon: Layout,
    title: "Professional Templates",
    description:
      "Choose from a curated library of beautiful templates designed for maximum engagement on LinkedIn and social media.",
  },
  {
    icon: Palette,
    title: "Brand Consistency",
    description:
      "Maintain your brand identity across every carousel with customizable colors, fonts, and styling options.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to create engaging carousels
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful features that make carousel creation effortless and
            professional.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <AnimatedSection key={feature.title} delay={index * 0.15}>
              <Card className="h-full">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
