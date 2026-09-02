"use client"
import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cpu, Zap, Globe, Activity } from "lucide-react"

type Log = {
  id: string
  timestamp: string
  amount: number
  sourceCurrency: string
  recommendedRoute: string
  confidenceScore: number
  estimatedFxSavings: string
  reasoning: string[]
}

export function AgentLogTerminal({ logs }: { logs: Log[] }) {
  const [liveLogs, setLiveLogs] = useState<Log[]>(logs)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{ setLiveLogs(logs) }, [logs])

  // simulate live incoming
  useEffect(()=>{
    if (liveLogs.length===0) return
    const interval = setInterval(()=>{
      // 15% chance to inject a fake live log
      if (Math.random() > 0.85) {
        const currencies = ['USD','EUR','MYR','GBP'] as const
        const routes = ['Razorpay International Optimized','Razorpay-Curlec Malaysia Local Rail','Direct Bank Rail (SWIFT)']
        const cur = currencies[Math.floor(Math.random()*currencies.length)]
        const fake: Log = {
          id: 'route_live_'+Date.now(),
          timestamp: new Date().toISOString(),
          amount: Math.floor(Math.random()*4000)+200,
          sourceCurrency: cur,
          recommendedRoute: routes[Math.floor(Math.random()*routes.length)],
          confidenceScore: Number((0.82+Math.random()*0.15).toFixed(2)),
          estimatedFxSavings: (0.8+Math.random()*1.6).toFixed(1)+'%',
          reasoning: ['Live inference: corridor liquidity analyzed', 'Risk scoring complete', 'FX hedge locked']
        }
        setLiveLogs(prev => [fake, ...prev].slice(0,20))
      }
    }, 3000)
    return ()=> clearInterval(interval)
  }, [liveLogs.length])

  useEffect(()=>{
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [liveLogs])

  return (
    <Card className="bg-[#0a0f1f] border-[#1e293b] text-white overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 bg-[#0f172a] border-b border-[#1e293b]">
        <CardTitle className="flex items-center gap-2 text-sm font-mono tracking-widest uppercase">
          <Cpu className="w-4 h-4 text-cyan-400" />
          RazorAgent Live Decision Stream
          <span className="ml-2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        </CardTitle>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="w-3 h-3" /> {liveLogs.length} decisions
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={scrollRef} className="h-[380px] overflow-y-auto font-mono text-xs p-3 space-y-2 bg-[#020617]">
          {liveLogs.map(log=>(
            <div key={log.id} className="border border-[#1e293b] rounded-lg p-3 bg-[#0f172a]/50 hover:bg-[#1e293b]/50 transition-colors animate-slide-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString('en-IN')} • {log.amount} {log.sourceCurrency} → INR</span>
                <Badge variant={log.confidenceScore>0.9?'success':'secondary'} className="font-mono text-[10px]">{Math.round(log.confidenceScore*100)}% CONF</Badge>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-cyan-300 font-semibold">{log.recommendedRoute}</span>
                <span className="ml-auto text-emerald-400">save {log.estimatedFxSavings}</span>
              </div>
              <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                {log.reasoning.slice(0,2).map((r,i)=><li key={i} className="truncate">{r}</li>)}
              </ul>
            </div>
          ))}
          {liveLogs.length===0 && <div className="text-center py-20 text-slate-500">Awaiting transactions… Agent idle</div>}
        </div>
        <div className="px-3 py-2 bg-[#0f172a] border-t border-[#1e293b] flex items-center gap-2 text-[10px] font-mono text-slate-500">
          <Globe className="w-3 h-3" /> AGENT v2.1 • GPT-4o-mini • 42ms avg latency • Encrypted routing
        </div>
      </CardContent>
    </Card>
  )
}
