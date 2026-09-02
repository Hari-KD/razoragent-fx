import { NextRequest, NextResponse } from 'next/server'
import { createRazorpayOrder } from '@/lib/razorpay'
import { FX_RATES, addTransaction } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, currency, cardCountry, cardNetwork, issuingBank, routing } = body
    if (!amount || !currency) return NextResponse.json({ error:'amount and currency required'}, { status:400 })

    const fxRate = (FX_RATES as any)[currency] ?? 83
    const amountINR = Math.round(amount * fxRate)

    const receipt = `rcpt_${Date.now().toString(36)}`
    const order = await createRazorpayOrder({ amount: amountINR, currency: 'INR', receipt })

    // Pre-create pending transaction (will be updated by webhook)
    // For demo we create pending now; webhook will capture
    const txId = 'pay_' + Math.random().toString(36).slice(2,10)
    // Optionally store pending if not mock? But we add after webhook; here we just return order
    // Do not addTransaction yet - webhook will handle; but we store a temp for UI fallback
    // addTransaction({...})

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: (order as any).receipt,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock',
      mock: (order as any).mock || !process.env.RAZORPAY_KEY_ID,
      amountINR,
      fxRate,
      // echo routing for webhook correlation
      routing
    })
  } catch (e:any) {
    console.error(e)
    return NextResponse.json({ error: e.message }, { status:500 })
  }
}
