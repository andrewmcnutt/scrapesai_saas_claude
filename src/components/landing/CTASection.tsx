"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "./AnimatedSection";

export function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <AnimatedSection>
        <div className="max-w-4xl mx-auto rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to create your first carousel?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of creators using ScrapesAI to build beautiful,
            engaging carousels in seconds.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            <Link href="/signup">Get Started Free</Link>
          </Button>
        </div>
      </AnimatedSection>
    </section>
  );
}
