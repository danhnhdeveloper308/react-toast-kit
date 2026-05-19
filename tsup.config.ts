import { defineConfig } from 'tsup';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

// Read all CSS at build time — embedded as a compile-time string constant
const cssContent = [
  readFileSync('./src/index.css', 'utf-8'),
  readFileSync('./src/progress-styles.css', 'utf-8'),
].join('\n');

// "use client" marks the module as a React Client Component for Next.js
// App Router. We prepend it in onSuccess so it survives esbuild minification
// (the minifier strips bare string expressions as dead code).
const USE_CLIENT = '"use client";\n';

function prependDirective(file: string) {
  const content = readFileSync(file, 'utf-8');
  if (!content.startsWith(USE_CLIENT)) {
    writeFileSync(file, USE_CLIENT + content);
  }
}

export default defineConfig([
  // ── Main entry ──────────────────────────────────────────────────────────────
  {
    entry: { index: 'src/index.ts' },
    format: ['cjs', 'esm'],
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.cjs' };
    },
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: true,
    splitting: false,
    external: ['react', 'react-dom', 'react/jsx-runtime', 'framer-motion'],
    // __CSS_CONTENT__ is substituted with the full CSS string at compile time.
    // No runtime file I/O, no string-replace hacks — pure esbuild define.
    define: { __CSS_CONTENT__: JSON.stringify(cssContent) },
    esbuildOptions(options) {
      options.jsx = 'automatic';
    },
    async onSuccess() {
      // Prepend "use client" directive to compiled outputs
      prependDirective('dist/index.mjs');
      prependDirective('dist/index.cjs');

      // Also ship raw styles.css for users who prefer explicit imports:
      //   import 'react-toast-kit/styles.css'
      mkdirSync('dist', { recursive: true });
      writeFileSync('dist/styles.css', cssContent);
      writeFileSync('dist/styles.d.ts', 'declare const css: string;\nexport default css;\n');
      console.log('✅ dist/styles.css written');
    },
  },

  // ── DevTools entry ──────────────────────────────────────────────────────────
  // Separate chunk — users who don't import DevTools pay zero bundle cost.
  {
    entry: { 'devtools-entry': 'src/devtools-entry.ts' },
    format: ['cjs', 'esm'],
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.cjs' };
    },
    dts: true,
    sourcemap: true,
    clean: false,
    treeshake: true,
    minify: true,
    splitting: false,
    external: ['react', 'react-dom', 'react/jsx-runtime', 'framer-motion'],
    esbuildOptions(options) {
      options.jsx = 'automatic';
    },
    async onSuccess() {
      prependDirective('dist/devtools-entry.mjs');
      prependDirective('dist/devtools-entry.cjs');
    },
  },
]);
