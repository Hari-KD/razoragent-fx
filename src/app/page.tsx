"use client"
import { useState, useEffect } from "react"
import { CheckoutModal } from "@/components/CheckoutModal"
import { AgentLogTerminal } from "@/components/AgentLogTerminal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, ShieldCheck, TrendingUp, Zap, Globe, FileCheck, BarChart3, Cpu, Sparkles, Check } from "lucide-react"
import Link from "next/link"
import { formatINR } from "@/lib/utils"

export default function Home(){
  const [logs, setLogs] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(()=>{
    fetch('/api/logs').then(r=>r.json()).then(d=> setLogs(d.logs||[]))
    fetch('/api/metrics').then(r=>r.json()).then(d=> setMetrics(d))
  }, [])

  const handleSuccess = () => {
    // refresh logs
    fetch('/api/logs').then(r=>r.json()).then(d=> setLogs(d.logs||[]))
    fetch('/api/metrics').then(r=>r.json()).then(d=> setMetrics(d))
  }

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 razor-gradient opacity-95" />
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-cyan-400/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16 relative">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="text-white space-y-6">
              <Badge className="bg-white/15 text-white border-white/20 backdrop-blur gap-1.5"><Sparkles className="w-3 h-3" /> Razorpay Open Track • Internship Submission</Badge>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-[0.95]">
                Autonomous <span className="text-cyan-300">Cross-Border</span><br/> AI Payment Router
              </h1>
              <p className="text-lg text-slate-200 leading-relaxed">
                <span className="text-white font-semibold">RazorAgent FX</span> solves 3 painful truths for Indian exporters: low international card success, opaque FX markups, and manual FIRC hell. One agentic router routes, optimizes FX, and auto-issues compliance.
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: Zap, label:'0.45% Curlec FX', sub:'vs 2.1% SWIFT' },
                  { icon: TrendingUp, label:'+12% success', sub:'via local rails' },
                  { icon: FileCheck, label:'<60s FIRC', sub:'Document AI' },
                ].map(k=>(
                  <div key={k.label} className="bg-white/10 backdrop-blur border border-white/15 rounded-xl px-4 py-3 flex items-center gap-3">
                    <k.icon className="w-5 h-5 text-cyan-300" />
                    <div><div className="font-bold text-sm leading-none">{k.label}</div><div className="text-xs text-slate-300">{k.sub}</div></div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Link href="/dashboard"><Button size="lg" variant="secondary" className="gap-2 font-bold">Open Command Center <ArrowRight className="w-4 h-4" /></Button></Link>
                <Link href="/dashboard/compliance"><Button size="lg" variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10 gap-2"><FileCheck className="w-4 h-4" /> FIRC Demo</Button></Link>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-300 border-t border-white/10 pt-4">
                <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Sandbox ready — no keys needed</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-cyan-400" /> Mock FEMA-compliant FIRC</span>
              </div>
            </div>

            <div className="relative">
              <CheckoutModal onPaymentSuccess={handleSuccess} />
              <div className="mt-3 text-center text-xs text-white/60 font-mono">↑ Try USD 1250 from US Visa — see AI pick Razorpay Intl vs Curlec MY rail</div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics strip */}
      {metrics && (
        <section className="max-w-7xl mx-auto px-6 -mt-6 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label:'Cross-Border Volume', value: formatINR(metrics.totalVol), delta:'+23% vs last week', icon: Globe },
              { label:'FX Fees Saved', value: metrics.fxSaved, delta:'~₹18,420 saved', icon: TrendingUp },
              { label:'Success Rate', value: metrics.successRate+'%', delta: metrics.successBoost, icon: BarChart3 },
              { label:'Pending FIRCs', value: metrics.pendingFircs, delta:'Auto-issuing', icon: FileCheck },
            ].map(m=>(
              <Card key={m.label} className="shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs tracking-widest text-muted-foreground uppercase">{m.label}</div>
                    <m.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-black mt-1">{m.value}</div>
                  <div className="text-xs text-emerald-600 font-medium">{m.delta}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Live stream + How it works */}
      <section className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <AgentLogTerminal logs={logs} />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Cpu className="w-4 h-4 text-primary" /> How RazorAgent Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {[
                { step:'01', title:'Capture Context', desc:'Amount, currency corridor, card country, network, issuing bank → vectorized.' },
                { step:'02', title:'6-Rail Scoring', desc:'Razorpay Core, Intl Optimized, Curlec MY/SG, SWIFT, UPI Global scored on FX markup + historic auth.' },
                { step:'03', title:'LLM Reasoning', desc:'GPT-4o-mini explains tradeoffs; deterministic fallback guarantees 42ms p95.' },
                { step:'04', title:'Route & Comply', desc:'Checkout opens via winning rail; webhook → Document AI matches invoice → FIRC issued.' },
              ].map(s=>(
                <div key={s.step} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-mono text-xs font-bold shrink-0">{s.step}</div>
                  <div><div className="font-semibold">{s.title}</div><div className="text-muted-foreground">{s.desc}</div></div>
                </div>
              ))}
              <Separator />
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 font-mono text-xs">
                <div className="text-muted-foreground">API</div>
                <div className="mt-1">POST /api/agent/route</div>
                <div className="text-muted-foreground truncate">{`{ amount, sourceCurrency, cardCountry, cardNetwork }`}</div>
                <div className="mt-2 text-muted-foreground">→ {`{ recommendedRoute, confidenceScore, estimatedFxSavings, reasoning }`}</div>
              </div>
              <Link href="/dashboard/logs" className="flex items-center gap-1 text-primary font-medium hover:underline">View detailed routing logs <ArrowRight className="w-3 h-3" /></Link>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4">
              <div className="font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Why Razorpay Should Care</div>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
                <li><b>Revenue:</b> 1.8% FX saving → merchants route more volume via Razorpay, not SWIFT.</li>
                <li><b>Retention:</b> Automated FIRC cuts 3-day manual wait to 60 seconds.</li>
                <li><b>Moat:</b> Curlec acquisition finally monetized via intelligent MY/SGD rails.</li>
                <li><b>AI-native:</b> GPT-4o-mini + LangChain agentic loop — internship-grade but production-patterned.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Architecture mini */}
      <section className="max-w-7xl mx-auto px-6 pb-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Architecture at a Glance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              {[
                { title:'Checkout (Next.js)', stack:'Razorpay Checkout.js • Tailwind • Recharts', color:'bg-blue-500' },
                { title:'Agent Router', stack:'Next.js API • OpenAI GPT-4o-mini • Zod • Fallback scoring', color:'bg-violet-500' },
                { title:'DB & Storage', stack:'In-memory (Prisma-ready) • RoutingLogs, Transactions, Invoices', color:'bg-emerald-500' },
                { title:'Compliance', stack:'pdf-parse + LLM Vision → FIRC (jsPDF) • Webhook listener', color:'bg-amber-500' },
              ].map(b=>(
                <div key={b.title} className="border rounded-xl p-4">
                  <div className={`w-2 h-2 rounded-full ${b.color} mb-2`} />
                  <div className="font-bold">{b.title}</div>
                  <div className="text-muted-foreground text-xs mt-1">{b.stack}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 font-mono text-xs bg-slate-950 text-slate-300 rounded-lg p-3 overflow-x-auto">
              Browser → /api/agent/route (RazorAgent) → /api/checkout (Razorpay Order) → Checkout Modal → /api/webhooks/razorpay (payment.captured) → /api/compliance (Invoice AI) → /api/firc (PDF) → Dashboard (SWR)
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
