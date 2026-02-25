/**
 * Carousel generation constants
 *
 * Templates and image styles used throughout the generation wizard.
 * Thumbnail URLs use local placeholders; template_url is the actual
 * external template URL sent to the N8N generation pipeline.
 */

export const TEMPLATES = [
  {
    id: 'professional-grid',
    name: 'Professional Grid',
    url: 'https://templates.scrapesai.com/professional-grid',
    thumbnailUrl: '/templates/professional-grid.png',
  },
  {
    id: 'bold-statement',
    name: 'Bold Statement',
    url: 'https://templates.scrapesai.com/bold-statement',
    thumbnailUrl: '/templates/bold-statement.png',
  },
  {
    id: 'story-arc',
    name: 'Story Arc',
    url: 'https://templates.scrapesai.com/story-arc',
    thumbnailUrl: '/templates/story-arc.png',
  },
  {
    id: 'data-driven',
    name: 'Data Driven',
    url: 'https://templates.scrapesai.com/data-driven',
    thumbnailUrl: '/templates/data-driven.png',
  },
  {
    id: 'tips-listicle',
    name: 'Tips Listicle',
    url: 'https://templates.scrapesai.com/tips-listicle',
    thumbnailUrl: '/templates/tips-listicle.png',
  },
  {
    id: 'case-study',
    name: 'Case Study',
    url: 'https://templates.scrapesai.com/case-study',
    thumbnailUrl: '/templates/case-study.png',
  },
] as const

export const IMAGE_STYLES = [
  {
    id: 'technical-annotation',
    name: 'Technical Annotation',
    description: 'Clean diagrams with precise labels and callouts for technical concepts',
    thumbnailUrl: '/styles/technical-annotation.png',
  },
  {
    id: 'realism-notebook',
    name: 'Realism Notebook',
    description: 'Photorealistic notebook-style sketches with handwritten annotations',
    thumbnailUrl: '/styles/realism-notebook.png',
  },
  {
    id: 'white-board-diagram',
    name: 'White Board Diagram',
    description: 'Simple whiteboard-style drawings with marker strokes and arrows',
    thumbnailUrl: '/styles/white-board-diagram.png',
  },
  {
    id: 'comic-strip-storyboard',
    name: 'Comic Strip Storyboard',
    description: 'Bold illustrated panels in comic book style to tell a visual story',
    thumbnailUrl: '/styles/comic-strip-storyboard.png',
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Describe your own image style in the generation prompt',
    thumbnailUrl: '/styles/custom.png',
  },
] as const

/**
 * Carousel status values — use this instead of raw strings to avoid typos
 */
export const CAROUSEL_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
} as const

export type CarouselStatus = (typeof CAROUSEL_STATUS)[keyof typeof CAROUSEL_STATUS]

/**
 * Maximum time (ms) the frontend will poll for generation results.
 * After this, the job is considered timed out client-side.
 */
export const MAX_POLL_TIMEOUT_MS = 300000 // 5 minutes

/**
 * Initial delay (ms) before the first poll attempt.
 * Generation typically takes 60-180s, so start checking after 2s.
 */
export const POLL_STARTING_DELAY_MS = 2000
