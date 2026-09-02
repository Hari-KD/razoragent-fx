import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest){
  try{
    const body = await req.json()
    const { paymentId, invoiceId } = body
    if(!paymentId && !invoiceId) return NextResponse.json({ error:'paymentId or invoiceId required'},{status:400})
    const db = getDb()

    // Find invoice by invoiceId first, or by matchedPaymentId
    const invoice = invoiceId 
      ? db.invoices.find(i => i.id === invoiceId)
      : (paymentId ? db.invoices.find(i => i.matchedPaymentId === paymentId) : undefined)

    // Find tx by invoice.matchedPaymentId or paymentId
    const tx = db.transactions.find(t => t.id === (invoice?.matchedPaymentId || paymentId)) || (paymentId ? db.transactions.find(t => t.id === paymentId) : undefined)

    const targetPaymentId = tx?.id || invoice?.matchedPaymentId || paymentId || `pay_doc_${Date.now()}`
    const targetFircStatus = tx?.fircStatus || 'Issued'
    if(targetFircStatus === 'Not Required') return NextResponse.json({ error:'FIRC not required for domestic'},{status:400})

    const amount = invoice?.amount || tx?.amount || 1500
    const currency = invoice?.currency || tx?.currency || 'USD'
    const fxRate = tx?.fxRate || 83.30
    const amountINR = Math.round(amount * fxRate)
    const buyerCountry = invoice?.buyerCountry || tx?.cardCountry || 'US'

    const firc = {
      fircNumber: `FIRC/RZP/${new Date().getFullYear()}/${Math.floor(100000+Math.random()*900000)}`,
      date: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' }),
      merchantName: 'Demo Merchant Pvt Ltd',
      merchantAddr: 'WeWork Galaxy, Residency Road, Bengaluru 560025',
      pan: 'ABCDE1234F',
      gstin: '29ABCDE1234F1Z5',
      buyerName: invoice?.buyerName || tx?.buyerName || 'International Buyer',
      buyerCountry: buyerCountry,
      buyerBank: (tx?.cardNetwork || 'SWIFT Clearing') + ' • ' + buyerCountry,
      paymentId: targetPaymentId,
      amount: amount,
      currency: currency,
      amountINR: amountINR,
      fxRate: fxRate,
      invoiceNumber: invoice?.invoiceNumber || tx?.invoiceNumber || 'INV-2024-'+Math.floor(1000+Math.random()*9000),
      invoiceDate: invoice?.date || new Date().toISOString().slice(0,10),
      utr: 'UTR'+Math.floor(100000000000+Math.random()*900000000000),
      hash: Math.random().toString(36).slice(2,10).toUpperCase(),
    }

    if (tx) tx.fircStatus = 'Issued'
    if (invoice) invoice.status = 'Matched'

    return NextResponse.json({ success:true, firc })
  }catch(e:any){
    return NextResponse.json({ error:e.message},{status:500})
  }
}

export async function GET(req: NextRequest){
  const { searchParams } = new URL(req.url)
  const paymentId = searchParams.get('paymentId')
  if(!paymentId) return NextResponse.json({ error:'paymentId required'},{status:400})
  const db = getDb()
  const tx = db.transactions.find(t=> t.id===paymentId)
  if(!tx) return NextResponse.json({ error:'Not found'},{status:404})
  return NextResponse.json({ transaction: tx })
}
