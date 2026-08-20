# Performance baseline

Run `pnpm benchmark` after `pnpm build`. It records gzip sizes for the side-effect-free core entry,
automatic-CSS entry, and stylesheet, then exercises 10,000 imperative toast creations.

The checked budgets prevent regressions. Competitor numbers should only be compared using the same
React version, bundler, minifier, gzip implementation, and equivalent feature set; changing public
Bundlephobia totals are therefore not used as a correctness gate.
