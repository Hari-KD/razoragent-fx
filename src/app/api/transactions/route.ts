import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(){
  const db = getDb()
  return NextResponse.json({ transactions: db.transactions })
}
