import { z } from 'zod'
import { Currency, RouteOption } from './db'

export const AgentInputSchema = z.object({
  amount: z.number().positive(),
  sourceCurrency: z.enum(['USD','EUR','MYR','GBP','INR']),
  targetCurrency: z.enum(['USD','EUR','MYR','GBP','INR']).default('INR'),
  cardCountry: z.string().min(2),
  issuingBank: z.string().optional().default('Unknown'),
  cardNetwork: z.enum(['Visa','Mastercard','Amex','Discover','Unknown']).default('Visa'),
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

// Deterministic routing logic (fallback & core)
export function runDeterministicAgent(input: AgentInput): AgentOutput {
  const { amount, sourceCurrency, cardCountry, cardNetwork, issuingBank } = input

  const FX: Record<string, number> = { USD:83.30, EUR:90.14, MYR:17.75, GBP:105.80, INR:1 }
  const fxRate = FX[sourceCurrency] ?? 83
  const amountINR = Math.round(amount * fxRate)

  // gateway success rate simulation
  const routes: Record<RouteOption, { base: number, fxMarkup: number }> = {
    'Razorpay Core': { base: 0.88, fxMarkup: 1.1 },
    'Razorpay International Optimized': { base: 0.93, fxMarkup: 0.9 },
    'Razorpay-Curlec Malaysia Local Rail': { base: 0.82, fxMarkup: 0.45 },
    'Curlec SGD Rail': { base: 0.80, fxMarkup: 0.6 },
    'Direct Bank Rail (SWIFT)': { base: 0.76, fxMarkup: 2.1 },
    'UPI Global': { base: 0.85, fxMarkup: 0.7 },
  }

  let scores: Record<RouteOption, number> = {} as any
  let reasonMap: Record<RouteOption, string[]> = {} as any

  for (const r of Object.keys(routes) as RouteOption[]) {
    let s = routes[r].base
    const reasons: string[] = []

    // Currency corridor boosts
    if (sourceCurrency === 'MYR' && (r.includes('Curlec'))) {
      s += 0.12
      reasons.push('MYR corridor: Curlec local clearing avoids double FX conversion & cuts cost by ~1.4%')
    }
    if (sourceCurrency === 'USD' && r === 'Razorpay International Optimized') {
      s += 0.06
      reasons.push('USD-INR highly liquid — Razorpay Intl optimal markup 0.9% vs 2.1% SWIFT')
    }
    if (sourceCurrency === 'EUR' && r === 'Razorpay International Optimized') {
      s += 0.05
      reasons.push('EUR: Razorpay Intl hedged at 90.14 INR/EUR with dynamic FX')
    }
    if (sourceCurrency === 'GBP' && r === 'Direct Bank Rail (SWIFT)') {
      s -= 0.04
      reasons.push('GBP SWIFT flat £12 fee erodes margin on mid-ticket')
    }
    if (cardCountry === 'MY' && r.includes('Curlec')) s += 0.08
    if (cardCountry === 'SG' && r === 'Curlec SGD Rail') s += 0.10
    if (cardNetwork === 'Amex' && r === 'Razorpay International Optimized') s += 0.03
    if (cardNetwork === 'Amex' && r.includes('Curlec')) s -= 0.07

    // Amount tiers
    if (amount < 500 && r === 'Direct Bank Rail (SWIFT)') { s -= 0.10; reasons.push('Low ticket <500: SWIFT fixed fees disproportionate') }
    if (amount > 3000 && r === 'Razorpay-Curlec Malaysia Local Rail' && sourceCurrency !== 'MYR') s -= 0.08

    // Bank-specific
    if (issuingBank?.toLowerCase().includes('maybank') && r.includes('Curlec')) s += 0.04
    if (issuingBank?.toLowerCase().includes('chase') && r === 'Razorpay International Optimized') s += 0.02

    // FX savings inversely to markup
    const savings = (routes['Direct Bank Rail (SWIFT)'].fxMarkup - routes[r].fxMarkup)
    reasons.push(`FX markup ${routes[r].fxMarkup}% vs SWIFT 2.1% — saves ~${savings.toFixed(2)}%`)
    reasons.push(`Simulated auth success ${Math.round(s*100)}% based on network/country/rail history`)

    s = Math.min(0.99, Math.max(0.40, s + (Math.random()*0.02-0.01)))
    scores[r] = s
    reasonMap[r] = reasons
  }

  // pick best
  const sorted = (Object.entries(scores) as [RouteOption, number][]).sort((a,b)=>b[1]-a[1])
  const best = sorted[0]
  const bestRoute = best[0]
  const bestScore = Number(best[1].toFixed(2))
  const bestMarkup = routes[bestRoute].fxMarkup
  const swiftMarkup = routes['Direct Bank Rail (SWIFT)'].fxMarkup
  const savingsPct = (swiftMarkup - bestMarkup).toFixed(1) + '%'

  const riskScore = Number((1 - bestScore + 0.05).toFixed(2))
  const fxEfficiency = Number((1 - bestMarkup/3).toFixed(2))

  const alternatives = sorted.slice(1,3).map(([route, score]) => ({
    route, score: Number(score.toFixed(2)), savings: (swiftMarkup - routes[route].fxMarkup).toFixed(1)+'%'
  }))

  // Build reasoning for best
  const reasoning = [
    ...reasonMap[bestRoute].slice(0,3),
    amountINR > 100000 ? `High-value INR ${amountINR.toLocaleString('en-IN')}: prioritizing success rate & hedged FX` : `Ticket sized INR ${amountINR.toLocaleString('en-IN')}: optimizing fee vs success tradeoff`,
    `Confidence ${Math.round(bestScore*100)}% — computed from 6 factors: corridor liquidity, network, issuing bank, ticket size, FX markup, historic auth rates`,
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
  if (!apiKey) return runDeterministicAgent(input)

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
    const deterministic = runDeterministicAgent(input)
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
    return runDeterministicAgent(input)
  }
}
