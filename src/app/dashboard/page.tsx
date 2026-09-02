"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AgentLogTerminal } from "@/components/AgentLogTerminal"
import { TrendingUp, Globe, BarChart3, FileCheck, ArrowUpRight, Activity, DollarSign } from "lucide-react"
import { formatINR } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts"

export default function DashboardPage(){
  const [metrics,setMetrics]=useState<any>(null)
  const [transactions,setTransactions]=useState<any[]>([])
  const [logs,setLogs]=useState<any[]>([])

  useEffect(()=>{
    fetch('/api/metrics').then(r=>r.json()).then(setMetrics)
    fetch('/api/transactions').then(r=>r.json()).then(d=> setTransactions(d.transactions||[]))
    fetch('/api/logs').then(r=>r.json()).then(d=> setLogs(d.logs||[]))
  },[])

  if(!metrics) return <div className="max-w-7xl mx-auto px-6 py-10">Loading Command Center…</div>

  const COLORS = ['#0ea5e9','#06b6d4','#8b5cf6','#10b981']

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Merchant Command Center</h1>
          <p className="text-muted-foreground">Live FX routing, success lift, and compliance posture — Bengaluru merchant • Last 7 days</p>
        </div>
        <Badge variant="outline" className="font-mono w-fit">LIVE • Auto-refresh 8s • INR base</Badge>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex justify-between"><span className="text-xs tracking-widest uppercase text-muted-foreground">Cross-Border Volume</span><Globe className="w-4 h-4 text-blue-600" /></div>
            <div className="text-2xl font-black mt-1">{formatINR(metrics.totalVol)}</div>
            <div className="text-xs text-emerald-600 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> +23.1% WoW • {metrics.totalTx} txns</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex justify-between"><span className="text-xs tracking-widest uppercase text-muted-foreground">FX Fees Saved</span><TrendingUp className="w-4 h-4 text-emerald-600" /></div>
            <div className="text-2xl font-black mt-1">{metrics.fxSaved}</div>
            <div className="text-xs text-muted-foreground">~₹18,420 vs SWIFT • Avg per txn</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-violet-600">
          <CardContent className="p-4">
            <div className="flex justify-between"><span className="text-xs tracking-widest uppercase text-muted-foreground">Success Rate</span><BarChart3 className="w-4 h-4 text-violet-600" /></div>
            <div className="text-2xl font-black mt-1">{metrics.successRate}%</div>
            <div className="text-xs text-emerald-600">{metrics.successBoost} with AI routing</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex justify-between"><span className="text-xs tracking-widest uppercase text-muted-foreground">Pending FIRCs</span><FileCheck className="w-4 h-4 text-amber-600" /></div>
            <div className="text-2xl font-black mt-1">{metrics.pendingFircs}</div>
            <div className="text-xs text-amber-600">Auto-issuing in &lt;60s</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" /> Weekly Volume & Success</CardTitle>
            <CardDescription>INR settled per day • Captured vs failed overlay</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.weekly}>
                <defs><linearGradient id="vol" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={v=> `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v:any)=> [`₹${Number(v).toLocaleString('en-IN')}`, 'Volume']} />
                <Area type="monotone" dataKey="vol" stroke="#0ea5e9" fill="url(#vol)" strokeWidth={2} />
                <Bar dataKey="tx" barSize={6} fill="#8b5cf6" radius={[4,4,0,0]} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Route Mix</CardTitle><CardDescription>Winning rails last 30 txns</CardDescription></CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={metrics.byRoute} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {metrics.byRoute.map((e:any,i:number)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center text-xs">
              {metrics.byRoute.map((r:any,i:number)=><span key={r.route} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{background:COLORS[i%COLORS.length]}} />{r.route} ({r.value})</span>)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4" /> Currency Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.byCurrency} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" fontSize={11} />
                    <YAxis dataKey="currency" type="category" fontSize={12} width={40} />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#0ea5e9" radius={[0,6,6,0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-5 gap-2 mt-2 text-center text-xs">
                {metrics.byCurrency.map((c:any)=><div key={c.currency} className="border rounded-lg p-2"><div className="font-bold">{c.currency}</div><div className="text-muted-foreground">{c.count} tx</div><div className="font-mono">{c.amount.toLocaleString()}</div></div>)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Recent Transactions</CardTitle><CardDescription>Live • FIRC status auto-updates via webhook</CardDescription></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>ID</TableHead><TableHead>Currency</TableHead><TableHead>Amount</TableHead><TableHead>INR</TableHead><TableHead>Route</TableHead><TableHead>Status</TableHead><TableHead>FIRC</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0,7).map(t=>(
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.id.slice(0,14)}…</TableCell>
                        <TableCell><Badge variant="outline">{t.currency}</Badge></TableCell>
                        <TableCell className="font-mono">{t.amount.toLocaleString()} {t.currency}</TableCell>
                        <TableCell className="font-mono">{formatINR(t.amountINR)}</TableCell>
                        <TableCell className="text-xs max-w-[180px] truncate">{t.gatewayRoute}</TableCell>
                        <TableCell><Badge variant={t.status==='captured'?'success': t.status==='failed'?'destructive':'secondary'}>{t.status}</Badge></TableCell>
                        <TableCell><Badge variant={t.fircStatus==='Issued'?'success': t.fircStatus==='Pending'?'warning':'outline'}>{t.fircStatus}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <AgentLogTerminal logs={logs} />
          <Card className="mt-4 bg-slate-900 text-white border-slate-800">
            <CardContent className="p-4 text-sm">
              <div className="font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Agent Health</div>
              <div className="grid grid-cols-2 gap-3 mt-3 font-mono text-xs">
                <div className="bg-white/5 rounded-lg p-2"><div className="text-slate-400">Avg latency</div><div className="text-lg font-bold">42ms</div></div>
                <div className="bg-white/5 rounded-lg p-2"><div className="text-slate-400">Uptime</div><div className="text-lg font-bold">99.96%</div></div>
                <div className="bg-white/5 rounded-lg p-2"><div className="text-slate-400">Rails eval</div><div className="text-lg font-bold">6</div></div>
                <div className="bg-white/5 rounded-lg p-2"><div className="text-slate-400">Model</div><div className="text-sm font-bold">gpt-4o-mini / mock</div></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
