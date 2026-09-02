"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
const TabsContext = React.createContext<{ value: string, onValueChange: (v:string)=>void } | null>(null)
export function Tabs({ defaultValue, value, onValueChange, children, className }: { defaultValue?: string, value?: string, onValueChange?: (v:string)=>void, children: React.ReactNode, className?: string }) {
  const [internal, setInternal] = React.useState(value ?? defaultValue ?? "")
  const current = value ?? internal
  const set = (v:string) => { if (!value) setInternal(v); onValueChange?.(v) }
  return <TabsContext.Provider value={{ value: current, onValueChange: set }}><div className={cn(className)}>{children}</div></TabsContext.Provider>
}
export function TabsList({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className)}>{children}</div>
}
export function TabsTrigger({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) {
  const ctx = React.useContext(TabsContext)!
  const active = ctx.value === value
  return <button onClick={()=>ctx.onValueChange(value)} className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", active && "bg-background text-foreground shadow", className)}>{children}</button>
}
export function TabsContent({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) {
  const ctx = React.useContext(TabsContext)!
  if (ctx.value !== value) return null
  return <div className={cn("mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>{children}</div>
}
