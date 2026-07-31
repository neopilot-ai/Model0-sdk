# create-model0-sdk-app

Create [model0 SDK](https://model0-sdk.dev)-powered apps with one command.

## Usage

```bash
pnpm create model0-sdk-app my-app
```

Or with other package managers:

```bash
# With npm
npx create-model0-sdk-app my-app

# With yarn
yarn create model0-sdk-app my-app

# With bun
bun create model0-sdk-app my-app
```

## Options

- `--example <example-name>` - Specify which example to use
- `--use-pnpm` - Use pnpm as the package manager (recommended)
- `--use-npm` - Use npm as the package manager
- `--use-yarn` - Use Yarn as the package manager
- `--use-bun` - Use Bun as the package manager
- `--skip-install` - Skip installing dependencies

## Available Examples

### model0-clone (Recommended)

Next.js app that replicates the v0.dev interface with modern React components and AI chat functionality. This is the recommended starting point for most projects.

```bash
pnpm create model0-sdk-app my-app --example model0-clone
```

### classic

Full-featured Next.js app similar to the original v0.dev with project management, chat interface, and code generation capabilities.

```bash
pnpm create model0-sdk-app my-classic-app --example classic
```

### react-example

Next.js example using `@model0-sdk/react` components with different UI themes (minimal, elegant, neobrutalism, terminal).

```bash
pnpm create model0-sdk-app my-react-app --example react-example
```

### ai-tools-example

Node.js example using `@model0-sdk/ai-tools` with AI SDK. Perfect for building AI-powered command-line tools and scripts.

```bash
pnpm create model0-sdk-app my-ai-app --example ai-tools-example
```

## Interactive Mode

If you don't specify an example, the CLI will prompt you to choose one:

```bash
pnpm create model0-sdk-app my-app
# ? Which example would you like to use? (Use arrow keys)
# ❯ model0-clone - Next.js app that replicates the v0.dev interface (Recommended)
#   classic - Full-featured Next.js app similar to the original v0.dev
#   react-example - Next.js example using @model0-sdk/react components
#   ai-tools-example - Node.js example using @model0-sdk/ai-tools with AI SDK
```

## What's Included

Each example comes pre-configured with:

- TypeScript support
- Modern tooling and build setup
- Example code and documentation
- Proper dependency management
- Development and production scripts

## Development

To work on this package:

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Test locally
pnpm dev --help
```

## License

Apache 2.0
