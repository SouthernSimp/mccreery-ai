# McCreery.ai website

Editable React source for the static Cloudflare Pages website. The repo root is the deployed artifact; existing standalone client pages remain there.

- Install: `npm ci`
- Preview: `npm run dev`
- Check: `npm run check`
- Build and export to the existing Pages root: `npm run export:pages`
- Packaging check: `npm run test:sites`

Commit the exported root `index.html` and generated `assets/index-*.js`/CSS together with source changes. GitHub pushes to `main` trigger production deployment on the existing `mccreery-ai` Pages project; other branches trigger preview deployments.

Hero footage is scroll-controlled, with a static poster for reduced motion and data saving. OSAT uses real existing promotional footage and native video controls. The brief sends to the existing `https://os.mccreery.ai/api/contact`; checks use a mock request and never send a live message.
