interface CacheEntry<T> {
  data: T
  expires_at: number
}

const cache = new Map<string, CacheEntry<unknown>>()

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null

  if (Date.now() > entry.expires_at) {
    cache.delete(key)
    return null
  }

  return entry.data as T
}

export function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  cache.set(key, {
    data,
    expires_at: Date.now() + ttl,
  })
}

export function deleteCache(key: string): void {
  cache.delete(key)
}

export function clearCache(): void {
  cache.clear()
}

export function generateCacheKey(agentType: string, input: unknown): string {
  const hash = JSON.stringify(input)
  return `${agentType}:${hash}`
}

export function getCacheStats(): { size: number; keys: string[] } {
  const keys = Array.from(cache.keys()).map(k => {
    const entry = cache.get(k)!
    return `${k} (expires in ${Math.max(0, entry.expires_at - Date.now())}ms)`
  })
  return { size: cache.size, keys }
}