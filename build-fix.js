/**
 * DEPRECATED — no longer used.
 *
 * All post-build tasks previously handled here (CSS embedding, client entry
 * points, Next.js entries, type declarations) are now handled directly inside
 * tsup.config.ts using:
 *
 *   - `define: { __CSS_CONTENT__: JSON.stringify(css) }` — inlines CSS at
 *     compile time; no runtime file I/O, no string replacement hacks.
 *   - `banner: { js: '"use client";\n' }` — marks output as a Client
 *     Component for Next.js App Router.
 *   - `onSuccess()` — writes dist/styles.css for users who prefer explicit
 *     stylesheet imports.
 *
 * This file is intentionally left as a no-op so existing references (git
 * history, issues) remain traceable.
 */
