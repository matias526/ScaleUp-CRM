"use client"

import { useMemo, useState } from "react"
import { Download, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "@/hooks/use-translations"
import type { PotentialPartner } from "./potential-partners-card"

const STATUS_MODAL_TRANSLATIONS = {
  "send.title": { es: "Enviar Status de TechCompany", en: "Send TechCompany Status", pt: "Enviar status da TechCompany" },
  "send.generated": { es: "Generado", en: "Generated", pt: "Gerado" },
  "send.snapshot": { es: "Snapshot", en: "Snapshot", pt: "Snapshot" },
  "send.state": { es: "Estado", en: "Status", pt: "Status" },
  "send.onTrack": { es: "En ritmo", en: "On track", pt: "No ritmo" },
  "send.annualCoverage": { es: "Cobertura anual", en: "Annual coverage", pt: "Cobertura anual" },
  "send.forecast": { es: "Forecast y matriz de progreso", en: "Forecast & progress matrix", pt: "Previsão e matriz de progresso" },
  "send.annualTarget": { es: "Target anual", en: "Annual target", pt: "Meta anual" },
  "send.wonYtd": { es: "Ganado (YTD)", en: "Won (YTD)", pt: "Ganho (YTD)" },
  "send.weighted90": { es: "Ponderado (90d)", en: "Weighted (90d)", pt: "Ponderado (90d)" },
  "send.goal": { es: "Meta", en: "Goal", pt: "Meta" },
  "send.coverage": { es: "Cobertura", en: "Coverage", pt: "Cobertura" },
  "send.additional": { es: "Adicional", en: "Additional", pt: "Adicional" },
  "send.expected": { es: "Total esperado", en: "Expected total", pt: "Total esperado" },
  "send.gap": { es: "Gap restante", en: "Remaining gap", pt: "Gap restante" },
  "send.partners": { es: "Estado de Partners y performance", en: "Partner status & performance", pt: "Status e performance dos partners" },
  "send.partner": { es: "Partner", en: "Partner", pt: "Partner" },
  "send.country": { es: "País", en: "Country", pt: "País" },
  "send.status": { es: "Estado", en: "Status", pt: "Status" },
  "status.onTrack": { es: "En ritmo", en: "On track", pt: "No ritmo" },
  "status.needsFocus": { es: "Requiere foco", en: "Needs focus", pt: "Requer foco" },
  "send.impact": { es: "Impacto / Bloqueo", en: "Impact / Blocker", pt: "Impacto / Bloqueio" },
  "send.hot": { es: "Oportunidades calientes", en: "Hot opportunities", pt: "Oportunidades quentes" },
  "send.risks": { es: "Riesgos críticos", en: "Critical risks", pt: "Riscos críticos" },
  "send.expansion": { es: "Expansión de red", en: "Network expansion", pt: "Expansão da rede" },
  "send.inProcess": { es: "Partners en proceso", en: "Partners in progress", pt: "Partners em processo" },
  "send.probability": { es: "Probabilidad", en: "Probability", pt: "Probabilidade" },
  "send.onboardingDate": { es: "Fecha estimada de incorporación", en: "Estimated onboarding date", pt: "Data estimada de incorporação" },
  "send.noDate": { es: "Sin fecha", en: "No date", pt: "Sem data" },
  "send.note": { es: "Nota para el equipo", en: "Note for the team", pt: "Nota para a equipe" },
  "send.cancel": { es: "Cancelar", en: "Cancel", pt: "Cancelar" },
  "send.download": { es: "Descargar PDF", en: "Download PDF", pt: "Baixar PDF" },
  "send.email": { es: "Enviar por email", en: "Send by email", pt: "Enviar por e-mail" },
  "send.sent": { es: "Status preparado", en: "Status prepared", pt: "Status preparado" },
  "send.emailDescription": { es: "Se abrió tu cliente de correo para completar el envío.", en: "Your email client was opened to complete sending.", pt: "Seu cliente de e-mail foi aberto para concluir o envio." },
  "send.expectedTotal": { es: "Total esperado", en: "Expected total", pt: "Total esperado" },
  "send.remainingGap": { es: "Gap restante", en: "Remaining gap", pt: "Gap restante" },
  "send.weeklyCash": { es: "Cash cobrado esta semana", en: "Cash collected this week", pt: "Cash coletado esta semana" },
  "send.newDeals": { es: "Nuevos deals", en: "New deals", pt: "Novos deals" },
  "send.activePipeline": { es: "Pipeline activo", en: "Active pipeline", pt: "Pipeline ativo" },
  "send.forecastQ": { es: "Forecast Q3/Q4", en: "Q3/Q4 forecast", pt: "Previsão Q3/Q4" },
  "send.blockerRisk": { es: "Bloqueo / Riesgo", en: "Blocker / Risk", pt: "Bloqueio / Risco" },
  "send.requiresFollowUp": { es: "Requiere seguimiento", en: "Follow-up required", pt: "Requer acompanhamento" },
  "send.noRisks": { es: "Sin riesgos", en: "No risks", pt: "Sem riscos" },
  "send.clientDeal": { es: "Cliente / Deal", en: "Client / Deal", pt: "Cliente / Deal" },
  "send.amount": { es: "Monto ($)", en: "Amount ($)", pt: "Valor ($)" },
  "send.estimatedClose": { es: "Cierre estimado", en: "Estimated close", pt: "Fechamento estimado" },
  "send.criticalActions": { es: "Riesgos críticos y acciones requeridas", en: "Critical risks & required actions", pt: "Riscos críticos e ações necessárias" },
  "send.riskFollowUp": { es: "Risk #1: Follow-up required for active opportunities.", en: "Risk #1: Follow-up required for active opportunities.", pt: "Risco #1: acompanhamento necessário para oportunidades ativas." },
  "send.financialImpact": { es: "Impacto financiero", en: "Financial impact", pt: "Impacto financeiro" },
  "send.requiredAction": { es: "Acción requerida", en: "Required action", pt: "Ação necessária" },
  "send.deadline": { es: "Fecha límite", en: "Deadline", pt: "Prazo" },

} as const

type StatusPartner = {
  name: string
  countryName: string | null
  status: string
  target: number
  won: number
  pipeline: number
  hotOpportunities: { title: string; customerName: string; amount: number; probability: number; closeDate: string | null }[]
  impacts: { title: string; description: string | null; amount: number; severity: string; scope: string }[]
}

type SendStatusModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  techCompanyName: string
  year: string
  partners: StatusPartner[]
  inProcessPartners: PotentialPartner[]
  onCancel?: () => void
}

const money = (value: number) => value >= 1000 ? `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K` : `$${value.toLocaleString("en-US")}`
const date = (value: string | null, locale: string) => value ? new Date(value).toLocaleDateString(locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-AR") : "—"

export function SendStatusModal({ open, onOpenChange, techCompanyName, year, partners, inProcessPartners, onCancel }: SendStatusModalProps) {
  const { t } = useTranslations(STATUS_MODAL_TRANSLATIONS)
  const tx = (key: keyof typeof STATUS_MODAL_TRANSLATIONS) => t(key, key)
  const statusLabel = (status: string) => status === "status.onTrack" ? tx("status.onTrack") : status === "status.needsFocus" ? tx("status.needsFocus") : status
  const [note, setNote] = useState("")
  const { toast } = useToast()
  const totals = useMemo(() => partners.reduce((acc, partner) => ({ target: acc.target + partner.target, won: acc.won + partner.won, pipeline: acc.pipeline + partner.pipeline }), { target: 0, won: 0, pipeline: 0 }), [partners])
  const expected = totals.won + totals.pipeline
  const coverage = totals.target ? Math.round((totals.won / totals.target) * 100) : 0
  const expectedPercent = totals.target ? Math.round((expected / totals.target) * 100) : 0
  const remaining = Math.max(0, totals.target - expected)
  const opportunities = partners.flatMap((partner) => partner.hotOpportunities.map((opportunity) => ({ ...opportunity, partner: partner.name }))).sort((a, b) => { if (!a.closeDate) return 1; if (!b.closeDate) return -1; return new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime() }).slice(0, 5)
  const impacts = partners.flatMap((partner) => partner.impacts.map((impact) => ({ ...impact, partner: partner.name })))

  const sendEmail = () => {
    const subject = encodeURIComponent(`Weekly Status - ${techCompanyName} - ${year}`)
    const body = encodeURIComponent(`${note}\n\n${tx("send.annualTarget")}: ${money(totals.target)}\nWon: ${money(totals.won)}\nWeighted pipeline: ${money(totals.pipeline)}`)
    toast({ title: tx("send.sent"), description: tx("send.emailDescription") })
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto bg-zinc-100 p-0"><DialogHeader className="border-b bg-zinc-100 px-6 pb-4 pt-5"><DialogTitle>{tx("send.title")}</DialogTitle></DialogHeader><article className="bg-white text-zinc-900 p-8 sm:p-12 mx-auto max-w-3xl shadow-md border my-6 space-y-6 print:shadow-none print:border-none print:m-0 print:w-full"><header><h1 className="text-2xl font-bold">Weekly Status - {techCompanyName} - W37 - {year}</h1><p className="text-sm text-zinc-500">{tx("send.generated")}: {new Date().toLocaleDateString("en-US")} ({tx("send.snapshot")}) | {tx("send.state")}: {tx("send.onTrack")} ({coverage}% {tx("send.annualCoverage")})</p></header><Separator className="my-4" /><section><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">1. {tx("send.forecast")} ({tx("send.annualTarget")}: {money(totals.target)})</h2><div className="space-y-3"><ProgressRow label={tx("send.annualTarget")} value={totals.target} total={totals.target} suffix={`100% ${tx("send.goal")}`} color="bg-zinc-400" /><ProgressRow label={tx("send.wonYtd")} value={totals.won} total={totals.target} suffix={`${coverage}% ${tx("send.coverage")}`} color="bg-emerald-500" /><ProgressRow label={tx("send.weighted90")} value={totals.pipeline} total={totals.target} suffix={`${totals.target ? Math.round(totals.pipeline / totals.target * 100) : 0}% ${tx("send.additional")}`} color="bg-blue-500" /></div><div className="mt-4 rounded-md border bg-zinc-50 p-4"><div className="flex flex-wrap justify-between gap-2 text-sm font-semibold"><span>{tx("send.expectedTotal")}: {money(expected)} / {money(totals.target)} ({expectedPercent}% {tx("send.coverage")})</span><span>{tx("send.remainingGap")}: {money(remaining)}</span></div><div className="mt-3 flex h-3 overflow-hidden rounded-full bg-zinc-200"><div className="bg-emerald-500" style={{ width: `${totals.target ? totals.won / totals.target * 100 : 0}%` }} /><div className="bg-blue-500" style={{ width: `${totals.target ? totals.pipeline / totals.target * 100 : 0}%` }} /></div></div><p className="mt-3 text-xs text-zinc-500">{tx("send.weeklyCash")}: $0.0K | {tx("send.newDeals")}: +$12.0K | {tx("send.activePipeline")}: {money(totals.pipeline)}</p></section><Separator className="my-6" /><section><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">2. {tx("send.partners")}</h2><table className="w-full border-collapse text-sm"><thead><tr className="border-b text-left text-xs text-zinc-500"><th className="p-2">Partner</th><th className="p-2">{tx("send.country")}</th><th className="p-2">{tx("send.forecastQ")}</th><th className="p-2">{tx("send.status")}</th><th className="p-2">{tx("send.blockerRisk")}</th></tr></thead><tbody>{partners.map((partner) => <tr key={partner.name} className="border-b"><td className="p-2 font-medium">{partner.name}</td><td className="p-2">{partner.countryName ?? "—"}</td><td className="p-2">{money(partner.pipeline)}</td><td className="p-2"><Badge variant="outline">{statusLabel(partner.status)}</Badge></td><td className="p-2 text-zinc-500">{partner.pipeline > 0 ? tx("send.requiresFollowUp") : tx("send.noRisks")}</td></tr>)}</tbody></table></section><Separator className="my-6" /><section><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">3. {tx("send.hot")} (Next 90 Days)</h2><table className="w-full border-collapse text-sm"><thead><tr className="border-b text-left text-xs text-zinc-500"><th className="p-2">{tx("send.clientDeal")}</th><th className="p-2">{tx("send.partner")}</th><th className="p-2">{tx("send.amount")}</th><th className="p-2">{tx("send.probability")}</th><th className="p-2">{tx("send.estimatedClose")}</th></tr></thead><tbody>{opportunities.map((opportunity) => <tr key={`${opportunity.partner}-${opportunity.title}`} className="border-b"><td className="p-2 font-medium">{opportunity.customerName || opportunity.title}</td><td className="p-2">{opportunity.partner}</td><td className="p-2">{money(opportunity.amount)}</td><td className="p-2">{opportunity.probability}%</td><td className="p-2">{date(opportunity.closeDate, "en")}</td></tr>)}</tbody></table></section><Separator className="my-6" /><section><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">4. {tx("send.criticalActions")}</h2><div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-950">{impacts.length ? <div className="space-y-4">{impacts.map((impact, index) => <div key={`${impact.partner}-${impact.title}-${index}`} className="border-b border-amber-200 pb-3 last:border-0 last:pb-0"><p className="font-semibold">{impact.title}</p><p className="mt-1 text-sm">{impact.partner}{impact.scope ? ` · ${impact.scope}` : ""}{impact.severity ? ` · ${impact.severity}` : ""}</p>{impact.description && <p className="mt-1 text-sm">{impact.description}</p>}<p className="mt-1 text-sm font-medium">{tx("send.financialImpact")}: {money(impact.amount)}</p><p className="mt-1 text-sm">{tx("send.requiredAction")}: {tx("send.requiresFollowUp")}</p></div>)}</div> : <p className="font-semibold">{tx("send.noRisks")}</p>}</div></section><Separator className="my-6" /><section><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">5. {tx("send.expansion")}</h2><div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead className="bg-zinc-50 text-xs text-zinc-500"><tr><th className="p-2 text-left">{tx("send.partner")}</th><th className="p-2 text-left">{tx("send.country")}</th><th className="p-2 text-right">{tx("send.probability")}</th><th className="p-2 text-left">{tx("send.onboardingDate")}</th></tr></thead><tbody>{inProcessPartners.filter((partner) => partner.probability > 40).map((partner) => <tr key={partner.id} className="border-t"><td className="p-2 font-medium">{partner.name}</td><td className="p-2">{partner.country}</td><td className="p-2 text-right">{partner.probability}%</td><td className="p-2">{date(partner.closeDate, "en")}</td></tr>)}</tbody></table></div></section></article><footer className="border-t bg-zinc-100 p-4"><label htmlFor="status-note" className="sr-only">Notas de la reunión</label><Textarea id="status-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder={tx("send.note")} className="mb-3 bg-white" /><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => { onCancel?.(); onOpenChange(false) }}>{tx("send.cancel")}</Button><Button variant="outline" onClick={() => window.print()}><Download className="mr-2 size-4" />{tx("send.download")}</Button><Button onClick={sendEmail}><Send className="mr-2 size-4" />{tx("send.email")}</Button></div></footer></DialogContent></Dialog>
}

function ProgressRow({ label, value, total, suffix, color }: { label: string; value: number; total: number; suffix: string; color: string }) {
  const percent = total ? Math.min(100, (value / total) * 100) : 0
  return <div><div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="text-zinc-500">{money(value)} ({suffix})</span></div><div className="h-2 rounded-full bg-zinc-200"><div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} /></div></div>
}

export default SendStatusModal
