import { z } from 'zod'

export const BrandProfileSchema = z.object({
  brandName: z.string()
    .min(2, 'Brand name must be at least 2 characters')
    .max(50, 'Brand name must be less than 50 characters'),
  primaryColor: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Primary color must be a valid hex color'),
  secondaryColor: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Secondary color must be a valid hex color'),
  voiceGuidelines: z.string()
    .min(10, 'Voice guidelines must be at least 10 characters')
    .max(500, 'Voice guidelines must be less than 500 characters'),
  productDescription: z.string()
    .min(10, 'Product description must be at least 10 characters')
    .max(500, 'Product description must be less than 500 characters'),
  targetAudience: z.string()
    .min(10, 'Target audience must be at least 10 characters')
    .max(200, 'Target audience must be less than 200 characters'),
  ctaText: z.string()
    .min(2, 'CTA text must be at least 2 characters')
    .max(30, 'CTA text must be less than 30 characters'),
})

export type BrandProfile = z.infer<typeof BrandProfileSchema>
