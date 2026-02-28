# N8N Workflow Guide

This documents the contract between the ScrapesAI app and the N8N carousel generation workflow. The current workflow returns **placeholder images** (picsum.photos). Use this guide to replace the placeholder node with real AI image generation.

## Workflow ID

`iRHmbXPLGMb01tZi` — [Open in N8N editor](https://andrewmcnutt.app.n8n.cloud/workflow/iRHmbXPLGMb01tZi)

## Pipeline Overview

```
Webhook (POST) → Map Payload → Generate Placeholders → Send Results (HMAC + HTTP callback)
```

The only node you need to replace is **Generate Placeholders**.

---

## Inbound Payload

The app sends this JSON to the N8N webhook when a user submits a generation request:

```json
{
  "job_id": "uuid",
  "idea": {
    "topic": "5 Tips for Remote Work",
    "key_points": "productivity, boundaries, tools",
    "tone": "professional"
  },
  "template_url": "https://templates.scrapesai.com/professional-grid",
  "image_style": "technical-annotation",
  "brand": {
    "name": "Acme Corp",
    "primary_color": "#1a1a2e",
    "secondary_color": "#e94560",
    "voice_guidelines": "Professional and approachable",
    "product_description": "SaaS productivity suite",
    "target_audience": "Remote workers and team leads",
    "cta_text": "Try it free"
  }
}
```

### Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `job_id` | UUID | Carousel row ID — must be included in the callback |
| `idea.topic` | string | Main topic for the carousel |
| `idea.key_points` | string | Comma-separated key points |
| `idea.tone` | string | `professional`, `casual`, `educational`, or `inspirational` |
| `template_url` | string | Template identifier URL |
| `image_style` | string | `technical-annotation`, `realism-notebook`, `white-board-diagram`, `comic-strip-storyboard`, or `custom` |
| `brand.*` | object | User's brand profile for consistent styling |

---

## Callback Payload

The N8N workflow must POST this JSON back to the app when generation completes:

**URL**: `https://scrapesai-saas-claude.vercel.app/api/webhooks/n8n/callback`

```json
{
  "job_id": "uuid",
  "image_urls": [
    "https://example.com/slide-1.png",
    "https://example.com/slide-2.png",
    "https://example.com/slide-3.png"
  ],
  "post_body_text": "LinkedIn post text to accompany the carousel...",
  "status": "completed"
}
```

### Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `job_id` | UUID | Must match the `job_id` from the inbound payload |
| `image_urls` | string[] | Array of public image URLs (one per carousel slide) |
| `post_body_text` | string | Suggested LinkedIn post copy |
| `status` | `"completed"` or `"failed"` | Generation result status |

On failure, send `status: "failed"` — `image_urls` and `post_body_text` can be empty arrays/strings.

---

## HMAC Signing

The callback must be signed with HMAC-SHA256. The **Send Results** Code node already handles this — no changes needed there.

**How it works:**
1. Stringify the callback JSON body
2. Compute HMAC-SHA256 using the shared secret
3. Send the hex digest in the `x-n8n-signature` header

The shared secret is hardcoded in the Send Results node and must match the `N8N_WEBHOOK_SECRET` env var in the app.

---

## What to Replace

The **Generate Placeholders** node currently returns:

- 5 picsum.photos URLs as `image_urls`
- A placeholder LinkedIn post as `post_body_text`

Replace this node with your real AI generation logic. For example:

1. Use a **Gemini** or **OpenAI** node (configured via N8N credentials) to generate images based on the `idea`, `image_style`, and `brand` fields
2. Upload generated images to cloud storage and collect the public URLs
3. Use an LLM node to generate the `post_body_text` based on the topic and brand voice
4. Pass `job_id`, `image_urls`, `post_body_text`, and `status: "completed"` to the Send Results node

The **Send Results** node handles HMAC signing and the HTTP callback — it does not need changes.

---

## Timeout Behavior

If the workflow does not call back within **5 minutes**, the app's cron job (`/api/cron/refund-timeouts`) marks the carousel as `timeout` and refunds the user's credit. Make sure your AI generation completes within this window.
