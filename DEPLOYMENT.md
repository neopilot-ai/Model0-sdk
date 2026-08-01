# Deployment Guide

## Overview

Model0-SDK uses **Vercel** for hosting multiple apps and examples. Each app is independently deployable via a single monorepo configuration.

## Deployment Architecture

```
GitHub (main branch)
       ↓
GitHub Actions CI
       ↓
Vercel Build (vercel.json)
       ↓
Multiple Apps + Examples deployed
       ↓
Accessible at: model0-sdk.vercel.app/{app-path}
```

## URLs

### Production URLs

All apps are deployed under a single Vercel project:

| App             | URL                                                        |
| --------------- | ---------------------------------------------------------- |
| Playground      | `https://model0-sdk.vercel.app/playground`                 |
| Classic Example | `https://model0-sdk.vercel.app/classic`                    |
| Model0 Clone    | `https://model0-sdk.vercel.app/model0-clone`               |
| React Example   | `https://model0-sdk.vercel.app/react-example`              |
| Simple Example  | `https://model0-sdk.vercel.app/simple`                     |
| Root            | `https://model0-sdk.vercel.app` → redirects to /playground |

### Preview URLs (Pull Requests)

GitHub bot comments on PRs with preview URLs for each changed app:

```
https://model0-sdk-[branch-name].vercel.app/playground
```

## Prerequisites

1. **Vercel Account**: Free or Pro plan
2. **GitHub Account**: Connected to Vercel
3. **Environment Variables**: Set in Vercel dashboard
4. **Permissions**:
   - Admin access to GitHub repo
   - Vercel project owner/admin

## Initial Setup

### 1. Create Vercel Project

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

### 2. Configure Vercel Project

In Vercel Dashboard (vercel.com):

1. Go to Project Settings
2. Set Node version: **22**
3. Set pnpm version: **9.15.0**
4. Install command: `pnpm install --frozen-lockfile`

### 3. Set Environment Variables

Add variables in Vercel Dashboard > Settings > Environment Variables:

**All Environments**:

```
NODE_ENV=production
```

**Production**:

```
NEXT_PUBLIC_API_URL=https://api.model0.dev
MODEL0_API_KEY=[secret-key]
```

**Preview**:

```
NEXT_PUBLIC_API_URL=https://api-staging.model0.dev
MODEL0_API_KEY=[staging-key]
```

### 4. Configure Build Settings

Vercel automatically uses `vercel.json` for build configuration.

**Build Command**: Configured per-app in `vercel.json`

```bash
cd ../.. && pnpm build:packages && pnpm --filter=<app> build
```

**Output Directory**: Automatic (`.next`)

## Deployment Process

### Automatic Deployments (Main Branch)

**Trigger**: Push to `main` branch

**Process**:

1. GitHub Actions runs CI checks
2. If all checks pass → Vercel builds
3. Each app builds independently
4. Deployed to production URLs

**Status**: Check GitHub Actions tab in repo

### Preview Deployments (Pull Requests)

**Trigger**: Open PR with changes

**Process**:

1. GitHub Actions runs CI checks
2. If checks pass → Vercel builds preview
3. Unique URL generated for testing
4. Bot comments preview URLs on PR

**Example PR Comment**:

```
🚀 Preview URLs:
- Playground: https://model0-sdk-branch-name.vercel.app/playground
- Classic: https://model0-sdk-branch-name.vercel.app/classic
```

### Manual Deployments

```bash
# Deploy main branch to production
vercel --prod

# Deploy to preview environment
vercel

# Rollback to previous deployment
vercel rollback
```

## Build Optimization

### Caching Strategy

Vercel caches:

- **pnpm cache**: `~/.pnpm-store` (across deploys)
- **Next.js cache**: `.next` (incremental builds)
- **Turbo cache**: Remote cache (via Vercel integration)

**First build**: ~8-12 minutes
**Subsequent builds**: ~3-5 minutes (with cache)

### Reducing Build Time

1. **Enable Turbo Remote Caching**:

   ```bash
   vercel link
   ```

   Automatically enables caching when linked.

2. **Parallelize Tasks**:
   Turbo automatically runs independent builds in parallel.

3. **Dependency Optimization**:
   - Remove unused dependencies
   - Use workspace protocol (`workspace:*`)
   - Keep lock file up-to-date

4. **Code Splitting**:
   Next.js automatically code-splits routes.

## Monitoring & Logs

### Vercel Dashboard

1. Go to Project Settings
2. View deployments in "Deployments" tab
3. Click deployment for detailed logs
4. Check "Functions" tab for serverless function metrics

### GitHub Actions Logs

```bash
# View workflow logs
gh run view <run-id>

# View build logs
gh run view <run-id> --log
```

### Check Deployment Status

```bash
# View all deployments
vercel ls

# View specific deployment
vercel inspect <deployment-url>
```

## Environment Variables

### Securely Set Secrets

**In Vercel Dashboard**:

1. Settings → Environment Variables
2. Add key-value pair
3. Select environments (Production, Preview, Development)
4. Click "Save"

**In CI/CD** (GitHub Actions):

1. Settings → Secrets and variables → Actions
2. Add secret (e.g., `VERCEL_TOKEN`)
3. Use in workflow: `${{ secrets.VERCEL_TOKEN }}`

### Secret Rotation

```bash
# Update a secret in Vercel
vercel env pull  # Download current env vars

# Edit and push
vercel env push
```

## Troubleshooting

### Build Fails on Vercel

**Common Issues**:

1. **Missing Dependencies**

   ```bash
   # Ensure lock file is committed
   git add pnpm-lock.yaml
   git commit
   git push
   ```

2. **Node Version Mismatch**
   - Check `vercel.json` or package.json `engines` field
   - Update in Vercel Project Settings

3. **Environment Variables Missing**
   - Verify in Vercel Dashboard Settings
   - Check they're set for correct environment
   - Rebuild deployment after adding vars

4. **Out of Memory**
   - Reduce build scope (use `--filter`)
   - Split into smaller builds
   - Contact Vercel support for enterprise plan

### Preview Deploy Not Working

1. **Check GitHub Actions**: Ensure CI passes
2. **Check Vercel Integration**: Settings → Integrations
3. **Verify branch protection**: Remove blocking rules for preview
4. **Clear cache**: Vercel > Deployments > three-dot menu > "Rebuild"

### Slow Deployments

1. **Check cache hit rate**:

   ```bash
   vercel env pull
   ```

2. **Profile build**:

   ```bash
   vercel build --debug
   ```

3. **Optimize dependencies**: Remove unused packages

### 502 / 504 Errors

1. **Check function logs**: Vercel Dashboard > Functions
2. **Verify environment variables**: Ensure all required vars are set
3. **Check database connectivity**: If using external DB
4. **Redeploy**: Sometimes transient issues resolve with rebuild

## Performance Monitoring

### Web Vitals

Vercel automatically tracks:

- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **FCP** (First Contentful Paint)

View in: Vercel Dashboard > Analytics

### Build Analytics

Track in Vercel Dashboard:

- Build duration trends
- Cache effectiveness
- Function execution time
- Bandwidth usage

## Scaling & Advanced Features

### Custom Domains

1. Vercel Dashboard > Project Settings > Domains
2. Add custom domain
3. Update DNS records (CNAME/A record)
4. Wait for SSL certificate

### Edge Middleware

Create `middleware.ts` in root:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Add custom logic
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
```

### Serverless Functions

API routes automatically become serverless functions:

```typescript
// pages/api/hello.ts
export default async function handler(req, res) {
  res.status(200).json({ message: 'Hello' })
}
```

## Rollback & Recovery

### Rollback to Previous Deployment

```bash
vercel rollback

# Or specific URL
vercel rollback <deployment-url>
```

### Automatic Rollback

GitHub → Vercel integration handles:

- Automatic rollback on failed builds
- 48-hour retention of old deployments
- Can manually pin specific version

## CI/CD Integration

### GitHub Actions Workflows

**Automatic on Push to Main**:

1. `.github/workflows/ci.yml` - Tests pass
2. `.github/workflows/deploy.yml` - Deploy to Vercel
3. `.github/workflows/performance.yml` - Monitor performance

**Automatic on Pull Request**:

1. `.github/workflows/ci.yml` - Validate changes
2. Vercel bot comments preview URLs

### Manual Triggers

```bash
# Trigger deployment via CLI
gh workflow run deploy.yml

# Rebuild specific commit
vercel inspect <url> --meta
```

## Security Best Practices

1. **Environment Variables**:
   - Use Vercel's encrypted secrets for sensitive data
   - Never commit `.env.local` to git
   - Rotate secrets regularly

2. **Access Control**:
   - Use GitHub branch protection rules
   - Require PR reviews before merge
   - Use team permissions in Vercel

3. **Monitoring**:
   - Enable audit logs in Vercel
   - Monitor GitHub Actions logs
   - Set up alerts for failed builds

4. **Dependency Security**:
   - Run `pnpm audit` regularly
   - Fix vulnerable dependencies
   - Use Dependabot for automated updates

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
