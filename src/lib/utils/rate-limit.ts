interface RateLimitStore {
  get(key: string): Promise<{ count: number; reset: number } | null>
  set(key: string, value: { count: number; reset: number }, ttlMs: number): Promise<void>
  increment(key: string, ttlMs: number): Promise<{ count: number; reset: number }>
}

class InMemoryStore implements RateLimitStore {
  private store = new Map<
    string,
    { count: number; reset: number; expiresAt: number }
  >()

  private clean() {
    const now = Date.now()
    for (const [key, val] of this.store) {
      if (val.expiresAt <= now) this.store.delete(key)
    }
  }

  async get(key: string) {
    this.clean()
    const entry = this.store.get(key)
    if (!entry || entry.expiresAt <= Date.now()) return null
    return { count: entry.count, reset: entry.reset }
  }

  async set(key: string, value: { count: number; reset: number }, _ttlMs: number) {
    this.store.set(key, {
      count: value.count,
      reset: value.reset,
      expiresAt: Date.now() + _ttlMs,
    })
  }

  async increment(key: string, ttlMs: number) {
    this.clean()
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || entry.expiresAt <= now) {
      const reset = now + ttlMs
      const newEntry = { count: 1, reset, expiresAt: now + ttlMs }
      this.store.set(key, newEntry)
      return { count: 1, reset }
    }

    entry.count += 1
    return { count: entry.count, reset: entry.reset }
  }
}

let redisClientPromise: Promise<import('@upstash/redis').Redis> | null = null

async function getRedisClient(url: string, token: string) {
  if (!redisClientPromise) {
    redisClientPromise = import('@upstash/redis').then(
      (mod) => new mod.Redis({ url, token }),
    )
  }
  return redisClientPromise
}

class RedisStore implements RateLimitStore {
  private clientPromise: Promise<import('@upstash/redis').Redis>

  constructor(url: string, token: string) {
    this.clientPromise = getRedisClient(url, token)
  }

  private async client() {
    return this.clientPromise
  }

  async get(key: string) {
    const r = await this.client()
    return await r.get<{ count: number; reset: number }>(key)
  }

  async set(key: string, value: { count: number; reset: number }, ttlMs: number) {
    const r = await this.client()
    await r.set(key, value, { px: ttlMs })
  }

  async increment(key: string, ttlMs: number) {
    const r = await this.client()
    const now = Date.now()
    const existing = await r.get<{ count: number; reset: number }>(key)

    if (!existing || existing.reset <= now) {
      const reset = now + ttlMs
      const value = { count: 1, reset }
      await r.set(key, value, { px: ttlMs })
      return value
    }

    const updated = { count: existing.count + 1, reset: existing.reset }
    await r.set(key, updated, { px: Math.max(1, updated.reset - now) })
    return updated
  }
}

function createStore(): RateLimitStore {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) {
    return new RedisStore(url, token)
  }
  return new InMemoryStore()
}

const store = createStore()

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export async function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60_000,
): Promise<RateLimitResult> {
  const key = `rate_limit:${identifier}`
  const result = await store.increment(key, windowMs)

  return {
    success: result.count <= limit,
    limit,
    remaining: Math.max(0, limit - result.count),
    reset: result.reset,
  }
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
  }
}

export async function checkRateLimit(
  identifier: string,
  limit?: number,
  windowMs?: number,
): Promise<{ success: boolean; headers: Record<string, string> }> {
  const result = await rateLimit(identifier, limit, windowMs)
  return { success: result.success, headers: getRateLimitHeaders(result) }
}
