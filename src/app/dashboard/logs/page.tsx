"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ScrollText, Search, Zap, TrendingUp, ShieldCheck, Clock } from "lucide-react"

export default function LogsPage(){
  const [logs,setLogs]=useState<any[]>([])
  const [q,setQ]=useState("")
  useEffect(()=>{ fetch('/api/logs').then(r=>r.json()).then(d=> setLogs(d.logs||[])) },[])

  const filtered = logs.filter(l=> !q || JSON.stringify(l).toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2"><ScrollText className="w-6 h-6" /> AI Routing Logs</h1>
          <p className="text-muted-foreground">Every decision the RazorAgent made — confidence, savings, reasoning, risk. Audit trail for FX desk.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search route, currency, bank..." value={q} onChange={e=> setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><div className="text-xs uppercase tracking-widest text-muted-foreground">Total Decisions</div><div className="text-2xl font-black">{logs.length}</div><div className="text-xs text-muted-foreground">Last 100 retained • In-memory (Prisma-ready)</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase tracking-widest text-muted-foreground">Avg Confidence</div><div className="text-2xl font-black">{logs.length? (logs.reduce((s,l)=>s+l.confidenceScore,0)/logs.length*100).toFixed(1)+'%':'—'}</div><div className="text-xs text-emerald-600">High confidence ≥90% in {logs.filter(l=>l.confidenceScore>=0.9).length} cases</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase tracking-widest text-muted-foreground">Avg Savings</div><div className="text-2xl font-black">{logs.length? (logs.reduce((s,l)=>s+ parseFloat(l.estimatedFxSavings.replace('%','')),0)/logs.length).toFixed(1)+'%':'—'}</div><div className="text-xs text-muted-foreground">vs SWIFT 2.1% markup</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Decision Log</CardTitle>
          <CardDescription>Timestamp • Input payload • Winning rail • 2 alternatives • Risk & FX efficiency</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Input</TableHead>
                  <TableHead>Recommended Route</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Savings</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Reasoning</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(log=>(
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-mono whitespace-nowrap"><Clock className="w-3 h-3 inline mr-1" />{new Date(log.timestamp).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-xs font-mono whitespace-nowrap"><Badge variant="outline">{log.amount} {log.sourceCurrency}</Badge> <span className="text-muted-foreground">{log.cardCountry} • {log.cardNetwork}</span><br/><span className="text-[11px] text-muted-foreground">{log.issuingBank}</span></TableCell>
                    <TableCell className="font-semibold text-xs max-w-[220px]">{log.recommendedRoute}<br/><span className="font-normal text-muted-foreground text-[11px]">Alt: {log.alternatives?.map((a:any)=> `${a.route.slice(0,18)} (${a.score})`).join(' • ')}</span></TableCell>
                    <TableCell><Badge variant={log.confidenceScore>=0.9?'success': log.confidenceScore>=0.75?'secondary':'outline'}>{Math.round(log.confidenceScore*100)}%</Badge></TableCell>
                    <TableCell className="font-mono text-emerald-600 font-bold">{log.estimatedFxSavings}</TableCell>
                    <TableCell><Badge variant="outline" className={log.riskScore<0.15?'border-emerald-300 text-emerald-700': log.riskScore<0.3?'border-amber-300 text-amber-700':'border-red-300 text-red-700'}>{(log.riskScore*100).toFixed(0)}%</Badge></TableCell>
                    <TableCell className="text-xs max-w-[320px]"><ul className="list-disc list-inside space-y-0.5 text-muted-foreground">{log.reasoning.slice(0,3).map((r:string,i:number)=><li key={i} className="truncate">{r}</li>)}</ul></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-950 text-slate-200">
        <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Zap className="w-4 h-4 text-cyan-400" /> Agent Prompt (system) — Auditable</CardTitle></CardHeader>
        <CardContent className="font-mono text-xs leading-relaxed text-slate-300">
          <div>You are RazorAgent FX, expert cross-border router for Razorpay. Optimize FX cost, success rate, compliance for Indian merchants.</div>
          <div className="mt-2 text-slate-400">Rails: Razorpay Core (1.1%), Razorpay Intl Optimized (0.9%), Curlec MY (0.45%), Curlec SGD (0.6%), SWIFT (2.1%), UPI Global (0.7%). Consider corridor liquidity, local rails (Curlec for MYR/SGD), network quirks, issuing bank, ticket size.</div>
          <div className="mt-2 flex gap-2"><Badge variant="outline" className="border-cyan-800 text-cyan-300">LangChain / OpenAI structured output</Badge><Badge variant="outline" className="border-violet-800 text-violet-300">Zod validated</Badge><Badge variant="outline" className="border-emerald-800 text-emerald-300">Deterministic fallback</Badge></div>
        </CardContent>
      </Card>
    </div>
  )
}
