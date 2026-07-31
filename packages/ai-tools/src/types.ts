import type { V0ClientConfig } from 'model0-sdk'

export interface V0ToolsConfig extends V0ClientConfig {
  /**
   * Optional base URL for model0 API
   * @default "https://api.v0.dev"
   */
  baseUrl?: string
  /**
   * API key for v0 authentication
   * If not provided, will use V0_API_KEY environment variable
   */
  apiKey?: string
}
