"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Zap, LayoutDashboard, FileCheck, ScrollText, Globe, Menu } from "lucide-react"
import { useState } from "react"

const nav = [
  { href:'/', label:'Checkout Demo', icon: Globe },
  { href:'/dashboard', label:'Command Center', icon: LayoutDashboard },
  { href:'/dashboard/compliance', label:'FIRC & Compliance', icon: FileCheck },
  { href:'/dashboard/logs', label:'Agent Logs', icon: ScrollText },
]

export function Navbar(){
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl razor-gradient flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-black tracking-tight leading-none flex items-center gap-2">RazorAgent FX <Badge variant="secondary" className="text-[10px] h-5">BETA</Badge></div>
            <div className="text-[11px] tracking-widest text-muted-foreground uppercase">Autonomous FX Router</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {nav.map(item=>{
            const active = pathname===item.href
            return (
              <Link key={item.href} href={item.href} className={cn("px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors", active ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "hover:bg-muted")}>
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <Badge variant="outline" className="font-mono hidden lg:flex">Sandbox • GPT-4o-mini</Badge>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-blue-600" />
        </div>
        <button className="md:hidden p-2" onClick={()=> setOpen(!open)}><Menu className="w-6 h-6" /></button>
      </div>
      {open && (
        <div className="md:hidden border-t bg-white dark:bg-slate-950 p-4 space-y-1">
          {nav.map(item=>(
            <Link key={item.href} href={item.href} onClick={()=> setOpen(false)} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", pathname===item.href ? "bg-slate-900 text-white":"hover:bg-muted")}>
              <item.icon className="w-4 h-4" /> {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
