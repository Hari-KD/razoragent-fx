// In-memory DB with file persistence fallback - production would be Postgres/Supabase
// This keeps prototype fully functional without external DB

export type Currency = 'USD' | 'EUR' | 'MYR' | 'GBP' | 'INR'
export type RouteOption = 'Razorpay Core' | 'Razorpay-Curlec Malaysia Local Rail' | 'Direct Bank Rail (SWIFT)' | 'Razorpay International Optimized' | 'UPI Global' | 'Curlec SGD Rail'
export type TxnStatus = 'created' | 'captured' | 'failed' | 'pending'
export type FircStatus = 'Issued' | 'Pending' | 'Not Required' | 'Processing'

export interface RoutingLog {
  id: string
  timestamp: string
  amount: number
  sourceCurrency: Currency
  targetCurrency: Currency
  cardCountry: string
  issuingBank: string
  cardNetwork: string
  recommendedRoute: RouteOption
  confidenceScore: number
  estimatedFxSavings: string
  reasoning: string[]
  riskScore: number
  fxEfficiency: number
  alternatives: { route: RouteOption; score: number; savings: string }[]
}

export interface Transaction {
  id: string // razorpay payment id or mock
  orderId?: string
  amount: number
  currency: Currency
  amountINR: number
  fxRate: number
  status: TxnStatus
  gatewayRoute: RouteOption
  confidenceScore: number
  cardCountry: string
  cardNetwork: string
  createdAt: string
  fircStatus: FircStatus
  invoiceNumber?: string
  buyerName?: string
  savingsPercent?: string
}

export interface Invoice {
  id: string
  fileName: string
  invoiceNumber: string
  buyerName: string
  buyerCountry: string
  amount: number
  currency: Currency
  date: string
  status: 'Matched' | 'Unmatched' | 'Pending'
  matchedPaymentId?: string
  uploadedAt: string
}

type DB = {
  routingLogs: RoutingLog[]
  transactions: Transaction[]
  invoices: Invoice[]
}

// Global singleton to persist across HMR
const globalForDb = globalThis as unknown as { __RAZOR_DB__: DB | undefined }

function seedDb(): DB {
  const now = new Date()
  const logs: RoutingLog[] = [
    {
      id: 'route_' + Math.random().toString(36).slice(2, 8),
      timestamp: new Date(Date.now() - 1000*60*2).toISOString(),
      amount: 1250, sourceCurrency: 'USD', targetCurrency: 'INR', cardCountry: 'US', issuingBank: 'Chase', cardNetwork: 'Visa',
      recommendedRoute: 'Razorpay International Optimized', confidenceScore: 0.94, estimatedFxSavings: '1.8%', reasoning: ['USD-INR corridor highly liquid — Razorpay optimal FX markup (0.9% vs 2.1% SWIFT)', 'Visa US cards show 96.4% success on Razorpay Intl vs 88% on direct SWIFT', 'No local rail advantage for US; Curlec adds latency'],
      riskScore: 0.12, fxEfficiency: 0.91, alternatives: [{route:'Direct Bank Rail (SWIFT)', score:0.71, savings:'0%'},{route:'Razorpay-Curlec Malaysia Local Rail', score:0.42, savings:'0.2%'}]
    },
    {
      id: 'route_' + Math.random().toString(36).slice(2, 8),
      timestamp: new Date(Date.now() - 1000*60*12).toISOString(),
      amount: 3400, sourceCurrency: 'MYR', targetCurrency: 'INR', cardCountry: 'MY', issuingBank: 'Maybank', cardNetwork: 'Mastercard',
      recommendedRoute: 'Razorpay-Curlec Malaysia Local Rail', confidenceScore: 0.97, estimatedFxSavings: '2.4%', reasoning: ['MYR-INR benefits from Curlec local clearing — avoids double FX conversion', 'Maybank Mastercard success: 94% via Curlec vs 79% via SWIFT', 'Saves ~₹6,800 on ₹2.8L equivalent'],
      riskScore: 0.08, fxEfficiency: 0.96, alternatives: [{route:'Razorpay International Optimized', score:0.68, savings:'0.9%'},{route:'Direct Bank Rail (SWIFT)', score:0.55, savings:'0%'}]
    },
    {
      id: 'route_' + Math.random().toString(36).slice(2, 8),
      timestamp: new Date(Date.now() - 1000*60*45).toISOString(),
      amount: 890, sourceCurrency: 'EUR', targetCurrency: 'INR', cardCountry: 'DE', issuingBank: 'Deutsche Bank', cardNetwork: 'Visa',
      recommendedRoute: 'Razorpay International Optimized', confidenceScore: 0.89, estimatedFxSavings: '1.2%', reasoning: ['EUR high-value; Razorpay Intl gives best auth rates (92%)', 'SWIFT fees flat €15 erodes margin on <€1000', 'Dynamic FX hedged at 90.2 INR/EUR'],
      riskScore: 0.18, fxEfficiency: 0.87, alternatives: [{route:'Direct Bank Rail (SWIFT)', score:0.73, savings:'0%'},{route:'Curlec SGD Rail', score:0.41, savings:'0.3%'}]
    }
  ]
  const txns: Transaction[] = [
    { id:'pay_NsJk2o8mQ9x1Yz', orderId:'order_Ma1b2c3d', amount:1250, currency:'USD', amountINR: 104125, fxRate:83.30, status:'captured', gatewayRoute:'Razorpay International Optimized', confidenceScore:0.94, cardCountry:'US', cardNetwork:'Visa', createdAt: new Date(Date.now()-1000*60*5).toISOString(), fircStatus:'Issued', invoiceNumber:'INV-2024-8841', buyerName:'Acme Corp, USA', savingsPercent:'1.8%' },
    { id:'pay_Kp9xL2mN4q8Rt', orderId:'order_Xy7z8a9b', amount:3400, currency:'MYR', amountINR: 60350, fxRate:17.75, status:'captured', gatewayRoute:'Razorpay-Curlec Malaysia Local Rail', confidenceScore:0.97, cardCountry:'MY', cardNetwork:'Mastercard', createdAt: new Date(Date.now()-1000*60*30).toISOString(), fircStatus:'Issued', invoiceNumber:'INV-2024-8839', buyerName:'KL Tech Sdn Bhd', savingsPercent:'2.4%' },
    { id:'pay_Fa3sD5gH7j8Kl', orderId:'order_Pq2w3e4r', amount:890, currency:'EUR', amountINR: 80234, fxRate:90.14, status:'captured', gatewayRoute:'Razorpay International Optimized', confidenceScore:0.89, cardCountry:'DE', cardNetwork:'Visa', createdAt: new Date(Date.now()-1000*60*60*2).toISOString(), fircStatus:'Pending', buyerName:'Berlin Labs GmbH', savingsPercent:'1.2%' },
    { id:'pay_Zx1cV2bN3m4Qw', orderId:'order_Ty6u7i8o', amount:250, currency:'GBP', amountINR: 26450, fxRate:105.80, status:'failed', gatewayRoute:'Direct Bank Rail (SWIFT)', confidenceScore:0.64, cardCountry:'GB', cardNetwork:'Mastercard', createdAt: new Date(Date.now()-1000*60*60*5).toISOString(), fircStatus:'Not Required', buyerName:'London Studio Ltd', savingsPercent:'0.4%' },
    { id:'pay_Qw4eR5tY6u7Io', orderId:'order_Ui8o9p0a', amount:5000, currency:'INR', amountINR:5000, fxRate:1, status:'captured', gatewayRoute:'Razorpay Core', confidenceScore:0.99, cardCountry:'IN', cardNetwork:'Visa', createdAt: new Date(Date.now()-1000*60*60*8).toISOString(), fircStatus:'Not Required', buyerName:'Domestic Client', savingsPercent:'0%' },
    { id:'pay_Mn8bV9cX0z1La', orderId:'order_Bn2m3n4b', amount:1500, currency:'USD', amountINR:124950, fxRate:83.30, status:'captured', gatewayRoute:'Razorpay International Optimized', confidenceScore:0.91, cardCountry:'US', cardNetwork:'Amex', createdAt: new Date(Date.now()-1000*60*15).toISOString(), fircStatus:'Pending', invoiceNumber:'INV-2024-8845', buyerName:'Stripe Atlas Inc', savingsPercent:'1.6%' },
    { id:'pay_Hk3mL8pQ2w5Er', orderId:'order_Lc9k8j7h', amount:2100, currency:'GBP', amountINR:222180, fxRate:105.80, status:'captured', gatewayRoute:'Razorpay International Optimized', confidenceScore:0.93, cardCountry:'GB', cardNetwork:'Visa', createdAt: new Date(Date.now()-1000*60*40).toISOString(), fircStatus:'Pending', buyerName:'London Creative Studio Ltd', savingsPercent:'1.5%' },
    { id:'pay_Sg9vC4bN1m7Tq', orderId:'order_Sg3f2d1s', amount:3250, currency:'USD', amountINR:270725, fxRate:83.30, status:'captured', gatewayRoute:'Razorpay-Curlec Malaysia Local Rail', confidenceScore:0.95, cardCountry:'SG', cardNetwork:'Mastercard', createdAt: new Date(Date.now()-1000*60*50).toISOString(), fircStatus:'Pending', buyerName:'Singapore FinTech Solutions', savingsPercent:'2.1%' },
  ]
  const invoices: Invoice[] = [
    { id:'inv_1', fileName:'INV-2024-8841.pdf', invoiceNumber:'INV-2024-8841', buyerName:'Acme Corp, USA', buyerCountry:'US', amount:1250, currency:'USD', date:'2024-08-10', status:'Matched', matchedPaymentId:'pay_NsJk2o8mQ9x1Yz', uploadedAt: new Date(Date.now()-1000*60*60*3).toISOString() },
    { id:'inv_2', fileName:'INV-2024-8839.pdf', invoiceNumber:'INV-2024-8839', buyerName:'KL Tech Sdn Bhd', buyerCountry:'MY', amount:3400, currency:'MYR', date:'2024-08-09', status:'Matched', matchedPaymentId:'pay_Kp9xL2mN4q8Rt', uploadedAt: new Date(Date.now()-1000*60*60*26).toISOString() },
    { id:'inv_3', fileName:'INV-2024-8845.pdf', invoiceNumber:'INV-2024-8845', buyerName:'Stripe Atlas Inc', buyerCountry:'US', amount:1500, currency:'USD', date:'2024-08-12', status:'Pending', uploadedAt: new Date(Date.now()-1000*60*20).toISOString() },
  ]
  return { routingLogs: logs, transactions: txns, invoices }
}

export function getDb(): DB {
  if (!globalForDb.__RAZOR_DB__) globalForDb.__RAZOR_DB__ = seedDb()
  return globalForDb.__RAZOR_DB__
}

export function addRoutingLog(log: RoutingLog) {
  const db = getDb()
  db.routingLogs.unshift(log)
  if (db.routingLogs.length > 100) db.routingLogs.pop()
}
export function addTransaction(tx: Transaction) {
  const db = getDb()
  db.transactions.unshift(tx)
}
export function updateTransaction(id: string, patch: Partial<Transaction>) {
  const db = getDb()
  const idx = db.transactions.findIndex(t=>t.id===id)
  if (idx>=0) db.transactions[idx] = { ...db.transactions[idx], ...patch }
}
export function addInvoice(inv: Invoice) {
  const db = getDb()
  db.invoices.unshift(inv)
}

// FX rates mock (vs INR)
export const FX_RATES: Record<Currency, number> = {
  USD: 83.30,
  EUR: 90.14,
  MYR: 17.75,
  GBP: 105.80,
  INR: 1,
}
