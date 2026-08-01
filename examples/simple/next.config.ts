import type { NextConfig } from 'next'
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants'

export default (phase: string): NextConfig => ({
  assetPrefix:
    phase === PHASE_DEVELOPMENT_SERVER ? undefined : '/examples/simple',
})
