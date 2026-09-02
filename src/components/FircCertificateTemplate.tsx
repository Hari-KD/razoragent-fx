"use client"
import { Badge } from "@/components/ui/badge"

export function FircPreview({ data }: { data: any }) {
  if (!data) return null

  return (
    <div 
      id="firc-certificate-preview" 
      className="bg-white text-slate-900 p-8 rounded-xl border border-slate-200 shadow-sm max-w-2xl mx-auto font-sans leading-normal"
    >
      {/* Header Section */}
      <div className="text-center border-b border-slate-200 pb-5">
        <div className="text-[11px] font-semibold tracking-[0.25em] text-slate-500 uppercase">
          RAZORPAY • AUTHORIZED DEALER - CATEGORY II
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1.5 uppercase">
          FOREIGN INWARD REMITTANCE CERTIFICATE
        </h1>
        <div className="text-xs text-slate-600 font-medium mt-1">
          FIRC as per RBI FED Master Direction No. 16/2015-16
        </div>
        <div className="flex justify-center mt-3">
          <Badge className="font-mono text-xs bg-slate-900 text-white font-medium px-3 py-1">
            FIRC No: {data.fircNumber}
          </Badge>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-2 gap-6 mt-6 text-sm items-start">
        {/* AD Code */}
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            AD Code
          </div>
          <div className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded inline-block border border-slate-200">
            RAZOR-000847 • Mumbai
          </div>
        </div>

        {/* Date */}
        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Date
          </div>
          <div className="font-semibold text-slate-900">{data.date}</div>
        </div>

        {/* Beneficiary Details */}
        <div className="col-span-2 border border-slate-200 rounded-lg p-4 bg-slate-50/80">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Beneficiary (Indian Merchant)
          </div>
          <div className="font-bold text-slate-900 text-sm">{data.merchantName}</div>
          <div className="text-xs text-slate-600 mt-0.5">{data.merchantAddr}</div>
          <div className="text-xs font-mono text-slate-500 mt-1.5 pt-1.5 border-t border-slate-200/60">
            PAN: {data.pan} • GSTIN: {data.gstin}
          </div>
        </div>

        {/* Remitter */}
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Remitter
          </div>
          <div className="font-bold text-slate-900 text-sm">{data.buyerName}</div>
          <div className="text-xs text-slate-600 mt-0.5">
            {data.buyerCountry} • {data.buyerBank}
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Payment Details
          </div>
          <div className="font-mono text-xs text-slate-600">ID: {data.paymentId}</div>
          <div className="font-bold text-slate-900 text-sm tracking-wide">
            {data.amount} {data.currency} → ₹{Number(data.amountINR).toLocaleString('en-IN')}
          </div>
          <div className="font-mono text-xs text-slate-500">
            FX Rate: 1 {data.currency} = ₹{data.fxRate}
          </div>
        </div>

        {/* Purpose Code */}
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Purpose Code
          </div>
          <div className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded inline-block border border-slate-200">
            P0802 • Software Export
          </div>
        </div>

        {/* Invoice */}
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Invoice
          </div>
          <div className="font-mono text-xs font-semibold text-slate-900">{data.invoiceNumber}</div>
          <div className="text-xs text-slate-600 mt-0.5">
            {new Date(data.invoiceDate).toLocaleDateString('en-GB')}
          </div>
        </div>

        {/* Certification & Signature */}
        <div className="col-span-2 border-t border-slate-200 pt-5 mt-2 flex justify-between items-end gap-4">
          <div className="text-xs leading-relaxed text-slate-600 max-w-md">
            Certified that the above remittance has been received through normal banking channels and the foreign currency has been surrendered as per FEMA 1999. This certificate is system-generated via RazorAgent FX Document AI and is valid for e-BRC purposes.
          </div>
          <div className="text-center shrink-0">
            <div className="w-36 h-16 border border-dashed border-slate-300 rounded flex items-center justify-center text-[11px] font-medium text-slate-400 bg-slate-50/50">
              Authorized Signatory
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1.5">RazorpayX • AD-II</div>
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="mt-6 flex justify-between text-[11px] font-mono text-slate-400 border-t border-slate-200 pt-3">
        <span>UTR: {data.utr}</span>
        <span>Generated: {new Date().toISOString()}</span>
        <span>Hash: {data.hash}</span>
      </div>
    </div>
  )
}
