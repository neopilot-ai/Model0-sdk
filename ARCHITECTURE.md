# Model0-SDK Monorepo Architecture

## Overview

Model0-SDK is a monorepo managed with **pnpm workspaces** and **Turbo** for build orchestration. It contains the core SDK, React bindings, CLI tools, and multiple example applications.

## Monorepo Structure

```
model0-sdk/
├── packages/           # Core libraries published to npm
├── apps/              # Applications deployed to Vercel
├── examples/          # Example implementations
├── scripts/           # Build and utility scripts
├── .github/workflows/ # CI/CD automation
├── turbo.json         # Turborepo configuration
├── tsconfig.json      # TypeScript root config
└── pnpm-workspace.yaml # pnpm workspace definition
```

### Packages (`packages/`)

Published to npm and used by other packages and examples.

#### `@model0-sdk/model0-sdk`

- **Purpose**: Core SDK for Model0 API interactions
- **Language**: TypeScript
- **Exports**: Main SDK client, types, utilities
- **Location**: `packages/model0-sdk/src`
- **Tests**: `packages/model0-sdk/tests`
- **Build Output**: `packages/model0-sdk/dist`

#### `@model0-sdk/react`

- **Purpose**: React hooks and components for SDK integration
- **Language**: TypeScript
- **Exports**: React hooks, context providers, components
- **Peer Dependency**: React 18+
- **Location**: `packages/react/src`

#### `@model0-sdk/ai-tools`

- **Purpose**: AI tool integration utilities
- **Language**: TypeScript
- **Exports**: Tool definitions, execution helpers
- **Location**: `packages/ai-tools/src`

#### `create-model0-sdk-app`

- **Purpose**: CLI tool for scaffolding new projects
- **Type**: Executable package
- **Language**: TypeScript
- **Bin Entry**: Distributed as `create-model0-sdk-app` command

### Apps (`apps/`)

Full applications deployed to Vercel.

#### Playground (`apps/playground`)

- **Type**: Next.js application
- **Purpose**: Main demo and testing ground
- **URL**: `/playground`
- **Database**: Optional (configured via env vars)
- **Build Command**: `pnpm build:packages && pnpm --filter=playground build`

### Examples (`examples/`)

Reference implementations showcasing SDK usage.

- **classic**: Traditional Model0 UI implementation
- **model0-clone**: Full Model0 clone with all features
- **react-example**: React hooks usage example
- **simple**: Minimal SDK integration example
- **ai-tools-example**: AI tools integration example

Each example is:

- A standalone Next.js app
- Deployed to Vercel with its own URL
- Built with: `pnpm build:packages && pnpm --filter=<example> build`

## Build System

### Turborepo Tasks

Defined in `turbo.json`:

```
build        → Builds all packages (outputs to dist/**/.next/**)
test         → Runs tests with coverage
lint         → ESLint checks
type-check   → TypeScript type validation
format       → Code formatting with Prettier
dev          → Development server
clean        → Remove build artifacts
sdk:generate → Generate SDK from OpenAPI spec
```

### Task Dependencies

```
dev:           no dependencies (persistent)
test:watch:    no dependencies (persistent)
build:         depends on ^build (transitive deps)
test:          depends on ^build, build
lint:          depends on ^lint
type-check:    depends on ^build, build
format:        no dependencies
```

### Caching Strategy

**Root-level cache** (`turbo.json` > `globalDependencies`):

- `.env` files
- `tsconfig.json`
- `eslint.config.mjs`
- `.prettierrc`

**Per-task caching**:

- `build`: Cached based on source + dependencies
- `test`: Cached with coverage output
- `lint`: Cached
- Remote cache: Use Turbo's remote cache (configured via Vercel dashboard)

## Dependency Management

### Workspace Dependencies

Specified via `pnpm` workspace protocol:

```json
{
  "dependencies": {
    "@model0-sdk/model0-sdk": "workspace:*",
    "react": "^18.0.0"
  }
}
```

### Version Strategy

- **Packages**: Managed by Changesets CLI for versioning
- **Examples**: Fixed versions (no publishing)
- **Root**: Devs only (node, pnpm, Turbo, TypeScript)

### Peer Dependencies

- **React**: >=18.0.0 (required for @model0-sdk/react)
- **React-DOM**: >=18.0.0 (for React components)

## Type Safety

### TypeScript Configuration

Root `tsconfig.json` enforces:

- `strict: true` - All strict type checks enabled
- `noImplicitAny: true` - No implicit any types
- `esModuleInterop: true` - CommonJS/ESM compatibility
- `target: ES2022` - Modern JavaScript features

### Type Paths

```json
{
  "paths": {
    "model0-sdk": ["./packages/model0-sdk/src"]
  }
}
```

## Development Workflow

### Local Setup

```bash
git clone https://github.com/neopilot-ai/model0-sdk.git
cd model0-sdk
pnpm install
pnpm dev  # Starts all dev servers
```

### Running Specific Packages

```bash
# Build only SDK and React
pnpm build:packages

# Test only model0-sdk
pnpm --filter=@model0-sdk/model0-sdk test

# Dev server for playground
pnpm --filter=playground dev
```

### Code Quality

```bash
pnpm lint      # ESLint checks
pnpm type-check # TypeScript validation
pnpm format:check # Prettier formatting
pnpm test      # Run tests with coverage
```

## Deployment

### Vercel Configuration

`vercel.json` routes requests to apps/examples:

```
/playground/*  → apps/playground
/classic/*     → examples/classic
/model0-clone/* → examples/model0-clone
/react-example/* → examples/react-example
/simple/*      → examples/simple
```

### Build Process on Vercel

Each app build:

1. Installs dependencies: `pnpm install --frozen-lockfile`
2. Builds packages: `pnpm build:packages`
3. Builds specific app: `pnpm --filter=<app> build`
4. Deploys to Vercel

### Environment Variables

Configure per-app via Vercel dashboard:

- API keys (Model0, third-party services)
- Database URLs
- Feature flags
- Public/secret configurations

## CI/CD Pipeline

### Workflows (GitHub Actions)

- **ci.yml**: Build, lint, format, type-check, test (all PRs + main)
- **coverage.yml**: Test coverage reporting (PRs + main)
- **bundle-size.yml**: Bundle size analysis (PRs + main)
- **security-audit.yml**: Dependency security audit (schedule + PRs)
- **performance.yml**: Build time and bundle analysis (PRs + main)
- **deploy.yml**: Deploy to Vercel (main only)
- **generate-sdk.yml**: Generate SDK from OpenAPI (scheduled)
- **release.yml**: Publish packages to npm (manual)

### PR Checks

Before merge to `main`, must pass:

- ✅ Build succeeds
- ✅ Tests pass (Node 20 & 22)
- ✅ No linting errors
- ✅ Type-checking passes
- ✅ Code formatting
- ✅ Bundle size within limits
- ✅ Coverage reports
- ✅ Security audit

### Main Branch Protection

- Require PR reviews
- Require status checks to pass
- Dismiss stale PR approvals
- Require linear history

## Performance Optimization

### Build Optimization

1. **Turbo Caching**: Leverages local and remote caches
2. **Parallel Execution**: Runs independent tasks in parallel
3. **Dependency Graph**: Only rebuilds affected packages
4. **Hash Algorithm**: SHA256 for consistent cache keys

### Bundle Size Tracking

- Analyzed via `scripts/bundle-analyzer.js`
- Reported in GitHub PR comments
- Compared across builds
- Alerts on significant increases

### Build Metrics

Tracked in CI:

- Total build time
- Per-package build time
- Cache hit rate
- Bundle sizes by package
- Test coverage trends

## Troubleshooting

### Clean Build

```bash
pnpm clean
pnpm install
pnpm build
```

### Clear Turbo Cache

```bash
pnpm exec turbo prune --scope=@model0-sdk/model0-sdk
pnpm clean
```

### Debug Build Issues

```bash
# Verbose output
pnpm build --verbose

# Graph visualization
pnpm exec turbo run build --graph

# Test specific package
pnpm --filter=@model0-sdk/model0-sdk test
```

### Check Dependencies

```bash
# Outdated packages
pnpm outdated

# Dependency tree
pnpm ls --depth=3

# Circular dependencies (if any)
pnpm exec turbo-ls
```

## Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make changes** following [CONTRIBUTING.md](./CONTRIBUTING.md)
4. **Run tests**: `pnpm test`
5. **Format code**: `pnpm format`
6. **Create PR** and ensure all checks pass
7. **Merge** once approved

## Resources

- [Turborepo Docs](https://turbo.build)
- [pnpm Documentation](https://pnpm.io)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
