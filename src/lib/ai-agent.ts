import { z } from 'zod'
import { Currency, RouteOption } from './db'
import { fetchLiveFxRates, DEFAULT_FX_RATES } from './fx-rates'

export const AgentInputSchema = z.object({
  amount: z.number().positive(),
  sourceCurrency: z.enum(['USD','EUR','MYR','GBP','INR']),
  targetCurrency: z.enum(['USD','EUR','MYR','GBP','INR']).default('INR'),
  cardCountry: z.string().min(2),
  issuingBank: z.string().optional().default('Unknown'),
  cardNetwork: z.enum(['Visa','Mastercard','Amex','Discover','Unknown']).default('Visa'),
  fxRates: z.record(z.string(), z.number()).optional(),
})

export type AgentInput = z.infer<typeof AgentInputSchema>

export type AgentOutput = {
  recommendedRoute: RouteOption
  confidenceScore: number
  estimatedFxSavings: string
  reasoning: string[]
  riskScore: number
  fxEfficiency: number
  alternatives: { route: RouteOption; score: number; savings: string }[]
  fxRate: number
  amountINR: number
}

function getFxMarkup(route: RouteOption, currency: Currency): number {
  if (currency === 'INR') return 0
  switch (route) {
    case 'Razorpay-Curlec Malaysia Local Rail':
      return currency === 'MYR' ? 0.45 : 1.10
    case 'Curlec SGD Rail':
      return currency === 'MYR' ? 0.60 : 0.85
    case 'Razorpay International Optimized':
      if (currency === 'EUR') return 0.80
      if (currency === 'GBP') return 0.75
      if (currency === 'USD') return 0.90
      return 1.05
    case 'UPI Global':
      return 0.70
    case 'Razorpay Core':
      return 1.10
    case 'Direct Bank Rail (SWIFT)':
      if (currency === 'MYR') return 2.60
      if (currency === 'GBP') return 2.40
      if (currency === 'EUR') return 2.25
      return 2.10
    default:
      return 1.20
  }
}

// Deterministic routing logic (fallback & core)
export async function runDeterministicAgent(input: AgentInput): Promise<AgentOutput> {
  const { amount, sourceCurrency, cardCountry, cardNetwork, issuingBank, fxRates: customRates } = input

  let liveRates = customRates
  if (!liveRates) {
    try {
      const data = await fetchLiveFxRates()
      liveRates = data.rates
    } catch {
      liveRates = DEFAULT_FX_RATES
    }
  }

  const fxRate = liveRates?.[sourceCurrency] ?? DEFAULT_FX_RATES[sourceCurrency] ?? 88.45
  const amountINR = Math.round(amount * fxRate)

  const routeList: RouteOption[] = [
    'Razorpay Core',
    'Razorpay International Optimized',
    'Razorpay-Curlec Malaysia Local Rail',
    'Curlec SGD Rail',
    'Direct Bank Rail (SWIFT)',
    'UPI Global'
  ]

  const routeBases: Record<RouteOption, number> = {
    'Razorpay Core': 0.88,
    'Razorpay International Optimized': 0.92,
    'Razorpay-Curlec Malaysia Local Rail': 0.82,
    'Curlec SGD Rail': 0.80,
    'Direct Bank Rail (SWIFT)': 0.76,
    'UPI Global': 0.85,
  }

  let scores: Record<RouteOption, number> = {} as any
  let reasonMap: Record<RouteOption, string[]> = {} as any

  for (const r of routeList) {
    let s = routeBases[r]
    const reasons: string[] = []
    const rMarkup = getFxMarkup(r, sourceCurrency)
    const swiftMarkup = getFxMarkup('Direct Bank Rail (SWIFT)', sourceCurrency)

    // Currency corridor boosts
    if (sourceCurrency === 'MYR' && r === 'Razorpay-Curlec Malaysia Local Rail') {
      s += 0.20
      reasons.push('MYR corridor: Curlec local clearing avoids double FX conversion & cuts cost to 0.45%')
    } else if (sourceCurrency === 'MYR' && r.includes('Curlec')) {
      s += 0.12
    }

    if (sourceCurrency === 'USD' && r === 'Razorpay International Optimized') {
      s += 0.08
      reasons.push(`USD-INR corridor liquid @ ₹${fxRate}/USD — Razorpay Intl optimal markup 0.9% vs ${swiftMarkup}% SWIFT`)
    }
    if (sourceCurrency === 'EUR' && r === 'Razorpay International Optimized') {
      s += 0.09
      reasons.push(`EUR: Razorpay Intl live rate @ ${fxRate} INR/EUR with dynamic FX hedging (0.80% markup)`)
    }
    if (sourceCurrency === 'GBP' && r === 'Razorpay International Optimized') {
      s += 0.08
      reasons.push(`GBP: Direct rail active @ ${fxRate} INR/GBP (0.75% markup vs 2.4% SWIFT)`)
    }
    if (sourceCurrency === 'GBP' && r === 'Direct Bank Rail (SWIFT)') {
      s -= 0.06
      reasons.push('GBP SWIFT flat fee erodes margin on mid-ticket')
    }

    if (cardCountry === 'MY' && r === 'Razorpay-Curlec Malaysia Local Rail') s += 0.10
    if (cardCountry === 'SG' && r === 'Curlec SGD Rail') s += 0.12
    if (cardNetwork === 'Amex' && r === 'Razorpay International Optimized') s += 0.03
    if (cardNetwork === 'Amex' && r.includes('Curlec')) s -= 0.07

    // Amount tiers
    if (amount < 500 && r === 'Direct Bank Rail (SWIFT)') { s -= 0.10; reasons.push('Low ticket <500: SWIFT fixed fees disproportionate') }
    if (amount > 3000 && r === 'Razorpay-Curlec Malaysia Local Rail' && sourceCurrency !== 'MYR') s -= 0.08

    // Bank-specific
    if (issuingBank?.toLowerCase().includes('maybank') && r.includes('Curlec')) s += 0.05
    if (issuingBank?.toLowerCase().includes('chase') && r === 'Razorpay International Optimized') s += 0.02

    const savingsVal = (swiftMarkup - rMarkup)
    reasons.push(`FX markup ${rMarkup}% vs SWIFT ${swiftMarkup}% — saves ~${savingsVal.toFixed(2)}%`)
    reasons.push(`Simulated auth success ${Math.round(s*100)}% based on network/country/rail history`)

    scores[r] = Math.min(0.99, Math.max(0.40, s))
    reasonMap[r] = reasons
  }

  // pick best
  const sorted = (Object.entries(scores) as [RouteOption, number][]).sort((a,b)=>b[1]-a[1])
  const best = sorted[0]
  const bestRoute = best[0]
  const bestScore = Number(best[1].toFixed(2))
  const bestMarkup = getFxMarkup(bestRoute, sourceCurrency)
  const swiftMarkup = getFxMarkup('Direct Bank Rail (SWIFT)', sourceCurrency)
  const savingsPctVal = Math.max(0, swiftMarkup - bestMarkup)
  const savingsRupees = Math.round(amountINR * (savingsPctVal / 100))
  const savingsPct = savingsPctVal > 0 ? `${savingsPctVal.toFixed(1)}%` : '0%'

  const riskScore = Number((1 - bestScore + 0.05).toFixed(2))
  const fxEfficiency = Number((1 - bestMarkup/3).toFixed(2))

  const alternatives = sorted.slice(1,3).map(([route, score]) => {
    const rMarkup = getFxMarkup(route, sourceCurrency)
    const altSavings = Math.max(0, swiftMarkup - rMarkup).toFixed(1) + '%'
    return { route, score: Number(score.toFixed(2)), savings: altSavings }
  })

  // Build reasoning for best
  const reasoning = [
    ...reasonMap[bestRoute].slice(0,3),
    amountINR > 100000 ? `High-value INR ${amountINR.toLocaleString('en-IN')}: prioritizing success rate & hedged FX` : `Ticket sized INR ${amountINR.toLocaleString('en-IN')}: optimizing fee vs success tradeoff`,
    `Savings vs SWIFT: ${savingsPct} (₹${savingsRupees.toLocaleString('en-IN')})`,
  ]

  return {
    recommendedRoute: bestRoute,
    confidenceScore: bestScore,
    estimatedFxSavings: savingsPct,
    reasoning,
    riskScore,
    fxEfficiency,
    alternatives,
    fxRate,
    amountINR
  }
}

// LLM powered agent (if OPENAI_API_KEY present)
export async function runAiAgent(input: AgentInput): Promise<AgentOutput> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return await runDeterministicAgent(input)

  try {
    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({ apiKey })
    const system = `You are RazorAgent FX, an expert cross-border payment router for Razorpay. You optimize FX cost, success rate, compliance for Indian merchants.
Given payment metadata, recommend the best rail among: Razorpay Core, Razorpay International Optimized, Razorpay-Curlec Malaysia Local Rail, Curlec SGD Rail, Direct Bank Rail (SWIFT), UPI Global.
Consider: currency corridors, local rails (Curlec for MYR/SGD), card network quirks, issuing bank, ticket size, FX markup (Curlec 0.45%, SGD 0.6%, UPI Global 0.7%, Razorpay Intl 0.9%, Razorpay Core 1.1%, SWIFT 2.1%).
Return JSON with: recommendedRoute, confidenceScore (0-1), estimatedFxSavings (e.g. "1.8%"), reasoning (3-5 bullets), riskScore, fxEfficiency, alternatives (2 items).
Be concise, fintech-specific.`

    const user = JSON.stringify(input)
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [{ role:'system', content: system }, { role:'user', content: user }],
      max_tokens: 700,
    })
    const text = completion.choices[0].message.content || '{}'
    const parsed = JSON.parse(text)

    // Validate & merge with deterministic fallback for missing fields
    const deterministic = await runDeterministicAgent(input)
    return {
      recommendedRoute: parsed.recommendedRoute ?? deterministic.recommendedRoute,
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : deterministic.confidenceScore,
      estimatedFxSavings: parsed.estimatedFxSavings ?? deterministic.estimatedFxSavings,
      reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning : deterministic.reasoning,
      riskScore: typeof parsed.riskScore === 'number' ? parsed.riskScore : deterministic.riskScore,
      fxEfficiency: typeof parsed.fxEfficiency === 'number' ? parsed.fxEfficiency : deterministic.fxEfficiency,
      alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : deterministic.alternatives,
      fxRate: deterministic.fxRate,
      amountINR: deterministic.amountINR
    }
  } catch (e) {
    console.error('OpenAI agent failed, fallback', e)
    return await runDeterministicAgent(input)
  }
}
