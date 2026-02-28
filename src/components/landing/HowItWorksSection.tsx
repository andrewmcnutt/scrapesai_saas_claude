"use client";

import { AnimatedSection } from "./AnimatedSection";

const steps = [
  {
    number: 1,
    title: "Describe Your Idea",
    description:
      "Tell us what your carousel is about. Enter a topic, paste an article, or just share a rough idea.",
  },
  {
    number: 2,
    title: "Choose Your Style",
    description:
      "Pick a template and customize the look. Select colors, fonts, and layout that match your brand.",
  },
  {
    number: 3,
    title: "Download & Share",
    description:
      "Download your carousel as images or a PDF. Share directly to LinkedIn or any other platform.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            How it works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create your first carousel in three simple steps.
          </p>
        </AnimatedSection>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-8 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 bg-gray-200" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {steps.map((step, index) => (
              <AnimatedSection
                key={step.number}
                delay={index * 0.15}
                className="text-center"
              >
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white text-xl font-bold mb-6">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
