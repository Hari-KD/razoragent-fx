import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
export async function GET(){
  const db = getDb()
  const totalVol = db.transactions.filter(t=>t.status==='captured').reduce((s,t)=>s+t.amountINR,0)
  const totalTx = db.transactions.length
  const successRate = totalTx ? (db.transactions.filter(t=>t.status==='captured').length/totalTx*100).toFixed(1) : '0'
  const pendingFircs = db.transactions.filter(t=>t.fircStatus==='Pending' || t.fircStatus==='Processing').length
  const avgSavings = db.transactions.filter(t=>t.savingsPercent).reduce((s,t)=> s+ parseFloat((t.savingsPercent||'0').replace('%','')),0) / (db.transactions.length||1)
  // compute weekly volume for chart - mock from transactions
  const weekly = [
    { name:'Mon', vol: 42000+ Math.floor(Math.random()*10000), tx: 12 },
    { name:'Tue', vol: 61000+ Math.floor(Math.random()*10000), tx: 18 },
    { name:'Wed', vol: 53000+ Math.floor(Math.random()*10000), tx: 15 },
    { name:'Thu', vol: 78000+ Math.floor(Math.random()*10000), tx: 22 },
    { name:'Fri', vol: 95000+ Math.floor(Math.random()*10000), tx: 28 },
    { name:'Sat', vol: 34000+ Math.floor(Math.random()*10000), tx: 9 },
    { name:'Sun', vol: 29000+ Math.floor(Math.random()*10000), tx: 7 },
  ]
  const byCurrency = [
    { currency:'USD', amount: db.transactions.filter(t=>t.currency==='USD').reduce((s,t)=>s+t.amount,0), count: db.transactions.filter(t=>t.currency==='USD').length },
    { currency:'EUR', amount: db.transactions.filter(t=>t.currency==='EUR').reduce((s,t)=>s+t.amount,0), count: db.transactions.filter(t=>t.currency==='EUR').length },
    { currency:'MYR', amount: db.transactions.filter(t=>t.currency==='MYR').reduce((s,t)=>s+t.amount,0), count: db.transactions.filter(t=>t.currency==='MYR').length },
    { currency:'GBP', amount: db.transactions.filter(t=>t.currency==='GBP').reduce((s,t)=>s+t.amount,0), count: db.transactions.filter(t=>t.currency==='GBP').length },
    { currency:'INR', amount: db.transactions.filter(t=>t.currency==='INR').reduce((s,t)=>s+t.amount,0), count: db.transactions.filter(t=>t.currency==='INR').length },
  ]
  const byRoute = [
    { route:'Razorpay Intl', value: db.transactions.filter(t=>t.gatewayRoute.includes('International')).length },
    { route:'Curlec MY Rail', value: db.transactions.filter(t=>t.gatewayRoute.includes('Curlec Malaysia')).length },
    { route:'SWIFT', value: db.transactions.filter(t=>t.gatewayRoute.includes('SWIFT')).length },
    { route:'Core', value: db.transactions.filter(t=>t.gatewayRoute==='Razorpay Core').length },
  ]
  return NextResponse.json({
    totalVol, totalTx, successRate, pendingFircs,
    fxSaved: avgSavings.toFixed(1)+'%',
    successBoost:'+12.4%',
    weekly, byCurrency, byRoute
  })
}
