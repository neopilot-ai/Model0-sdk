import type { NextConfig } from 'next'
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants'

export default (phase: string): NextConfig => ({
  reactStrictMode: true, // Enable strict mode for better development experience
  assetPrefix:
    phase === PHASE_DEVELOPMENT_SERVER ? undefined : '/examples/model0-clone',
})
