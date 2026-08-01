# Performance Optimization Guide

## Overview

This guide covers performance optimization strategies for the Model0-SDK monorepo, including build optimization, bundle size management, and runtime performance.

## Build Performance

### Current Metrics

- **First build**: ~8-12 minutes (cold cache)
- **Subsequent builds**: ~3-5 minutes (warm cache)
- **Incremental build**: ~1-2 minutes (single package change)

### Optimizing Build Times

#### 1. Turbo Remote Caching

Enable Vercel's remote cache for faster builds across CI/CD:

```bash
# Automatically configured when linking to Vercel
vercel link
```

**Impact**: 40-60% faster builds in CI

#### 2. Selective Builds

Only build affected packages:

```bash
# Build only changed packages and their dependents
pnpm build

# Build specific package
pnpm --filter=@model0-sdk/model0-sdk build

# Skip unchanged packages
pnpm build --filter=[HEAD^]
```

#### 3. Parallel Task Execution

Turbo automatically parallelizes independent tasks. Monitor with:

```bash
# Generate dependency graph
pnpm exec turbo run build --graph=graph.png

# Visualize in browser
open graph.png
```

#### 4. Dependency Optimization

Keep dependencies minimal:

```bash
# Find unused dependencies
pnpm exec depcheck

# Remove unused packages
pnpm remove <package>

# Check for duplicates
pnpm ls --depth=0
```

### Build Configuration

Key settings in `turbo.json`:

```json
{
  "hashAlgorithm": "sha256",
  "tasks": {
    "build": {
      "cache": true,
      "cacheOnlyWriteWhenUsed": true,
      "env": ["NODE_ENV"]
    }
  },
  "globalDependencies": [".env", "tsconfig.json", "eslint.config.mjs"]
}
```

## Bundle Size Management

### Monitoring Bundle Size

```bash
# Analyze all build artifacts
node scripts/bundle-analyzer.js

# View report
cat .bundle-report.json
```

### Bundle Size Targets

- **SDK Package**: < 50 KB (gzipped)
- **React Package**: < 30 KB (gzipped)
- **AI Tools**: < 20 KB (gzipped)
- **Playground**: < 500 KB (gzipped)

### Reducing Bundle Size

#### 1. Code Splitting

Next.js automatically code-splits routes:

```typescript
// Dynamic imports reduce initial load
import dynamic from 'next/dynamic'

const Component = dynamic(() => import('./Component'), {
  loading: () => <div>Loading...</div>,
})
```

#### 2. Tree Shaking

Ensure proper ES module exports:

```typescript
// Good: Named exports (tree-shakeable)
export function feature1() {}
export function feature2() {}

// Avoid: Default export with multiple exports
export default {
  feature1,
  feature2,
}
```

#### 3. Dependency Pruning

```bash
# Remove unused packages
pnpm prune

# Use peer dependencies when appropriate
pnpm add --save-peer react@18
```

#### 4. External Dependencies

Consider externals for large libraries:

```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.externals = {
      'large-library': 'large-library',
    }
    return config
  },
}
```

## Runtime Performance

### Web Vitals

Monitor in production:

```typescript
// pages/_app.tsx
import { useReportWebVitals } from 'next/web-vitals'

function MyApp({ Component, pageProps }) {
  useReportWebVitals((metric) => {
    console.log(metric)
  })

  return <Component {...pageProps} />
}
```

**Targets**:

- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

### Image Optimization

Use Next.js Image component:

```typescript
import Image from 'next/image'

export function MyImage() {
  return (
    <Image
      src="/image.jpg"
      width={400}
      height={300}
      alt="Description"
      priority={false}
    />
  )
}
```

**Benefits**:

- Automatic format selection
- Responsive sizing
- Lazy loading by default
- Prevents layout shift

### API Performance

#### Caching Strategies

```typescript
// Cache entire page
export const revalidate = 60 // ISR: revalidate every 60 seconds

// Cache API response
export async function GET() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 },
  })
  return Response.json(data)
}
```

#### Request Deduplication

```typescript
// Automatic request deduplication
const res1 = await fetch('https://api.example.com/data')
const res2 = await fetch('https://api.example.com/data') // Cached
```

### Database Query Performance

#### Indexing

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_author_id ON posts(author_id);
```

#### Query Optimization

```typescript
// Use select to fetch only needed columns
const user = await db
  .select({ id: users.id, name: users.name })
  .from(users)
  .where(eq(users.id, 1))

// Use joins for related data
const postsWithUser = await db
  .select()
  .from(posts)
  .leftJoin(users, eq(posts.author_id, users.id))
```

## Monitoring & Diagnostics

### Enable Profiling

```bash
# Node.js profiling
node --prof app.js

# Analyze profile
node --prof-process isolate-*.log > profile.txt

# Chrome DevTools
node --inspect app.js
# Then open chrome://inspect
```

### Lighthouse Audits

Automated in CI via performance workflow:

```bash
# Manual audit
npm install -g @lhci/cli@latest
lhci autorun
```

### Performance Budgets

Set in `next.config.js`:

```javascript
module.exports = {
  swcMinify: true,
  experimental: {
    isrMemoryCacheSize: 52 * 1024 * 1024, // 52 MB
  },
}
```

## Caching Strategy

### HTTP Caching

Configured in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(_next/static|public)/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Data Caching

Use Turbo caching for build outputs:

```bash
# View cache stats
pnpm exec turbo telemetry enable
pnpm build
# Check console output for cache hits
```

### Browser Caching

```typescript
// Set cache headers in API routes
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'max-age=3600, s-maxage=86400')
  const data = await fetchData()
  res.json(data)
}
```

## Performance Debugging

### Check Build Size

```bash
# Analyze webpack bundle
npm run analyze

# Check package size on npm
npm view @model0-sdk/model0-sdk dist.uncompressed
```

### Slow Build Investigation

```bash
# Get build timeline
time pnpm build

# Profile specific task
time pnpm --filter=@model0-sdk/model0-sdk build

# Check Turbo cache
pnpm exec turbo run build --verbosity=full 2>&1 | grep "cache"
```

### Memory Usage

```bash
# Monitor Node memory
node --max-old-space-size=4096 node_modules/.bin/next build

# Check total memory
pnpm build 2>&1 | grep -i memory
```

## Performance Checklist

Before deployment:

- [ ] Run bundle analyzer: `node scripts/bundle-analyzer.js`
- [ ] Check build time: Compare with previous builds
- [ ] Verify cache hit rate: Check GitHub Actions logs
- [ ] Run Lighthouse audit: Check performance workflow
- [ ] Test Core Web Vitals: Use PageSpeed Insights
- [ ] Check memory usage: Monitor build process
- [ ] Validate code splitting: Check network tab
- [ ] Review dependencies: `pnpm audit`

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Turbo Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PageSpeed Insights](https://pagespeed.web.dev/)
