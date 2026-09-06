import { NextResponse } from 'next/server'
import { fetchLiveFxRates } from '@/lib/fx-rates'

export async function GET() {
  try {
    const data = await fetchLiveFxRates()
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch FX rates' }, { status: 500 })
  }
}
