"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Upload, FileCheck, Download, Sparkles, CheckCircle2, Clock, AlertCircle, Eye, Loader2, X } from "lucide-react"
import { FircPreview } from "@/components/FircCertificateTemplate"

export default function CompliancePage(){
  const [invoices,setInvoices]=useState<any[]>([])
  const [transactions,setTransactions]=useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading,setUploading]=useState(false)
  const [dragOver,setDragOver]=useState(false)
  const [selectedFirc,setSelectedFirc]=useState<any>(null)
  const [previewData,setPreviewData]=useState<any>(null)
  const [manualText,setManualText]=useState("")
  const [showPreviewModal,setShowPreviewModal]=useState(false)

  const refresh = ()=>{
    fetch('/api/compliance').then(r=>r.json()).then(d=> setInvoices(d.invoices||[]))
    fetch('/api/transactions').then(r=>r.json()).then(d=> setTransactions(d.transactions||[]))
  }
  useEffect(()=>{ refresh() },[])

  const SAMPLE_PRESETS = [
    { label: "Sample 1: USD $1,500", text: "Invoice # INV-2024-8845\nBill To: Stripe Atlas Inc, US\nAmount: $1500 USD\nDate: 2024-08-12\nPurpose: SaaS Subscription" },
    { label: "Sample 2: EUR €890", text: "Invoice # INV-2024-8850\nBill To: Berlin Labs GmbH, DE\nAmount: €890 EUR\nDate: 2024-08-14\nPurpose: AI Model R&D Services" },
    { label: "Sample 3: MYR RM3,400", text: "Invoice # INV-2024-8852\nBill To: KL Tech Sdn Bhd, MY\nAmount: RM 3400 MYR\nDate: 2024-08-11\nPurpose: Cross-Border Licensing" },
    { label: "Sample 4: GBP £2,100", text: "Invoice # INV-2024-8855\nBill To: London Creative Studio Ltd, GB\nAmount: £2100 GBP\nDate: 2024-08-13\nPurpose: Digital Media Export" },
    { label: "Sample 5: USD $3,250", text: "Invoice # INV-2024-8860\nBill To: Singapore FinTech Solutions, SG\nAmount: $3250 USD\nDate: 2024-08-15\nPurpose: Cloud Enterprise SLA" },
  ]

  async function handleFile(file?: File, textToParse?: string){
    const f = file || selectedFile || (document.getElementById('invFile') as HTMLInputElement)?.files?.[0]
    const contentText = textToParse !== undefined ? textToParse : manualText
    if(!f && !contentText) return alert('Choose PDF/document or select a sample preset / enter text.')
    setUploading(true)
    try{
      const fd = new FormData()
      if (f) {
        fd.append('file', f)
      } else if (contentText) {
        fd.append('text', contentText)
      }
      const res = await fetch('/api/compliance', { method:'POST', body: fd })
      const data = await res.json()
      if(!res.ok) throw new Error(data.error)
      refresh()
      
      const targetInvoiceId = data.invoice?.id
      const targetPaymentId = data.matchedPayment?.id || data.invoice?.matchedPaymentId
      if(targetInvoiceId || targetPaymentId){
        const fr = await fetch('/api/firc', { 
          method:'POST', 
          headers:{'Content-Type':'application/json'}, 
          body: JSON.stringify({ invoiceId: targetInvoiceId, paymentId: targetPaymentId }) 
        })
        const fj = await fr.json()
        if(fj.firc) {
          setPreviewData(fj.firc)
          setShowPreviewModal(true)
        }
      }
    }catch(e:any){ 
      alert(e.message)
    } finally{ 
      setUploading(false)
    }
  }

  async function handleGenerateFirc(paymentId:string){
    const res = await fetch('/api/firc', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ paymentId }) })
    const data = await res.json()
    if(data.firc){ 
      setPreviewData(data.firc); 
      setShowPreviewModal(true);
      refresh() 
    } else alert(data.error||'Failed')
  }

  async function downloadFirc(){
    if(!previewData) return
    const element = document.getElementById('firc-certificate-preview')
    if(!element) return alert('Certificate preview element not found.')

    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      })

      const pdfWidth = doc.internal.pageSize.getWidth()
      const margin = 30
      const contentWidth = pdfWidth - (margin * 2)
      const contentHeight = (canvas.height * contentWidth) / canvas.width

      doc.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight)
      const filename = (previewData.fircNumber || 'FIRC').replace(/[\/\\]/g, '_') + '.pdf'
      doc.save(filename)
    } catch (err: any) {
      alert('Failed to generate PDF: ' + err.message)
    }
  }

  const pending = transactions.filter(t=> t.fircStatus==='Pending' || t.fircStatus==='Processing')

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2"><FileCheck className="w-6 h-6 text-emerald-600" /> FIRC & Tax Compliance</h1>
          <p className="text-muted-foreground">Document AI reads invoices, matches Razorpay webhooks, and auto-generates RBI-compliant FIRC certificates.</p>
        </div>
        <Badge variant="outline" className="font-mono">e-BRC Ready • jsPDF • pdf-parse + GPT-4o-mini Vision</Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Invoice PDF / Document</CardTitle>
            <CardDescription>Drag & drop or select PDF/DOC. Our Document AI extracts Invoice No, Buyer, Country, Amount, Date and matches with captured payments to auto-generate FIRC.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={e=>{e.preventDefault(); setDragOver(true)}}
              onDragLeave={()=> setDragOver(false)}
              onDrop={e=>{
                e.preventDefault(); 
                setDragOver(false); 
                const f=e.dataTransfer.files[0]; 
                if(f) { 
                  setSelectedFile(f); 
                  setManualText(""); 
                }
              }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50'}`}
            >
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              <div className="font-semibold mt-2">Drop Invoice PDF / Document here</div>
              <div className="text-sm text-muted-foreground">or</div>
              <Input 
                id="invFile" 
                type="file" 
                accept=".pdf,.doc,.docx,.txt" 
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if(f) {
                    setSelectedFile(f)
                    setManualText("")
                  }
                }}
                className="max-w-sm mx-auto mt-2" 
              />
              {selectedFile ? (
                <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-md">
                  <FileCheck className="w-4 h-4 text-emerald-600" /> Target Document: {selectedFile.name} (Ready to parse)
                  <button 
                    type="button" 
                    className="ml-1 text-slate-400 hover:text-rose-600" 
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFile(null)
                      const input = document.getElementById('invFile') as HTMLInputElement
                      if (input) input.value = ''
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground mt-2">Supports PDF, DOC, DOCX, TXT. Attach file above, then click the blue button below to parse.</div>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Quick Load Sample Presets (Use sample text if no file attached):
                </div>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_PRESETS.map((preset, idx) => (
                    <Button 
                      key={idx} 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-8 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors" 
                      onClick={() => {
                        setSelectedFile(null)
                        const input = document.getElementById('invFile') as HTMLInputElement
                        if (input) input.value = ''
                        setManualText(preset.text)
                        handleFile(undefined, preset.text)
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-xs font-medium flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-primary" /> Invoice Text (Editable fallback when no file is attached)
                </label>
                <textarea 
                  value={selectedFile ? `[Attached File: ${selectedFile.name}] Document AI will parse text directly from this attached file upon clicking 'Parse with Document AI'.` : manualText} 
                  onChange={e=> {
                    if(!selectedFile) setManualText(e.target.value)
                  }} 
                  disabled={!!selectedFile}
                  rows={4} 
                  className={`w-full rounded-md border border-input px-3 py-2 text-sm font-mono ${selectedFile ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-transparent'}`} 
                  placeholder="Paste invoice text here or choose a sample preset above..." 
                />
                <div className="flex gap-2">
                  <Button onClick={()=> handleFile()} disabled={uploading} className="gap-2">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {selectedFile ? `Parse Attached File (${selectedFile.name})` : 'Parse with Document AI'}
                  </Button>
                </div>
              </div>
            </div>

            {pending.length>0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <div className="font-semibold text-amber-800 flex items-center gap-2"><Clock className="w-4 h-4" /> Pending FIRCs — auto-match ready</div>
                <div className="text-sm text-amber-700 mt-1">{pending.length} captured international payments awaiting invoice match. Upload invoice with same amount & currency to auto-issue.</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pending.map(p=>(
                    <Badge key={p.id} variant="outline" className="bg-white">{p.amount} {p.currency} • {p.id.slice(0,12)} • {p.buyerName}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Compliance Pipeline</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { n:1, title:'PDF Ingest', desc:'pdf-parse extracts text; chunked for LLM Vision if scanned.' },
              { n:2, title:'LLM Extraction', desc:'GPT-4o-mini (or regex fallback) returns structured invoice JSON.' },
              { n:3, title:'Webhook Match', desc:'Matches amount+currency+country vs payment.captured events.' },
              { n:4, title:'FIRC Generation', desc:'jsPDF creates RBI FED-compliant certificate with UTR, AD code, purpose code P0802.' },
            ].map(s=>(
              <div key={s.n} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">{s.n}</div>
                <div><div className="font-semibold">{s.title}</div><div className="text-muted-foreground">{s.desc}</div></div>
              </div>
            ))}
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 mt-2">
              <div className="font-semibold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Zero-config demo</div>
              <div className="text-xs mt-1">No OPENAI_API_KEY? Regex parser takes over. No Razorpay keys? Mock webhook fires instantly.</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices table */}
      <Card>
        <CardHeader><CardTitle>Invoice Registry</CardTitle><CardDescription>{invoices.length} invoices • Matched = FIRC issued • Click eye to preview FIRC</CardDescription></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Invoice #</TableHead><TableHead>Buyer</TableHead><TableHead>Country</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Payment</TableHead><TableHead>Action</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map(inv=>(
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.buyerName}</TableCell>
                    <TableCell><Badge variant="outline">{inv.buyerCountry}</Badge></TableCell>
                    <TableCell className="font-mono">{inv.amount} {inv.currency}</TableCell>
                    <TableCell>{inv.date}</TableCell>
                    <TableCell><Badge variant={inv.status==='Matched'?'success': inv.status==='Pending'?'warning':'secondary'}>{inv.status}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{inv.matchedPaymentId ? inv.matchedPaymentId.slice(0,14)+'…' : '—'}</TableCell>
                    <TableCell>
                      {inv.matchedPaymentId ? (
                        <Button size="sm" variant="outline" className="h-7 gap-1" onClick={()=> handleGenerateFirc(inv.matchedPaymentId!)}><Eye className="w-3 h-3" /> View FIRC</Button>
                      ) : <span className="text-xs text-muted-foreground">Awaiting payment</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Transactions needing FIRC */}
      <Card>
        <CardHeader><CardTitle>Transactions FIRC Status</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Payment ID</TableHead><TableHead>Amount</TableHead><TableHead>Route</TableHead><TableHead>Status</TableHead><TableHead>FIRC</TableHead><TableHead>Invoice</TableHead><TableHead>Action</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(tx=>(
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">{tx.id.slice(0,16)}…</TableCell>
                    <TableCell className="font-mono">{tx.amount} {tx.currency} (₹{tx.amountINR.toLocaleString('en-IN')})</TableCell>
                    <TableCell className="text-xs">{tx.gatewayRoute}</TableCell>
                    <TableCell><Badge variant={tx.status==='captured'?'success': tx.status==='failed'?'destructive':'secondary'}>{tx.status}</Badge></TableCell>
                    <TableCell><Badge variant={tx.fircStatus==='Issued'?'success': tx.fircStatus==='Pending'?'warning':'outline'}>{tx.fircStatus}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{tx.invoiceNumber || '—'}</TableCell>
                    <TableCell>
                      {tx.fircStatus!=='Not Required' && tx.status==='captured' ? (
                        <Button size="sm" className="h-7 gap-1" onClick={()=> handleGenerateFirc(tx.id)}><Eye className="w-3 h-3" /> {tx.fircStatus==='Issued' ? 'View FIRC' : 'Generate FIRC'}</Button>
                      ) : tx.fircStatus==='Pending' ? <span className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Upload invoice</span> : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* FIRC Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              Generated FIRC Certificate
            </DialogTitle>
            <DialogDescription>
              RBI FED Master Direction compliant • Valid for e-BRC on DGFT
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-slate-50 border rounded-lg p-4">
            <FircPreview data={previewData} />
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
              Close
            </Button>
            <Button onClick={downloadFirc} className="gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
