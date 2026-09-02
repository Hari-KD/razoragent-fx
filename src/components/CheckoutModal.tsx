"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShieldCheck, Sparkles, CreditCard, Globe, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react"

type Currency = 'USD'|'EUR'|'MYR'|'GBP'|'INR'
type AgentResult = {
  recommendedRoute: string
  confidenceScore: number
  estimatedFxSavings: string
  reasoning: string[]
  riskScore: number
  fxEfficiency: number
  fxRate: number
  amountINR: number
  alternatives?: { route: string; score: number; savings: string }[]
}

declare global { interface Window { Razorpay: any } }

export function CheckoutModal({ onPaymentSuccess }: { onPaymentSuccess?: (tx:any)=>void }) {
  const [amount, setAmount] = useState(1250)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [cardCountry, setCardCountry] = useState('US')
  const [cardNetwork, setCardNetwork] = useState('Visa')
  const [issuingBank, setIssuingBank] = useState('Chase')
  const [loading, setLoading] = useState(false)
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null)
  const [step, setStep] = useState<'form'|'agent'|'checkout'>('form')
  const [error, setError] = useState('')

  const fx = { USD:83.30, EUR:90.14, MYR:17.75, GBP:105.80, INR:1 } as Record<Currency, number>
  const inr = Math.round(amount * fx[currency])

  async function handlePreRoute() {
    setLoading(true); setError(''); setAgentResult(null)
    try {
      const res = await fetch('/api/agent/route', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ amount, sourceCurrency: currency, targetCurrency:'INR', cardCountry, cardNetwork, issuingBank })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Agent failed')
      setAgentResult(data)
      setStep('agent')
    } catch(e:any){ setError(e.message) }
    finally{ setLoading(false) }
  }

  async function handlePay() {
    if (!agentResult) return
    setLoading(true)
    try {
      const orderRes = await fetch('/api/checkout', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ amount, currency, cardCountry, cardNetwork, issuingBank, routing: agentResult })
      })
      const order = await orderRes.json()
      if (!orderRes.ok) throw new Error(order.error)

      // Load Razorpay script if needed
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject)=>{
          const s = document.createElement('script')
          s.src='https://checkout.razorpay.com/v1/checkout.js'
          s.onload=()=>resolve()
          s.onerror=()=>reject(new Error('Failed to load Razorpay'))
          document.body.appendChild(s)
        })
      }

      const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || order.keyId || 'rzp_test_mock'
      // If mock or no real key, simulate success without opening modal
      if (order.mock || key.includes('mock') || key === 'rzp_test_mock') {
        // Simulate webhook
        await fetch('/api/webhooks/razorpay', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ event:'payment.captured', payload:{ payment:{ entity:{ id:'pay_'+Math.random().toString(36).slice(2,10), order_id: order.id, amount: amount*100, currency, status:'captured', card_country: cardCountry, method:'card', card:{ network: cardNetwork } } }, order_id: order.id } })
        })
        // Also create transaction via checkout success simulation
        onPaymentSuccess?.({ id:'pay_'+Math.random().toString(36).slice(2,10), amount, currency, amountINR: inr, route: agentResult.recommendedRoute })
        alert(`✅ Mock Payment Captured!\n${amount} ${currency} → ₹${inr.toLocaleString('en-IN')} via ${agentResult.recommendedRoute}\nSavings: ${agentResult.estimatedFxSavings}`)
        setStep('form')
        setAgentResult(null)
        return
      }

      const options = {
        key,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'RazorAgent FX Demo Store',
        description: `${amount} ${currency} International Payment`,
        order_id: order.id,
        handler: async function (response:any) {
          // call webhook simulation
          await fetch('/api/webhooks/razorpay', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ event:'payment.captured', payload:{ payment:{ entity:{ id: response.razorpay_payment_id, order_id: response.razorpay_order_id, amount: amount*100, currency, status:'captured' } } } })
          })
          onPaymentSuccess?.({ id: response.razorpay_payment_id })
          alert('✅ Payment Captured: ' + response.razorpay_payment_id)
          setStep('form'); setAgentResult(null)
        },
        prefill: { name:'Demo Merchant', email:'demo@razorpay.com', contact:'9999999999' },
        theme:{ color:'#0ea5e9' },
        modal:{ ondismiss:()=> setLoading(false) }
      }
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', async (resp:any)=>{
        await fetch('/api/webhooks/razorpay', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ event:'payment.failed', payload:{ payment:{ entity:{ id: resp.error.metadata?.payment_id || 'pay_failed_'+Date.now(), order_id: order.id, amount: amount*100, currency, status:'failed' } } } })
        })
        alert('❌ Payment Failed: ' + resp.error.description)
      })
      rzp.open()
    } catch(e:any){ setError(e.message) }
    finally{ setLoading(false) }
  }

  return (
    <Card className="shadow-xl border-0 razor-glow overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Globe className="w-5 h-5 text-cyan-400" /> International Checkout
            </CardTitle>
            <CardDescription className="text-slate-300 mt-1">Razorpay Sandbox • AI routed • FIRC ready</CardDescription>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur">Sandbox Mode</Badge>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/10 backdrop-blur rounded-lg p-2">
            <div className="text-[10px] tracking-widest text-slate-300">FX RATE</div>
            <div className="font-mono font-bold">1 {currency} = ₹{fx[currency]}</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-2">
            <div className="text-[10px] tracking-widest text-slate-300">YOU PAY</div>
            <div className="font-mono font-bold">₹{inr.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-emerald-500/20 backdrop-blur rounded-lg p-2 border border-emerald-500/30">
            <div className="text-[10px] tracking-widest text-emerald-200">YOU SAVE</div>
            <div className="font-mono font-bold text-emerald-300">{agentResult?.estimatedFxSavings ?? '—'}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        {step === 'form' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" value={amount} onChange={e=> setAmount(Number(e.target.value))} min={1} />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onChange={e=> setCurrency(e.target.value as Currency)}>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="MYR">MYR — Malaysian Ringgit</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="INR">INR — Indian Rupee</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Card Country</Label>
                <Select value={cardCountry} onChange={e=> setCardCountry(e.target.value)}>
                  <option value="US">US — United States</option>
                  <option value="MY">MY — Malaysia</option>
                  <option value="DE">DE — Germany</option>
                  <option value="GB">GB — United Kingdom</option>
                  <option value="SG">SG — Singapore</option>
                  <option value="IN">IN — India</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Card Network</Label>
                <Select value={cardNetwork} onChange={e=> setCardNetwork(e.target.value)}>
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="Amex">Amex</option>
                  <option value="Discover">Discover</option>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Issuing Bank (optional)</Label>
                <Input value={issuingBank} onChange={e=> setIssuingBank(e.target.value)} placeholder="e.g. Chase, Maybank, Deutsche Bank" />
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>AI Agent will evaluate 6 rails in real-time before opening Razorpay Checkout. No charge in sandbox.</span>
            </div>
            <Button onClick={handlePreRoute} disabled={loading} className="w-full h-11 text-base gap-2 razor-gradient">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Run AI Pre-Routing Check
            </Button>
          </>
        )}

        {step === 'agent' && agentResult && (
          <div className="space-y-4 animate-slide-in">
            <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-5 h-5" /> Agent Decision Ready
                <Badge variant="success" className="ml-auto">{Math.round(agentResult.confidenceScore*100)}% Confidence</Badge>
              </div>
              <div className="mt-3">
                <div className="text-xs tracking-widest text-emerald-600 font-semibold">RECOMMENDED ROUTE</div>
                <div className="text-lg font-bold text-slate-900">{agentResult.recommendedRoute}</div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="bg-white">Save {agentResult.estimatedFxSavings} vs SWIFT</Badge>
                  <Badge variant="outline" className="bg-white">Risk {(agentResult.riskScore*100).toFixed(0)}%</Badge>
                  <Badge variant="outline" className="bg-white">FX Eff {(agentResult.fxEfficiency*100).toFixed(0)}%</Badge>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5">
                {agentResult.reasoning.map((r,i)=>(
                  <li key={i} className="flex gap-2 text-sm text-slate-700"><span className="text-emerald-600">•</span> {r}</li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 border p-3">
                <div className="text-xs text-muted-foreground">ALTERNATIVES</div>
                {agentResult.alternatives?.map((a,i)=>(
                  <div key={i} className="flex justify-between mt-1"><span className="truncate">{a.route}</span><span className="font-mono">{a.savings}</span></div>
                ))}
              </div>
              <div className="rounded-lg bg-slate-50 border p-3">
                <div className="text-xs text-muted-foreground">CONVERSION</div>
                <div className="font-mono font-bold mt-1">{amount} {currency} → ₹{agentResult.amountINR.toLocaleString('en-IN')}</div>
                <div className="text-xs text-muted-foreground">Rate: 1 {currency} = ₹{agentResult.fxRate}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={()=> setStep('form')} className="flex-1">Back</Button>
              <Button onClick={handlePay} disabled={loading} className="flex-[2] gap-2 bg-slate-900 hover:bg-slate-800">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Pay Now via Razorpay
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5" /> Secured by Razorpay • FIRC auto-generated on capture
            </div>
          </div>
        )}

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
      </CardContent>
    </Card>
  )
}
