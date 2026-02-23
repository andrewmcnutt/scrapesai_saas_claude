# Phase 3: Carousel Generation - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can generate professional carousels from ideas, select templates and image styles, view generated content with slides and post body text, download as zip, regenerate, and browse full carousel history. Credit deduction, async N8N processing, timeout/refund handling, and N8N migration from Airtable to Supabase are all in scope. New generation capabilities (e.g., video, multi-format export) are not.

</domain>

<decisions>
## Implementation Decisions

### Generation form layout
- Stepped wizard flow: Step 1 (Idea) -> Step 2 (Template) -> Step 3 (Style) -> Generate
- Each step shown one at a time, guided progression

### Idea input
- Structured fields: separate inputs for topic, key points, and tone
- Not a single free-form text area — give the user guidance and structure

### Template selection
- Visual grid of 5-6 template preview thumbnails
- User clicks a thumbnail to select — all options visible at once
- Selected template gets a highlighted/active state

### Image style picker
- Style cards with visual preview for each of the 4 presets
- Each card shows an example of that style so the user knows what they're choosing
- "Custom" option expands an input field for user-defined style description

### Slide navigation
- Slide-by-slide view with left/right arrows for navigation
- Thumbnail strip below the main slide viewer for jumping to specific slides
- Large preview of the current slide as the focal point

### Post body text placement
- Post body text displayed in a text section below the slide viewer
- Clearly separated from the slide content

### Action placement
- Download ZIP and Regenerate buttons in an action bar below the slides, after the post body text

### Generation completion flow
- Brief success screen ("Your carousel is ready!") with a "View Carousel" button
- Not a direct transition — give the user a moment before showing slides

### Claude's Discretion
- Wait experience during 60-180s generation (progress indicators, animations, whether user can navigate away)
- History browsing layout (card grid vs list, info per entry, pagination style)
- Loading states and error handling
- Exact wizard step transitions and animations
- Thumbnail strip styling and behavior
- Empty state for history page

</decisions>

<specifics>
## Specific Ideas

No specific references — open to standard approaches for the visual implementation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-carousel-generation*
*Context gathered: 2026-02-22*
