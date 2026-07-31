# @model0-sdk/react Example

> **⚠️ Developer Preview**: This SDK is currently in beta and is subject to change. Use in production at your own risk.

This is a Next.js example application demonstrating how to use the `@model0-sdk/react` package to render content from the model0 Platform API.

## Features Demonstrated

- **Message Rendering**: Shows how to render different types of content from the model0 API
- **Code Blocks**: Syntax-highlighted code blocks with Prism.js
- **Mathematical Expressions**: Inline and block math using KaTeX
- **Markdown Content**: Rich text formatting with proper styling

## Getting Started

### Prerequisites

Make sure you're in the v0 monorepo root and have installed dependencies:

```bash
pnpm install
```

### Running the Example

From the monorepo root:

```bash
cd examples/react-example
pnpm dev
```

Or run it directly from the root:

```bash
pnpm --filter react-example dev
```

Open [http://localhost:3000](http://localhost:3000) to see the example.

## Code Structure

### Key Files

- `app/page.tsx` - Main page demonstrating the V0MessageRenderer component
- `lib/sampleData.ts` - Sample data representing model0 Platform API responses
- `app/layout.tsx` - Next.js layout with required CSS imports

### Sample Data Format

The example uses sample data that matches the format returned by the model0 Platform API:

```typescript
{
  id: 'msg-1',
  role: 'user' | 'assistant',
  content: MessageBinaryFormat // Parsed JSON from API response
}
```

## Usage Example

```tsx
import { V0MessageRenderer } from '@model0-sdk/react'
import 'katex/dist/katex.min.css' // Required for math rendering

function ChatMessage({ apiResponse }) {
  // Parse the content from the API response
  const content = JSON.parse(apiResponse.content)

  return (
    <V0MessageRenderer
      content={content}
      messageId={apiResponse.id}
      role={apiResponse.role}
      className="prose prose-sm max-w-none"
    />
  )
}
```

## Content Types Supported

The example demonstrates various content types:

1. **Markdown Text** - Paragraphs, headings, lists, links, emphasis
2. **Code Blocks** - Syntax-highlighted code with language detection
3. **Mathematical Expressions** - Both inline and block math using KaTeX

## Styling

The example uses:

- **Tailwind CSS** for layout and basic styling
- **Tailwind Typography** (`prose` classes) for content styling
- **KaTeX CSS** for mathematical expressions

## Dependencies

Key dependencies used in this example:

- `@model0-sdk/react` - The main SDK package
- `next` - Next.js framework
- `react` & `react-dom` - React framework
- `katex` - Math rendering library
- `tailwindcss` - Utility-first CSS framework

## Learn More

- [model0 Platform API Documentation](https://v0.dev/docs/api)
- [@model0-sdk/react Package](../../packages/@model0-sdk/react/README.md)
- [Next.js Documentation](https://nextjs.org/docs)
