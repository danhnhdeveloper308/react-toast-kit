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
4. Build the project to ensure everything compiles:
   ```bash
   pnpm build
   ```
5. Commit your changes with a descriptive commit message
6. Push your branch and create a pull request

## Commit Message Format

We follow a simple commit message format:

- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that don't affect the code's meaning (formatting, etc.)
- refactor: Code change that neither fixes a bug nor adds a feature
- perf: Change that improves performance
- chore: Changes to the build process or auxiliary tools

Example: `fix: resolve issue with toast position in Safari`

## Release Process

Releases are handled through GitHub Actions. The maintainers will:

1. Merge approved PRs into main
2. Trigger a new release using semantic versioning
3. The CI/CD pipeline will automatically publish to npm

## Questions?

If you have any questions about contributing, feel free to open an issue for clarification.