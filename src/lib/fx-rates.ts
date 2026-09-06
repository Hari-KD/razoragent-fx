export type Currency = 'USD' | 'EUR' | 'MYR' | 'GBP' | 'INR'

export interface LiveFxResult {
  rates: Record<Currency, number>
  updatedAt: string
  source: string
  isLive: boolean
}

// Fallback rates if internet APIs fail or are unreachable
export const DEFAULT_FX_RATES: Record<Currency, number> = {
  USD: 88.45,
  EUR: 96.15,
  MYR: 20.30,
  GBP: 114.60,
  INR: 1.0,
}

let cachedFxData: LiveFxResult | null = null
let lastCacheTime = 0
const CACHE_TTL_MS = 60 * 1000 // 1 minute cache TTL

export async function fetchLiveFxRates(): Promise<LiveFxResult> {
  const now = Date.now()
  if (cachedFxData && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedFxData
  }

  // Try primary provider: open.er-api.com
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 60 },
      headers: { 'User-Agent': 'RazorAgentFX/1.0' },
    })
    if (res.ok) {
      const data = await res.json()
      if (data && data.rates && data.rates.INR) {
        const usdInr = Number(data.rates.INR)
        const eurUsd = Number(data.rates.EUR) || 0.92
        const myrUsd = Number(data.rates.MYR) || 4.35
        const gbpUsd = Number(data.rates.GBP) || 0.77

        const rates: Record<Currency, number> = {
          USD: Number(usdInr.toFixed(2)),
          EUR: Number((usdInr / eurUsd).toFixed(2)),
          MYR: Number((usdInr / myrUsd).toFixed(2)),
          GBP: Number((usdInr / gbpUsd).toFixed(2)),
          INR: 1.0,
        }

        cachedFxData = {
          rates,
          updatedAt: new Date().toISOString(),
          source: 'ExchangeRate API (Live)',
          isLive: true,
        }
        lastCacheTime = now
        return cachedFxData
      }
    }
  } catch (e) {
    console.warn('[FX Rates] Primary API failed, trying fallback:', e)
  }

  // Try secondary provider: exchangerate-api.com
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const data = await res.json()
      if (data && data.rates && data.rates.INR) {
        const usdInr = Number(data.rates.INR)
        const eurUsd = Number(data.rates.EUR) || 0.92
        const myrUsd = Number(data.rates.MYR) || 4.35
        const gbpUsd = Number(data.rates.GBP) || 0.77

        const rates: Record<Currency, number> = {
          USD: Number(usdInr.toFixed(2)),
          EUR: Number((usdInr / eurUsd).toFixed(2)),
          MYR: Number((usdInr / myrUsd).toFixed(2)),
          GBP: Number((usdInr / gbpUsd).toFixed(2)),
          INR: 1.0,
        }

        cachedFxData = {
          rates,
          updatedAt: new Date().toISOString(),
          source: 'ExchangeRate-v4 (Live)',
          isLive: true,
        }
        lastCacheTime = now
        return cachedFxData
      }
    }
  } catch (e) {
    console.warn('[FX Rates] Secondary API failed, using fallback defaults:', e)
  }

  // Fallback if network calls fail
  return {
    rates: DEFAULT_FX_RATES,
    updatedAt: new Date().toISOString(),
    source: 'Default Market Estimate',
    isLive: false,
  }
}
