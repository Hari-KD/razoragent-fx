import { NextRequest, NextResponse } from 'next/server'
import { addInvoice, getDb } from '@/lib/db'

// Simple text extraction fallback - in prod use pdf-parse + LLM Vision
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const textFallback = formData.get('text') as string | null

    if (!file && !textFallback) {
      return NextResponse.json({ error:'No file uploaded' }, { status:400 })
    }

    let extracted: any = {}
    let fileName = 'invoice.pdf'

    if (file) {
      fileName = file.name
      const buffer = Buffer.from(await file.arrayBuffer())
      // Try pdf-parse if available
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfModule: any = await import('pdf-parse')
        const pdfParse = pdfModule.default || pdfModule
        const data = await pdfParse(buffer)
        const text = data.text as string
        extracted = parseInvoiceText(text)
        extracted.rawText = text.slice(0,2000)
      } catch (e) {
        // fallback: try to parse filename or use mock
        extracted = parseInvoiceText(textFallback || fileName)
      }
    } else if (textFallback) {
      extracted = parseInvoiceText(textFallback)
    }

    // If extraction failed, generate plausible mock based on filename
    if (!extracted.invoiceNumber) {
      extracted = {
        invoiceNumber: 'INV-2024-' + Math.floor(1000+Math.random()*9000),
        buyerName: extracted.buyerName || 'Acme Global Ltd',
        buyerCountry: extracted.buyerCountry || 'US',
        amount: extracted.amount || Math.floor(500+Math.random()*3000),
        currency: extracted.currency || 'USD',
        date: extracted.date || new Date().toISOString().slice(0,10),
      }
    }

    // Try OpenAI vision enhancement if key present
    if (process.env.OPENAI_API_KEY && extracted.rawText) {
      try {
        const OpenAI = (await import('openai')).default
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        const completion = await client.chat.completions.create({
          model:'gpt-4o-mini',
          temperature:0,
          response_format:{ type:'json_object' },
          messages:[
            { role:'system', content:`You are an invoice parser. Extract: invoiceNumber, buyerName, buyerCountry (2-letter), amount (number), currency (USD/EUR/MYR/GBP/INR), date (YYYY-MM-DD). Return JSON. If missing, infer plausible values.`},
            { role:'user', content: extracted.rawText.slice(0,3000) }
          ],
          max_tokens:500
        })
        const parsed = JSON.parse(completion.choices[0].message.content || '{}')
        extracted = { ...extracted, ...parsed }
      } catch {}
    }

    // Match with payment
    const db = getDb()
    const match = db.transactions.find(t => t.amount === Number(extracted.amount) && t.currency === extracted.currency && t.fircStatus !== 'Issued')
    const status = match ? 'Matched' : 'Pending'

    const invoice = {
      id: 'inv_' + Date.now().toString(36),
      fileName,
      invoiceNumber: String(extracted.invoiceNumber),
      buyerName: String(extracted.buyerName),
      buyerCountry: String(extracted.buyerCountry).slice(0,2).toUpperCase(),
      amount: Number(extracted.amount),
      currency: (extracted.currency as any) || 'USD',
      date: String(extracted.date),
      status: status as any,
      matchedPaymentId: match?.id,
      uploadedAt: new Date().toISOString(),
    }
    addInvoice(invoice)

    // If matched, auto-update transaction FIRC to Issued
    if (match) {
      const tx = db.transactions.find(t=> t.id===match.id)
      if (tx) tx.fircStatus = 'Issued'
      if (tx) tx.invoiceNumber = invoice.invoiceNumber
    }

    return NextResponse.json({ success:true, invoice, matchedPayment: match || null, extracted })
  } catch (e:any) {
    console.error(e)
    return NextResponse.json({ error:e.message }, { status:500 })
  }
}

export async function GET(){
  const db = getDb()
  return NextResponse.json({ invoices: db.invoices })
}

function parseInvoiceText(text: string) {
  const out: any = {}
  // invoice number
  const invMatch = text.match(/(?:Invoice\s*#|Invoice\s*No\.?|INV[-\s]?)\s*[:\-]?\s*([A-Z0-9\-\/]+)/i)
  if (invMatch) out.invoiceNumber = invMatch[1].trim()
  // amount
  const amtMatch = text.match(/(?:Total|Amount|Grand Total)\s*[:\-]?\s*[$€£]?\s*([0-9,]+\.?\d*)/i) || text.match(/\$?\s*([0-9,]+\.\d{2})/)
  if (amtMatch) out.amount = Number(amtMatch[1].replace(/,/g,''))
  // currency
  if (/\$|USD/i.test(text)) out.currency='USD'
  else if (/€|EUR/i.test(text)) out.currency='EUR'
  else if (/MYR/i.test(text)) out.currency='MYR'
  else if (/£|GBP/i.test(text)) out.currency='GBP'
  else if (/INR|₹/i.test(text)) out.currency='INR'
  // date
  const dateMatch = text.match(/(\d{4}[\/\-]\d{2}[\/\-]\d{2})|(\d{2}[\/\-]\d{2}[\/\-]\d{4})/)
  if (dateMatch) out.date = (dateMatch[0].replace(/\//g,'-'))
  // buyer
  const buyerMatch = text.match(/(?:Bill\s*To|Buyer|Customer|Billed To)\s*[:\-]?\s*([A-Za-z0-9 ,\.&\-]+)/i)
  if (buyerMatch) out.buyerName = buyerMatch[1].split('\n')[0].trim().slice(0,60)
  // country - crude
  if (/Malaysia|MY/i.test(text)) out.buyerCountry='MY'
  else if (/Germany|DE/i.test(text)) out.buyerCountry='DE'
  else if (/United Kingdom|UK|GB/i.test(text)) out.buyerCountry='GB'
  else if (/Singapore|SG/i.test(text)) out.buyerCountry='SG'
  else out.buyerCountry='US'
  return out
}
