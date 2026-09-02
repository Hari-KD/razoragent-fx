import { NextRequest, NextResponse } from 'next/server'
import { addTransaction, getDb, updateTransaction, FX_RATES } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Razorpay sends { event, payload: { payment: { entity: {...} } } }  or direct mock from CheckoutModal
    const event = body.event || body.entity || 'payment.captured'
    const payment = body.payload?.payment?.entity || body.payload?.payment || body.payment || body

    // Normalize fields
    const paymentId = payment.id || `pay_${Math.random().toString(36).slice(2,10)}`
    const orderId = payment.order_id || payment.orderId || `order_${Math.random().toString(36).slice(2,8)}`
    const amountSmallest = payment.amount || 0 // in paise
    const amount = amountSmallest ? amountSmallest/100 : (body.amount || 1000)
    // For demo, currency might be passed at top level
    const currency = (payment.currency || body.currency || 'USD') as any
    const statusRaw = payment.status || (event === 'payment.failed' ? 'failed' : 'captured')
    const status = statusRaw === 'captured' ? 'captured' : statusRaw === 'failed' ? 'failed' : 'pending'
    const cardCountry = payment.card_country || payment.cardCountry || body.cardCountry || 'US'
    const cardNetwork = payment.card?.network || payment.cardNetwork || body.cardNetwork || 'Visa'

    // Find routing decision: use most recent routing log matching currency/country, or fallback
    const db = getDb()
    let route = 'Razorpay International Optimized' as any
    let confidence = 0.91
    let savings = '1.5%'
    if (db.routingLogs.length > 0) {
      const recent = db.routingLogs.find(l => l.sourceCurrency === currency) || db.routingLogs[0]
      route = recent.recommendedRoute
      confidence = recent.confidenceScore
      savings = recent.estimatedFxSavings
    }

    const fxRate = (FX_RATES as any)[currency] ?? 83
    const amountINR = Math.round(amount * fxRate)

    // Determine FIRC status
    let fircStatus: any = 'Pending'
    if (status === 'failed') fircStatus = 'Not Required'
    else if (currency === 'INR') fircStatus = 'Not Required'
    else if (status === 'captured') {
      // check if invoice exists matching amount/currency
      const matchedInvoice = db.invoices.find(inv => inv.amount === amount && inv.currency === currency && inv.status !== 'Matched')
      if (matchedInvoice) fircStatus = 'Issued'
      else fircStatus = 'Pending'
    }

    const existing = db.transactions.find(t=> t.id===paymentId)
    if (existing) {
      updateTransaction(paymentId, { status: status as any, fircStatus })
    } else {
      addTransaction({
        id: paymentId,
        orderId,
        amount,
        currency,
        amountINR,
        fxRate,
        status: status as any,
        gatewayRoute: route,
        confidenceScore: confidence,
        cardCountry,
        cardNetwork,
        createdAt: new Date().toISOString(),
        fircStatus,
        savingsPercent: savings,
        buyerName: body.buyerName || undefined,
      })
    }

    // If captured and we have a matching pending invoice, mark it matched and auto-issue FIRC
    if (status === 'captured' && currency !== 'INR') {
      const inv = db.invoices.find(i => i.amount === amount && i.currency === currency && i.status !== 'Matched')
      if (inv) {
        inv.status = 'Matched'
        inv.matchedPaymentId = paymentId
      }
    }

    return NextResponse.json({ success:true, paymentId, status, fircStatus, route })
  } catch (e:any) {
    console.error('webhook error', e)
    return NextResponse.json({ error: e.message }, { status:500 })
  }
}

// GET for testing
export async function GET(){
  return NextResponse.json({ ok:true, message:'Razorpay webhook listener active. POST payment.captured / payment.failed' })
}
