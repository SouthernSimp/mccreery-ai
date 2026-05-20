# Fortis Pitch Package — Recovery + Visual Flow + CFO Mockup Demo

## Context (what just happened)
- Previous Hermes session over-edited the **Fortis Proposal Google Doc**. Nate has restored it to the original. We are NOT touching the Doc body again this pass — only additive assets that live outside it.
- A separate Hermes is currently working the **mccreery.ai website** repo. Stay out of that lane. This plan is for the *pitch deliverables* directed at Andy (Fortis dev ops) and the Fortis CFO.
- Existing assets confirmed on disk:
  - 8 design variants under `/Users/nate/mccreery-ai/variants/` (vault, espresso, midnight, aurora, terminal, linear, amber, calm) + `index.html` gallery.
  - Skills already exist: `fortis-proposal-improvements`, `fortis-proposal-content-template`, `fortis-proposal-content-improvements`, `agentic-pitch-package`.
- Andy's stated wants (from prior sessions): a **visual flow diagram** + concrete examples of what Nate can deliver. CFO is the budget gate — they need something *clickable / presentable*, not a wall of text.

## Goal
Ship three things that strengthen the Fortis pitch without re-touching the restored Proposal Doc:

1. **Visual flow image** — one polished image (or 2–3 panel set) showing the discovery → build → deploy → support workflow Nate proposes for Fortis. Generated via image gen, hand-picked, then linked from the Proposal as an attachment.
2. **CFO mockup deck** — a single interactive HTML page that walks through 4 website concepts tailored to Fortis. Hosted at a real URL so Andy can forward one link to the CFO.
3. **One-pager "what you're getting"** addendum (separate from the Proposal) the CFO can skim in 60 seconds.

## Proposed approach

### Part 1 — Visual flow image (image gen)
- Use **comfyui** or fall back to an external image-gen call (skill: `creative/comfyui` if running locally; otherwise OpenAI image API or similar).
- Two candidate styles:
  - **A (Stripe-clean):** isometric flow on a near-white card, deep blue accent (matches Forceaisecurity reference Andy liked).
  - **B (Pinesmith-terminal):** dark canvas, pine-green nodes connected by glowing lines (matches Pinesmith.ai reference).
- Generate 4 candidates per style → Nate picks 1. Export at 1600×900 PNG + 1:1 thumbnail.
- Output dir: `/Users/nate/mccreery-ai/assets/fortis/flow/` (new).
- Deliverable: signed-off PNG + short caption text Nate can paste into the Proposal as a labeled figure (no body rewrites — just inserts the image where the original had a "[visual TBD]" placeholder, if any).

### Part 2 — CFO interactive mockup of 4 websites
- Build a single page: `/Users/nate/mccreery-ai/fortis-cfo/index.html`
- Layout: full-bleed hero → "4 directions we could take fortispay.com" → 4 cards, each click expands to an iframe (or full-screen modal) showing a *Fortis-themed* recolor of one existing variant. No external fetches — everything inline so it works on the CFO's locked-down laptop.
- The 4 directions (pulled from variants that best fit a fintech audience):
  1. **Midnight** (Stripe-style trust, deep blue/black) → branded `Fortis Midnight`
  2. **Vault** (teal vault, payment-security cue) → `Fortis Vault`
  3. **Linear** (violet product-shot, modern SaaS) → `Fortis Linear`
  4. **Terminal** (pine green console, dev/ops cred — Andy's world) → `Fortis Terminal`
- Each card includes: 2-line positioning, who it's for, 1 screenshot still + a "Live preview" button → iframe to the recolored variant.
- Recolors are token-only edits on copies in `fortis-cfo/variants/<name>.html` so the originals stay intact for the other Hermes working the site.
- Deploy via Cloudflare Pages (repo already wired) at e.g. `https://mccreery.ai/fortis-cfo/` or as a preview branch URL the CFO can click.

### Part 3 — One-pager addendum
- File: `/Users/nate/mccreery-ai/fortis-cfo/one-pager.html` (and printable PDF export).
- Sections: deliverables list, timeline, price tiers (whatever Nate has settled on — leave `{{PRICE_TBD}}` if not yet locked), single CTA. Match the chosen flow-image style so the package feels cohesive.

## Step-by-step

1. Confirm with Nate: which style direction for the flow image — A (Stripe-clean) or B (Pinesmith-terminal)? Default to **A** if no answer, because Andy's CFO is the audience and clean > edgy for finance.
2. Generate 4 flow-image candidates in the chosen style. Save under `assets/fortis/flow/candidates/`. Show Nate the contact sheet, pick the winner.
3. Scaffold `fortis-cfo/` directory: copy the 4 chosen variants, run a Fortis-color-token pass on each (single CSS var block per file — no structural edits).
4. Build `fortis-cfo/index.html`: gallery + modal/iframe viewer. Keep dependencies = zero. Inline SVG icons.
5. Add `fortis-cfo/one-pager.html`. Wire same color tokens.
6. Local QA: open in Chrome, walk all 4 previews, check on a 13" viewport (CFO laptop class).
7. Commit on a branch `fortis-cfo-package`, push, let Cloudflare Pages build a preview URL.
8. Hand Nate: (a) the preview URL, (b) the chosen flow image PNG + suggested caption, (c) the one-pager URL + PDF.
9. Nate inserts the flow image into the restored Proposal Doc himself (we do NOT script edits into that Doc this round) and forwards the preview URL to Andy.

## Files likely to change / be created
- New: `/Users/nate/mccreery-ai/assets/fortis/flow/` (image candidates + winner)
- New: `/Users/nate/mccreery-ai/fortis-cfo/index.html`
- New: `/Users/nate/mccreery-ai/fortis-cfo/one-pager.html`
- New: `/Users/nate/mccreery-ai/fortis-cfo/variants/{midnight,vault,linear,terminal}.html` (recolored copies)
- New: `/Users/nate/mccreery-ai/fortis-cfo/assets/tokens.css` (Fortis brand vars)
- Untouched: everything under `/Users/nate/mccreery-ai/variants/` (the other Hermes owns the site), and the Fortis Proposal Google Doc body.

## Validation
- All 4 variant copies open standalone with no console errors.
- `fortis-cfo/index.html` works offline (no external CDN calls) — verify via DevTools network tab with cache disabled + offline mode.
- Preview URL renders identically on Cloudflare Pages preview build.
- Flow image: print-test at 100% — text readable, no banding.
- One-pager prints to clean single-page PDF.

## Risks / open questions
- **Lane collision:** the other Hermes is in the same repo. Mitigation: do all work on branch `fortis-cfo-package`, never touch `/variants/` or root files. Need Nate to confirm the other agent isn't also branching off main.
- **Image-gen tool availability:** ComfyUI requires local setup. If not running, fall back to whichever image API is wired (need Nate to confirm — OpenAI? FAL? Replicate?). Open Q.
- **Price tier content** for the one-pager — does Nate have numbers yet, or leave placeholders?
- **CFO's device class** — assumed Windows laptop, Chrome/Edge. Confirm before relying on any CSS-modern feature (container queries, etc.).
- Andy referenced Pinesmith.ai + Forceaisecurity.com as good references — re-confirm those are still the north stars and the CFO audience hasn't shifted.

## What I will NOT do this pass
- Edit the restored Fortis Proposal Google Doc.
- Touch `/Users/nate/mccreery-ai/variants/` originals or the root `index.html`.
- Make pricing commitments without Nate's numbers.
- Push to `main` — preview branch only until Nate signs off.
