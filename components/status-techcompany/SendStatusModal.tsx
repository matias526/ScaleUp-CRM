"use client"

import { useMemo, useState } from "react"
import { Download, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

type StatusPartner = {
  name: string
  countryName: string | null
  status: string
  target: number
  won: number
  pipeline: number
  hotOpportunities: { title: string; customerName: string; amount: number; probability: number; closeDate: string | null }[]
}

type SendStatusModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  techCompanyName: string
  year: string
  partners: StatusPartner[]
  onCancel?: () => void
}

const money = (value: number) => value >= 1000 ? `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K` : `$${value.toLocaleString("en-US")}`
const date = (value: string | null) => value ? new Date(value).toLocaleDateString("es-AR") : "—"

export function SendStatusModal({ open, onOpenChange, techCompanyName, year, partners, onCancel }: SendStatusModalProps) {
  const [note, setNote] = useState("")
  const { toast } = useToast()
  const totals = useMemo(() => partners.reduce((acc, partner) => ({ target: acc.target + partner.target, won: acc.won + partner.won, pipeline: acc.pipeline + partner.pipeline }), { target: 0, won: 0, pipeline: 0 }), [partners])
  const expected = totals.won + totals.pipeline
  const coverage = totals.target ? Math.round((totals.won / totals.target) * 100) : 0
  const expectedPercent = totals.target ? Math.round((expected / totals.target) * 100) : 0
  const remaining = Math.max(0, totals.target - expected)
  const opportunities = partners.flatMap((partner) => partner.hotOpportunities.map((opportunity) => ({ ...opportunity, partner: partner.name }))).sort((a, b) => b.probability - a.probability).slice(0, 5)

  const sendEmail = () => {
    const subject = encodeURIComponent(`Weekly Status - ${techCompanyName} - ${year}`)
    const body = encodeURIComponent(`${note}\n\nTarget Anual: ${money(totals.target)}\nGanado: ${money(totals.won)}\nPonderado: ${money(totals.pipeline)}`)
    toast({ title: "Status enviado", description: "Se abrió tu cliente de correo para completar el envío." })
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto bg-zinc-100 p-0"><DialogHeader className="border-b bg-zinc-100 px-6 pb-4 pt-5"><DialogTitle>Enviar Status de TechCompany</DialogTitle></DialogHeader><article className="bg-white text-zinc-900 p-8 sm:p-12 mx-auto max-w-3xl shadow-md border my-6 space-y-6 print:shadow-none print:border-none print:m-0 print:w-full"><header><h1 className="text-2xl font-bold">Weekly Status - {techCompanyName} - W37 - {year}</h1><p className="text-sm text-zinc-500">Generado: {new Date().toLocaleDateString("es-AR")} (Snapshot) | Estado: ON TRACK ({coverage}% Cobertura Anual)</p></header><Separator className="my-4" /><section><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">1. FORECAST &amp; PROGRESS MATRIX (Target Anual: {money(totals.target)})</h2><div className="space-y-3"><ProgressRow label="Target Anual" value={totals.target} total={totals.target} suffix="100% Meta" color="bg-zinc-400" /><ProgressRow label="Ganado (YTD)" value={totals.won} total={totals.target} suffix={`${coverage}% Cobertura`} color="bg-emerald-500" /><ProgressRow label="Ponderado (90d)" value={totals.pipeline} total={totals.target} suffix={`${totals.target ? Math.round(totals.pipeline / totals.target * 100) : 0}% Adicional`} color="bg-blue-500" /></div><div className="mt-4 rounded-md border bg-zinc-50 p-4"><div className="flex flex-wrap justify-between gap-2 text-sm font-semibold"><span>TOTAL ESPERADO: {money(expected)} / {money(totals.target)} ({expectedPercent}% Cobertura)</span><span>GAP Restante: {money(remaining)}</span></div><div className="mt-3 flex h-3 overflow-hidden rounded-full bg-zinc-200"><div className="bg-emerald-500" style={{ width: `${totals.target ? totals.won / totals.target * 100 : 0}%` }} /><div className="bg-blue-500" style={{ width: `${totals.target ? totals.pipeline / totals.target * 100 : 0}%` }} /></div></div><p className="mt-3 text-xs text-zinc-500">Cash Cobrado esta semana: $0.0K | Nuevos Deals: +$12.0K | Pipeline Activo: {money(totals.pipeline)}</p></section><Separator className="my-6" /><section><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">2. ESTADO DE PARTNERS &amp; PERFORMANCE</h2><table className="w-full border-collapse text-sm"><thead><tr className="border-b text-left text-xs text-zinc-500"><th className="p-2">Partner</th><th className="p-2">País</th><th className="p-2">Forecast Q3/Q4</th><th className="p-2">Status</th><th className="p-2">Bloqueo / Riesgo</th></tr></thead><tbody>{partners.map((partner) => <tr key={partner.name} className="border-b"><td className="p-2 font-medium">{partner.name}</td><td className="p-2">{partner.countryName ?? "—"}</td><td className="p-2">{money(partner.pipeline)}</td><td className="p-2"><Badge variant="outline">{partner.status}</Badge></td><td className="p-2 text-zinc-500">{partner.pipeline > 0 ? "Requiere seguimiento" : "Sin riesgos"}</td></tr>)}</tbody></table></section><Separator className="my-6" /><section><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">3. TOP HOT OPPORTUNITIES (Next 90 Days)</h2><table className="w-full border-collapse text-sm"><thead><tr className="border-b text-left text-xs text-zinc-500"><th className="p-2">Cliente / Deal</th><th className="p-2">Partner</th><th className="p-2">Monto ($)</th><th className="p-2">Probabilidad</th><th className="p-2">Cierre Est.</th></tr></thead><tbody>{opportunities.map((opportunity) => <tr key={`${opportunity.partner}-${opportunity.title}`} className="border-b"><td className="p-2 font-medium">{opportunity.customerName || opportunity.title}</td><td className="p-2">{opportunity.partner}</td><td className="p-2">{money(opportunity.amount)}</td><td className="p-2">{opportunity.probability}%</td><td className="p-2">{date(opportunity.closeDate)}</td></tr>)}</tbody></table></section><Separator className="my-6" /><section><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">4. RIESGOS CRÍTICOS &amp; ACCIONES REQUERIDAS</h2><div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-950"><p className="font-semibold">Riesgo #1: Seguimiento requerido en oportunidades activas.</p><p className="mt-2 text-sm">Impacto Financiero: {money(totals.pipeline)} en riesgo para Q4.</p><p className="mt-1 text-sm">Acción Requerida: Revisar y actualizar el plan de acción.</p><p className="mt-1 text-sm">Fecha Límite: 20/Sep/{year}.</p></div></section><Separator className="my-6" /><section><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">5. EXPANSIÓN DE RED DE PARTNERS</h2><p className="text-sm">• En Onboarding: 2 nuevos Partners en proceso de incorporación para Q4.</p><p className="mt-4 text-xs text-zinc-500">Regla Aplicada: Deals en status Frozen, Hold y unverified se excluyen del Forecast Ponderado.</p></section></article><footer className="border-t bg-zinc-100 p-4"><label htmlFor="status-note" className="sr-only">Notas de la reunión</label><Textarea id="status-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Notas de la reunión..." className="mb-3 bg-white" /><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => { onCancel?.(); onOpenChange(false) }}>Cancelar</Button><Button variant="outline" onClick={() => window.print()}><Download className="mr-2 size-4" />Descargar PDF</Button><Button onClick={sendEmail}><Send className="mr-2 size-4" />Enviar Status por Email</Button></div></footer></DialogContent></Dialog>
}

function ProgressRow({ label, value, total, suffix, color }: { label: string; value: number; total: number; suffix: string; color: string }) {
  const percent = total ? Math.min(100, (value / total) * 100) : 0
  return <div><div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="text-zinc-500">{money(value)} ({suffix})</span></div><div className="h-2 rounded-full bg-zinc-200"><div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} /></div></div>
}

export default SendStatusModal
