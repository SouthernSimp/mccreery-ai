# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Approved website direction
Selected option 3: warm daylight architectural glass-cube hero, cream editorial service layout, pale blue OSAT demo section, restrained project list. Retain the existing scroll-controlled hero film. Lead immediately with offline AI, custom systems, and local data privacy; customer-specific AI runs on customer hardware. OSAT is a personal project in development, demonstrated with existing real footage. Mac mini "manager in a box" is a future plan, not a current product availability claim. Deploy via the existing mccreery-ai Cloudflare Pages/GitHub project after browser QA. Preserve existing contact API and other standalone client pages.

Keep copy short: one opening explanation, one sentence per service, a short OSAT description, and one contact section. Preserve the scroll film with a shorter single-scene sequence. Do not repeat privacy paragraphs or contact banners.
