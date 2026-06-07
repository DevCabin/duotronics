// Dev mode in-memory store shared between API routes
// Only used when NODE_ENV === 'development'

export interface DevConfig {
  left_provider: string
  right_provider: string
  left_key: string
  right_key: string
}

let devConfig: DevConfig | null = null

export function setDevConfig(config: DevConfig) {
  devConfig = config
}

export function getDevConfig(): DevConfig | null {
  return devConfig
}