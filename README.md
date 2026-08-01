# model0 SDK Monorepo

> **⚠️ Developer Preview**: This SDK is currently in beta and is subject to change. Use in production at your own risk.

A monorepo containing SDKs for interacting with the model0 Platform API to create and manage AI-powered chat conversations, projects, integrations, and more.

## Packages

- [`model0-sdk`](./packages/model0-sdk) - TypeScript SDK for the model0 Platform API
- [`@model0-sdk/react`](./packages/react) - React components for rendering model0 Platform API content
- [`@model0-sdk/ai-tools`](./packages/ai-tools) - AI SDK tools for the model0 Platform API
- [`create-model0-sdk-app`](./packages/create-model0-sdk-app) - Create model0 SDK-powered apps with one command

## Examples

- [`model0-clone`](./examples/model0-clone) ([Demo](https://clone-demo.model0-sdk.dev)) - Full-featured v0 clone with authentication, database, and AI Elements
- [`simple`](./examples/simple) ([Demo](https://simple-demo.model0-sdk.dev)) - The simplest way to use v0. Just prompt and see your app generated instantly
- [`classic`](./examples/classic) - Classic v0 interface clone with clean, minimalist design
- [`react-example`](./examples/react-example) - Next.js example demonstrating @model0-sdk/react usage with multiple UI themes
- [`ai-tools-example`](./examples/ai-tools-example) - Demonstrates @model0-sdk/ai-tools integration with AI SDK for advanced agent patterns

## Quick Start

### Option 1: Create a New App (Recommended)

The fastest way to get started is with `create-model0-sdk-app`:

```bash
pnpm create model0-sdk-app@latest my-model0-app
# or
npx create-model0-sdk-app@latest my-model0-app
cd my-model0-app
```

This will create a new project with everything set up and ready to go.

### Option 2: Manual Installation

```bash
pnpm add model0-sdk
# or
npm install model0-sdk
# or
yarn add model0-sdk
```

### Usage

Get your API key from [v0.dev/chat/settings/keys](https://v0.dev/chat/settings/keys).

Set `V0_API_KEY` environment variable.

```typescript
import { v0 } from 'model0-sdk'

// Create a new chat
const chat = await v0.chats.create({
  message: 'Create a responsive navbar with Tailwind CSS',
  system: 'You are an expert React developer',
})
console.log(`Chat created: ${chat.webUrl}`)
```

## Development

This monorepo uses [Turborepo](https://turbo.build/) for build orchestration and [pnpm](https://pnpm.io/) for package management.

### Prerequisites

- Node.js 22+
- pnpm 9+

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests for all packages
pnpm test

# Type check all packages
pnpm type-check

# Format code
pnpm format
```

### Working with packages

```bash
# Run commands in specific package
pnpm --filter model0-sdk build
pnpm --filter model0-sdk test
pnpm --filter model0-sdk generate

# Run commands in all packages
pnpm build
pnpm test
```

### Adding new packages

1. Create a new directory in `packages/`
2. Add a `package.json` with the appropriate `@model0-sdk/` scope
3. Update the root `tsconfig.json` paths if needed
4. Add any necessary scripts to `turbo.json`

## Scripts

- `pnpm build` - Build all packages
- `pnpm test` - Run tests for all packages (CI mode)
- `pnpm test:watch` - Run tests in watch mode
- `pnpm type-check` - Type check all packages
- `pnpm lint` - Lint all packages
- `pnpm format` - Format code across all packages
- `pnpm sdk:generate` - Generate SDK from OpenAPI spec

### Code Quality

The project includes automated code quality checks:

- **Pre-commit hooks**: Automatically format code before commits using Husky and lint-staged
- **CI formatting check**: Ensures all code is properly formatted in pull requests

### Release Management

This project uses [Changesets](https://github.com/changesets/changesets) for automated version management and publishing. See [CONTRIBUTING.md](./CONTRIBUTING.md#release-process) for detailed release guidelines.

- `pnpm changeset` - Create a new changeset (describes changes for release)
- Releases are automated via GitHub Actions when changesets are merged to main

### CI/CD

The project includes comprehensive GitHub Actions workflows:

**Continuous Integration** (runs on all PRs and pushes to main):

- **CI Pipeline** (`ci.yml`): Build, test, lint, format check
  - Builds all packages with bundle size analysis
  - Runs tests on Node.js 20 and 22
  - Reports build timing and performance metrics
  - Uploads bundle reports as artifacts

- **Coverage** (`coverage.yml`): Test coverage tracking
  - Generates coverage reports with LCOV format
  - Merges coverage from all packages
  - Comments coverage summary on PRs
  - Tracks coverage trends over time

- **Bundle Size** (`bundle-size.yml`): Bundle analysis
  - Analyzes all build output directories
  - Comments size breakdown on PRs
  - Compares with previous builds
  - Detects regressions

- **Security Audit** (`security-audit.yml`): Dependency security
  - Runs `pnpm audit` to check for vulnerabilities
  - Detects outdated packages
  - Weekly scheduled runs
  - Reports findings on PRs

- **Performance** (`performance.yml`): Build and Lighthouse monitoring
  - Measures build time per package
  - Tracks cache hit rates
  - Generates performance reports
  - Comments metrics on PRs

**Deployment** (runs on successful main builds):

- **Deploy** (`deploy.yml`): Automated Vercel deployment
  - Deploys all apps to Vercel automatically
  - Creates deployment status checks
  - Links preview URLs in comments

**Scheduled**:

- **Release Pipeline** (`release.yml`): Automated npm publishing
  - Creates "Version Packages" PRs when changesets are added
  - Publishes packages to npm when version PRs are merged

- **Changeset Verification** (`verify-changesets.yml`):
  - Ensures package changes include appropriate changesets
  - Validates changeset format

- **SDK Generation** (`generate-sdk.yml`):
  - Runs daily to check for OpenAPI spec updates
  - Can be triggered manually
  - Creates PRs when the SDK needs updates

### Documentation

Comprehensive guides for contributors and users:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Monorepo structure, workspace dependencies, and design
- **[DEPLOYMENT.md](./DEPLOYMENT.md)**: Vercel deployment, environment setup, troubleshooting
- **[TESTING.md](./TESTING.md)**: Test strategy, coverage requirements, writing tests
- **[docs/PERFORMANCE.md](./docs/PERFORMANCE.md)**: Performance optimization, caching, monitoring
- **[CONTRIBUTING.md](./CONTRIBUTING.md)**: Developer workflow, code standards, release process

## Resources

- [v0 Documentation](https://v0.dev/docs)
- [API Terms](https://vercel.com/legal/api-terms)
- [Turborepo Documentation](https://turbo.build/repo/docs)

## License

Apache 2.0
