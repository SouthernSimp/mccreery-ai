import { cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
// Existing Pages serves the repo root; keep its other client pages intact.
await cp(fileURLToPath(new URL('../dist/client/', import.meta.url)), fileURLToPath(new URL('../../', import.meta.url)), { recursive: true });
console.log('Exported the built website to the existing Cloudflare Pages root.');
