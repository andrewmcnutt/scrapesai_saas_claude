import { z } from 'zod'

/**
 * Full generation form schema — validates all wizard steps combined.
 * Used for final submission before API call.
 */
export const GenerationSchema = z.object({
  topic: z.string()
    .min(5, 'Topic must be at least 5 characters')
    .max(200, 'Topic must be less than 200 characters'),
  keyPoints: z.string()
    .min(10, 'Key points must be at least 10 characters')
    .max(1000, 'Key points must be less than 1000 characters'),
  tone: z.string()
    .min(1, 'Please select a tone'),
  templateUrl: z.string()
    .url('Please select a valid template'),
  imageStyle: z.string()
    .min(1, 'Please select an image style'),
})

export type GenerationFormData = z.infer<typeof GenerationSchema>

/**
 * Idea step schema — validates the first wizard step.
 * Covers topic, key points, and tone selection.
 */
export const IdeaStepSchema = z.object({
  topic: z.string()
    .min(5, 'Topic must be at least 5 characters')
    .max(200, 'Topic must be less than 200 characters'),
  keyPoints: z.string()
    .min(10, 'Key points must be at least 10 characters')
    .max(1000, 'Key points must be less than 1000 characters'),
  tone: z.string()
    .min(1, 'Please select a tone'),
})

export type IdeaStepData = z.infer<typeof IdeaStepSchema>

/**
 * Template step schema — validates the template selection step.
 */
export const TemplateStepSchema = z.object({
  templateUrl: z.string()
    .url('Please select a valid template'),
})

export type TemplateStepData = z.infer<typeof TemplateStepSchema>

/**
 * Style step schema — validates the image style selection step.
 */
export const StyleStepSchema = z.object({
  imageStyle: z.string()
    .min(1, 'Please select an image style'),
})

export type StyleStepData = z.infer<typeof StyleStepSchema>

/**
 * N8N callback schema — validates the webhook payload sent by N8N on completion.
 * Used in the POST /api/carousels/callback route handler.
 */
export const N8nCallbackSchema = z.object({
  job_id: z.string().uuid(),
  image_urls: z.array(z.string().url()).min(1).max(15),
  post_body_text: z.string().min(1),
  status: z.enum(['completed', 'failed']).optional().default('completed'),
})

export type N8nCallbackPayload = z.infer<typeof N8nCallbackSchema>
