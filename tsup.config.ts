import { defineConfig } from 'tsup';
import { readFileSync, writeFileSync } from 'fs';

const css = readFileSync('src/index.css', 'utf-8');

// "use client" must be prepended AFTER esbuild finishes — esbuild strips bare
// string directives from bundled output (github.com/evanw/esbuild/issues/2682).
// This is a standard post-build step used by most RSC-compatible libraries.
function prependUseClient(file: string) {
  const content = readFileSync(file, 'utf-8');
  if (!content.startsWith('"use client"')) {
    writeFileSync(file, '"use client";\n' + content);
  }
}

export default defineConfig({
  entry: { index: 'src/index.ts', core: 'src/core.ts' },
  format: ['cjs', 'esm'],
  outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.cjs' }),
  dts: true,
  sourcemap: false,
  clean: true,
  treeshake: true,
  minify: true,
  splitting: false,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  // __CSS_CONTENT__ is replaced at esbuild compile time — no runtime file I/O.
  define: { __CSS_CONTENT__: JSON.stringify(css) },
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  async onSuccess() {
    prependUseClient('dist/index.mjs');
    prependUseClient('dist/index.cjs');
    prependUseClient('dist/core.mjs');
    prependUseClient('dist/core.cjs');
    // Ship raw styles.css for users who prefer explicit imports:
    //   import 'react-toast-kit/styles.css'
    writeFileSync('dist/styles.css', css);
    writeFileSync('dist/styles.d.ts', 'declare const css: string;\nexport default css;\n');
  },
});
