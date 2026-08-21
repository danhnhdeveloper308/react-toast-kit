# Contributing to React Toast Kit

Thank you for considering contributing to React Toast Kit! This document outlines the process for contributing to the project.

## Development Setup

1. Fork and clone the repository
2. Install dependencies with pnpm:
   ```bash
   pnpm install
   ```
3. Start the development build:
   ```bash
   pnpm dev
   ```

## Building the Project

To create a production build:

```bash
pnpm build
```

This uses tsup to bundle the library in both CommonJS and ESM formats with type declarations.

## Code Guidelines

- Use TypeScript for type safety
- Follow modern React practices (hooks, functional components)
- Keep bundle size minimal - avoid unnecessary dependencies
- Ensure accessibility is maintained

## Submitting Changes

1. Create a branch for your changes
2. Make your changes
3. Run the linter to check for errors:
   ```bash
   pnpm lint
   ```
4. Run type checks and tests:
   ```bash
   pnpm typecheck
   pnpm test
   ```
5. Build the project to ensure everything compiles:
   ```bash
   pnpm build
   ```
6. Commit your changes with a descriptive commit message
7. Push your branch and create a pull request

## Commit Message Format

We use Conventional Commits. Release versions are derived automatically from
the consumer impact of commits merged into `main`:

- `fix:` and `perf:` create a patch release (`1.0.11` → `1.0.12`)
- `feat:` creates a minor release (`1.0.11` → `1.1.0`)
- `feat!:`/`fix!:` or a `BREAKING CHANGE:` footer creates a major release
- `docs:`, `style:`, `test:`, `refactor:`, `build:`, `ci:` and `chore:` do not
  publish by themselves

Example: `fix: resolve issue with toast position in Safari`

## Release Process

Releases are handled by semantic-release through GitHub Actions:

1. Merge approved PRs into main
2. CI validates formatting, types, tests, builds and bundle budgets
3. Conventional Commits determine whether the next release is patch, minor or major
4. The pipeline updates the changelog, publishes through npm trusted publishing,
   creates the Git tag and GitHub Release, and deploys the documentation

## Questions?

If you have any questions about contributing, feel free to open an issue for clarification.
