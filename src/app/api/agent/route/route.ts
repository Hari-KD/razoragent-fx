import { NextRequest, NextResponse } from 'next/server'
import { AgentInputSchema, runAiAgent } from '@/lib/ai-agent'
import { addRoutingLog, RoutingLog } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = AgentInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }
    const input = parsed.data
    const result = await runAiAgent(input)

    const log: RoutingLog = {
      id: 'route_' + Date.now().toString(36) + Math.random().toString(36).slice(2,5),
      timestamp: new Date().toISOString(),
      amount: input.amount,
      sourceCurrency: input.sourceCurrency as any,
      targetCurrency: (input.targetCurrency as any) || 'INR',
      cardCountry: input.cardCountry,
      issuingBank: input.issuingBank || 'Unknown',
      cardNetwork: input.cardNetwork as any,
      recommendedRoute: result.recommendedRoute,
      confidenceScore: result.confidenceScore,
      estimatedFxSavings: result.estimatedFxSavings,
      reasoning: result.reasoning,
      riskScore: result.riskScore,
      fxEfficiency: result.fxEfficiency,
      alternatives: result.alternatives,
    }
    addRoutingLog(log)

    return NextResponse.json({ ...result, logId: log.id })
  } catch (e:any) {
    console.error(e)
    return NextResponse.json({ error: e.message || 'Agent error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status:'RazorAgent FX active', model: process.env.OPENAI_API_KEY ? 'gpt-4o-mini' : 'deterministic-mock', rails:['Razorpay Core','Razorpay International Optimized','Razorpay-Curlec Malaysia Local Rail','Curlec SGD Rail','Direct Bank Rail (SWIFT)','UPI Global'] })
}
