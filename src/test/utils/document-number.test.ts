import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockRpc = vi.fn()

vi.mock('@/lib/db/client', () => ({
  supabase: {
    rpc: mockRpc,
  },
}))

const { generateDocumentNumber } = await import('@/lib/utils/document-number')

describe('generateDocumentNumber', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats number correctly for May 2026', async () => {
    vi.setSystemTime(new Date('2026-05-24T10:00:00Z'))
    mockRpc.mockResolvedValue({ data: 1, error: null })

    const result = await generateDocumentNumber('SPH')
    expect(result).toBe('RRI-SPH-26-05-0001')
  })

  it('increments counter for subsequent calls', async () => {
    vi.setSystemTime(new Date('2026-05-24T10:00:00Z'))
    mockRpc.mockResolvedValue({ data: 5, error: null })

    const result = await generateDocumentNumber('INV')
    expect(result).toBe('RRI-INV-26-05-0005')
  })

  it('handles December date correctly', async () => {
    vi.setSystemTime(new Date('2026-12-01T10:00:00Z'))
    mockRpc.mockResolvedValue({ data: 15, error: null })

    const result = await generateDocumentNumber('SJ')
    expect(result).toBe('RRI-SJ-26-12-0015')
  })

  it('handles January date correctly', async () => {
    vi.setSystemTime(new Date('2027-01-15T10:00:00Z'))
    mockRpc.mockResolvedValue({ data: 1, error: null })

    const result = await generateDocumentNumber('KWT')
    expect(result).toBe('RRI-KWT-27-01-0001')
  })

  it('throws on RPC error', async () => {
    vi.setSystemTime(new Date('2026-05-24T10:00:00Z'))
    mockRpc.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    await expect(generateDocumentNumber('SPH')).rejects.toThrow('Failed to generate document number')
  })

  it('pads counter to 4 digits', async () => {
    vi.setSystemTime(new Date('2026-05-24T10:00:00Z'))
    mockRpc.mockResolvedValue({ data: 100, error: null })

    const result = await generateDocumentNumber('PO')
    expect(result).toBe('RRI-PO-26-05-0100')
  })
})
