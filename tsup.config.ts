import { defineConfig } from 'tsup';
import { readFileSync, writeFileSync } from 'fs';

const css = [
  readFileSync('src/index.css', 'utf-8'),
  readFileSync('src/progress-styles.css', 'utf-8'),
].join('\n');

// "use client" must be prepended AFTER esbuild finishes — esbuild strips bare
// string directives from bundled output (github.com/evanw/esbuild/issues/2682).
// This is a standard post-build step used by most RSC-compatible libraries.
function prependUseClient(file: string) {
  const content = readFileSync(file, 'utf-8');
  if (!content.startsWith('"use client"')) {
    writeFileSync(file, '"use client";\n' + content);
  }
}

export default defineConfig([
  // ── Main entry ──────────────────────────────────────────────────────────────
  {
    entry: { index: 'src/index.ts' },
    format: ['cjs', 'esm'],
    outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.cjs' }),
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: true,
    splitting: false,
    external: ['react', 'react-dom', 'react/jsx-runtime', 'framer-motion'],
    // __CSS_CONTENT__ is replaced at esbuild compile time — no runtime file I/O.
    define: { __CSS_CONTENT__: JSON.stringify(css) },
    esbuildOptions(options) {
      options.jsx = 'automatic';
    },
    async onSuccess() {
      prependUseClient('dist/index.mjs');
      prependUseClient('dist/index.cjs');
      // Ship raw styles.css for users who prefer explicit imports:
      //   import 'react-toast-kit/styles.css'
      writeFileSync('dist/styles.css', css);
      writeFileSync('dist/styles.d.ts', 'declare const css: string;\nexport default css;\n');
    },
  },

  // ── DevTools entry ──────────────────────────────────────────────────────────
  // Separate chunk — users who don't import DevTools pay zero bundle cost.
  {
    entry: { 'devtools-entry': 'src/devtools-entry.ts' },
    format: ['cjs', 'esm'],
    outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.cjs' }),
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
      prependUseClient('dist/devtools-entry.mjs');
      prependUseClient('dist/devtools-entry.cjs');
    },
  },
]);
