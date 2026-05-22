import { supabaseAdmin } from '@/lib/api/supabase-server'

export interface SearchResult {
  nama: string
  harga: number
  toko: string
  link: string
  marketplace: string
  rating: number | null
}

// Real Playwright scraping - designed to run on VPS with Chrome
export async function searchMarketplacePlaywright(query: string): Promise<SearchResult[]> {
  let browser = null
  try {
    const { chromium } = await import('playwright')
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' })
    const page = await context.newPage()

    const results: SearchResult[] = []

    // Search Tokopedia
    try {
      await page.goto(`https://www.tokopedia.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForSelector('[data-testid="master-product-card"]', { timeout: 10000 }).catch(() => {})
      const tokpedItems = await page.$$eval('[data-testid="master-product-card"]', cards =>
        cards.slice(0, 5).map(card => ({
          nama: (card.querySelector('[data-testid="spnSRPProdName"]') as HTMLElement)?.innerText?.trim() ?? '',
          harga: parseInt((card.querySelector('[data-testid="spnSRPProdPrice"]') as HTMLElement)?.innerText?.replace(/[^0-9]/g, '') ?? '0'),
          toko: (card.querySelector('[data-testid="spnSRPProdShopName"]') as HTMLElement)?.innerText?.trim() ?? '',
          link: (card.querySelector('a') as HTMLAnchorElement)?.href ?? '',
          marketplace: 'Tokopedia',
          rating: null,
        }))
      )
      results.push(...tokpedItems)
    } catch { /* tokopedia failed */ }

    // Search Shopee
    try {
      await page.goto(`https://shopee.co.id/search?keyword=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForTimeout(2000)
      const shopeeItems = await page.$$eval('[data-sqe="item"]', cards =>
        cards.slice(0, 5).map(card => ({
          nama: (card.querySelector('[data-sqe="name"]') as HTMLElement)?.innerText?.trim() ?? '',
          harga: parseInt((card.querySelector('[data-sqe="price"]') as HTMLElement)?.innerText?.replace(/[^0-9]/g, '') ?? '0'),
          toko: (card.querySelector('[data-sqe="shop"]') as HTMLElement)?.innerText?.trim() ?? '',
          link: (card.querySelector('a') as HTMLAnchorElement)?.href ?? '',
          marketplace: 'Shopee',
          rating: null,
        }))
      )
      results.push(...shopeeItems)
    } catch { /* shopee failed */ }

    return results
  } catch (err) {
    console.error('Playwright search failed:', err)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

// Fallback mock data for demo when Playwright is unavailable
export function getMockResults(query: string): SearchResult[] {
  const items = [
    { nama: `${query} - Standar Grade A`, harga: 50000 + Math.floor(Math.random() * 10000), toko: 'Toko Elektrik Jaya', marketplace: 'Tokopedia', rating: 4.8 },
    { nama: `${query} - Original`, harga: 55000 + Math.floor(Math.random() * 15000), toko: 'Supplier Teknik', marketplace: 'Tokopedia', rating: 4.5 },
    { nama: `${query} - Premium Quality`, harga: 62000 + Math.floor(Math.random() * 12000), toko: 'Grosir Listrik', marketplace: 'Shopee', rating: 4.9 },
    { nama: `${query} - Termurah`, harga: 45000 + Math.floor(Math.random() * 8000), toko: 'Toko Murah', marketplace: 'Shopee', rating: 4.2 },
    { nama: `${query} - Grade B`, harga: 38000 + Math.floor(Math.random() * 7000), toko: 'Second Store', marketplace: 'Tokopedia', rating: 4.0 },
  ]
  return items.map(item => ({ ...item, link: `https://www.${item.marketplace.toLowerCase()}.co.id/search?q=${encodeURIComponent(query)}` }))
}

export async function saveSearchResults(userId: string, query: string, results: SearchResult[]) {
  const { data: history, error: hErr } = await supabaseAdmin.from('ai_search_history').insert({
    user_id: userId, query,
  }).select().single()
  if (hErr || !history) throw new Error('Gagal menyimpan history')

  const resultRows = results.map(r => ({
    ai_search_history_id: history.id, nama: r.nama, harga: r.harga,
    toko: r.toko, link: r.link, marketplace: r.marketplace, rating: r.rating,
  }))
  const { error: rErr } = await supabaseAdmin.from('ai_search_result').insert(resultRows)
  if (rErr) throw new Error('Gagal menyimpan hasil')

  return history.id
}
