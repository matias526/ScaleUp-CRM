"use client"

import { useEffect, useMemo, useState } from "react"
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
  techCompanyId: string
  techCompanyLogo?: string | null
  year: string
  partners: StatusPartner[]
  inProcessPartners: PotentialPartner[]
  onCancel?: () => void
}

const money = (value: number) => value >= 1000 ? `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K` : `$${value.toLocaleString("en-US")}`
const date = (value: string | null, locale: string) => value ? new Date(value).toLocaleDateString(locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-AR") : "—"

export function SendStatusModal({ open, onOpenChange, techCompanyName, techCompanyId, techCompanyLogo, year, partners, inProcessPartners, onCancel }: SendStatusModalProps) {
  const { t } = useTranslations(STATUS_MODAL_TRANSLATIONS)
  const [recipients, setRecipients] = useState<{ email: string; first_name?: string; last_name?: string; group?: string }[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [additionalEmail, setAdditionalEmail] = useState("")
  const [recipientLoading, setRecipientLoading] = useState(false)
  const tx = (key: keyof typeof STATUS_MODAL_TRANSLATIONS) => t(key, key)
  const statusLabel = (status: string) => status === "status.onTrack" ? tx("status.onTrack") : status === "status.needsFocus" ? tx("status.needsFocus") : status
  const [note, setNote] = useState("")
  useEffect(() => { if (!open || !techCompanyId) return; setRecipientLoading(true); fetch(`/api/status-techcompany/recipients?techCompanyId=${encodeURIComponent(techCompanyId)}`).then((response) => response.json()).then((payload) => { const next = payload.recipients ?? []; setRecipients(next); setSelectedRecipients(next.map((item: { email: string }) => item.email)) }).finally(() => setRecipientLoading(false)) }, [open, techCompanyId])
  const { toast } = useToast()
  const totals = useMemo(() => partners.reduce((acc, partner) => ({ target: acc.target + partner.target, won: acc.won + partner.won, pipeline: acc.pipeline + partner.pipeline }), { target: 0, won: 0, pipeline: 0 }), [partners])
  const expected = totals.won + totals.pipeline
  const coverage = totals.target ? Math.round((totals.won / totals.target) * 100) : 0
  const expectedPercent = totals.target ? Math.round((expected / totals.target) * 100) : 0
  const remaining = Math.max(0, totals.target - expected)
  const opportunities = partners.flatMap((partner) => partner.hotOpportunities.map((opportunity) => ({ ...opportunity, partner: partner.name }))).sort((a, b) => { if (!a.closeDate) return 1; if (!b.closeDate) return -1; return new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime() }).slice(0, 5)
  const impacts = partners.flatMap((partner) => partner.impacts.map((impact) => ({ ...impact, partner: partner.name })))

  const sendEmail = async () => {
    const extra = additionalEmail.trim().toLowerCase()
    const emailRecipients = [...new Set([...selectedRecipients, ...(extra ? [extra] : [])])]
    if (!emailRecipients.length) { toast({ title: "Select recipients", variant: "destructive" }); return }
    const reportDate = new Date().toLocaleDateString("en-US")
    const scaleUpLogo = `${window.location.origin}/images/scaleup-logo-color.png`
    const companyLogo = techCompanyLogo || `${window.location.origin}/placeholder-logo.svg`
    const progressRow = (label: string, value: number, suffix: string, color: string) => `<div style="margin:16px 0"><div style="display:flex;justify-content:space-between;font-size:14px"><span>${label}</span><span style="color:#667085">${money(value)} (${suffix})</span></div><div style="height:8px;background:#e5e7eb;border-radius:99px;margin-top:6px"><div style="height:8px;background:${color};border-radius:99px;width:${totals.target ? Math.min(100, value / totals.target * 100) : 0}%"></div></div></div>`
    const partnerRows = partners.map((partner) => `<tr><td>${partner.name}</td><td>${partner.countryName ?? "—"}</td><td>${statusLabel(partner.status)}</td><td style="text-align:right">${money(partner.target)}</td><td style="text-align:right">${money(partner.won)}</td><td style="text-align:right">${money(partner.pipeline)}</td></tr>`).join("")
    const opportunityRows = opportunities.map((opportunity) => `<tr><td>${opportunity.title}</td><td>${opportunity.partner}</td><td>${opportunity.customerName}</td><td style="text-align:right">${money(opportunity.amount)}</td><td style="text-align:right">${opportunity.probability}%</td><td>${date(opportunity.closeDate, "en")}</td></tr>`).join("")
    const impactRows = impacts.length ? impacts.map((impact) => `<div style="border-bottom:1px solid #f1d6a8;padding:12px 0"><strong>${impact.title}</strong><p style="margin:6px 0;font-size:14px">${impact.partner}${impact.scope ? ` · ${impact.scope}` : ""}${impact.severity ? ` · ${impact.severity}` : ""}</p>${impact.description ? `<p style="margin:6px 0;font-size:14px">${impact.description}</p>` : ""}<p style="margin:6px 0;font-size:14px"><strong>${tx("send.financialImpact")}:</strong> ${money(impact.amount)}</p><p style="margin:6px 0;font-size:14px"><strong>${tx("send.requiredAction")}:</strong> ${tx("send.requiresFollowUp")}</p></div>`).join("") : `<p>${tx("send.noRisks")}</p>`
    const expansionRows = inProcessPartners.filter((partner) => partner.probability > 40).map((partner) => `<tr><td>${partner.name}</td><td>${partner.country}</td><td style="text-align:right">${partner.probability}%</td><td>${date(partner.closeDate, "en")}</td></tr>`).join("")
    const html = `<div style="background:#f3f4f6;padding:28px 12px;font-family:Arial,sans-serif;color:#172033"><article style="max-width:820px;margin:0 auto;background:#fff;border:1px solid #dbe2ea;padding:44px;box-sizing:border-box"><header style="display:flex;align-items:center;gap:18px;border-bottom:1px solid #dbe2ea;padding-bottom:20px"><img src="${scaleUpLogo}" alt="ScaleUp" style="height:38px;width:auto" /><span style="font-size:24px;color:#98a2b3">×</span><img src="${companyLogo}" alt="${techCompanyName}" style="height:38px;width:38px;object-fit:contain" /><div><h1 style="margin:0;font-size:22px">Weekly Status - ${techCompanyName} - W37 - ${year}</h1><p style="margin:7px 0 0;color:#667085;font-size:13px">${tx("send.generated")}: ${reportDate} (${tx("send.snapshot")}) · ${tx("send.state")}: ${tx("send.onTrack")} (${coverage}% ${tx("send.annualCoverage")})</p></div></header>${note ? `<div style="margin-top:24px;padding:14px 16px;background:#fffbea;border:1px solid #f2d675;border-radius:6px;font-size:14px">${note}</div>` : ""}<section style="padding:26px 0;border-bottom:1px solid #dbe2ea"><h2 style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#667085">1. ${tx("send.forecast")}</h2>${progressRow(tx("send.annualTarget"), totals.target, `100% ${tx("send.goal")}`, "#98a2b3")}${progressRow(tx("send.wonYtd"), totals.won, `${coverage}% ${tx("send.coverage")}`, "#10b981")}${progressRow(tx("send.weighted90"), totals.pipeline, `${totals.target ? Math.round(totals.pipeline / totals.target * 100) : 0}% ${tx("send.additional")}`, "#3b82f6")}<div style="padding:14px;background:#f8fafc;border:1px solid #dbe2ea;border-radius:6px;font-weight:bold;font-size:14px">${tx("send.expectedTotal")}: ${money(expected)} / ${money(totals.target)} (${expectedPercent}% ${tx("send.coverage")}) · ${tx("send.remainingGap")}: ${money(remaining)}</div></section><section style="padding:26px 0;border-bottom:1px solid #dbe2ea"><h2 style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#667085">2. ${tx("send.partners")}</h2><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="text-align:left">${tx("send.partner")}</th><th style="text-align:left">${tx("send.country")}</th><th style="text-align:left">${tx("send.status")}</th><th style="text-align:right">Forecast</th><th style="text-align:right">Won</th><th style="text-align:right">Pipeline</th></tr></thead><tbody>${partnerRows}</tbody></table></section><section style="padding:26px 0;border-bottom:1px solid #dbe2ea"><h2 style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#667085">3. ${tx("send.hot")} (Next 90 Days)</h2><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="text-align:left">${tx("send.clientDeal")}</th><th style="text-align:left">${tx("send.partner")}</th><th style="text-align:left">Client</th><th style="text-align:right">${tx("send.amount")}</th><th style="text-align:right">${tx("send.probability")}</th><th style="text-align:left">${tx("send.estimatedClose")}</th></tr></thead><tbody>${opportunityRows}</tbody></table></section><section style="padding:26px 0;border-bottom:1px solid #dbe2ea"><h2 style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#667085">4. ${tx("send.criticalActions")}</h2><div style="background:#fff8eb;border:1px solid #f2d675;border-radius:6px;padding:14px">${impactRows}</div></section><section style="padding:26px 0"><h2 style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#667085">5. ${tx("send.expansion")}</h2><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="text-align:left">${tx("send.partner")}</th><th style="text-align:left">${tx("send.country")}</th><th style="text-align:right">${tx("send.probability")}</th><th style="text-align:left">${tx("send.onboardingDate")}</th></tr></thead><tbody>${expansionRows || `<tr><td colspan="4">${tx("send.noDate")}</td></tr>`}</tbody></table></section></article></div>`
    const response = await fetch("/api/status-techcompany/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipients: emailRecipients, subject: `Weekly Status - ${techCompanyName} - ${year}`, html, techCompanyId, year }) })
    const payload = await response.json()
    if (!response.ok) { toast({ title: "Email failed", description: payload.error, variant: "destructive" }); return }
    toast({ title: tx("send.sent"), description: tx("send.emailDescription") })
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto bg-zinc-100 p-0"><DialogHeader className="border-b bg-zinc-100 px-6 pb-4 pt-5"><DialogTitle>{tx("send.title")}</DialogTitle></DialogHeader><article className="bg-white text-zinc-900 p-8 sm:p-12 mx-auto max-w-3xl shadow-md border my-6 space-y-6 print:shadow-none print:border-none print:m-0 print:w-full"><header><h1 className="text-2xl font-bold">Weekly Status - {techCompanyName} - W37 - {year}</h1><p className="text-sm text-zinc-500">{tx("send.generated")}: {new Date().toLocaleDateString("en-US")} ({tx("send.snapshot")}) | {tx("send.state")}: {tx("send.onTrack")} ({coverage}% {tx("send.annualCoverage")})</p></header><Separator className="my-4" /><section><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">1. {tx("send.forecast")} ({tx("send.annualTarget")}: {money(totals.target)})</h2><div className="space-y-3"><ProgressRow label={tx("send.annualTarget")} value={totals.target} total={totals.target} suffix={`100% ${tx("send.goal")}`} color="bg-zinc-400" /><ProgressRow label={tx("send.wonYtd")} value={totals.won} total={totals.target} suffix={`${coverage}% ${tx("send.coverage")}`} color="bg-emerald-500" /><ProgressRow label={tx("send.weighted90")} value={totals.pipeline} total={totals.target} suffix={`${totals.target ? Math.round(totals.pipeline / totals.target * 100) : 0}% ${tx("send.additional")}`} color="bg-blue-500" /></div><div className="mt-4 rounded-md border bg-zinc-50 p-4"><div className="flex flex-wrap justify-between gap-2 text-sm font-semibold"><span>{tx("send.expectedTotal")}: {money(expected)} / {money(totals.target)} ({expectedPercent}% {tx("send.coverage")})</span><span>{tx("send.remainingGap")}: {money(remaining)}</span></div><div className="mt-3 flex h-3 overflow-hidden rounded-full bg-zinc-200"><div className="bg-emerald-500" style={{ width: `${totals.target ? totals.won / totals.target * 100 : 0}%` }} /><div className="bg-blue-500" style={{ width: `${totals.target ? totals.pipeline / totals.target * 100 : 0}%` }} /></div></div><p className="mt-3 text-xs text-zinc-500">{tx("send.weeklyCash")}: $0.0K | {tx("send.newDeals")}: +$12.0K | {tx("send.activePipeline")}: {money(totals.pipeline)}</p></section><Separator className="my-6" /><section><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">2. {tx("send.partners")}</h2><table className="w-full border-collapse text-sm"><thead><tr className="border-b text-left text-xs text-zinc-500"><th className="p-2">Partner</th><th className="p-2">{tx("send.country")}</th><th className="p-2">{tx("send.forecastQ")}</th><th className="p-2">{tx("send.status")}</th><th className="p-2">{tx("send.blockerRisk")}</th></tr></thead><tbody>{partners.map((partner) => <tr key={partner.name} className="border-b"><td className="p-2 font-medium">{partner.name}</td><td className="p-2">{partner.countryName ?? "—"}</td><td className="p-2">{money(partner.pipeline)}</td><td className="p-2"><Badge variant="outline">{statusLabel(partner.status)}</Badge></td><td className="p-2 text-zinc-500">{partner.pipeline > 0 ? tx("send.requiresFollowUp") : tx("send.noRisks")}</td></tr>)}</tbody></table></section><Separator className="my-6" /><section><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">3. {tx("send.hot")} (Next 90 Days)</h2><table className="w-full border-collapse text-sm"><thead><tr className="border-b text-left text-xs text-zinc-500"><th className="p-2">{tx("send.clientDeal")}</th><th className="p-2">{tx("send.partner")}</th><th className="p-2">{tx("send.amount")}</th><th className="p-2">{tx("send.probability")}</th><th className="p-2">{tx("send.estimatedClose")}</th></tr></thead><tbody>{opportunities.map((opportunity) => <tr key={`${opportunity.partner}-${opportunity.title}`} className="border-b"><td className="p-2 font-medium">{opportunity.customerName || opportunity.title}</td><td className="p-2">{opportunity.partner}</td><td className="p-2">{money(opportunity.amount)}</td><td className="p-2">{opportunity.probability}%</td><td className="p-2">{date(opportunity.closeDate, "en")}</td></tr>)}</tbody></table></section><Separator className="my-6" /><section><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">4. {tx("send.criticalActions")}</h2><div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-950">{impacts.length ? <div className="space-y-4">{impacts.map((impact, index) => <div key={`${impact.partner}-${impact.title}-${index}`} className="border-b border-amber-200 pb-3 last:border-0 last:pb-0"><p className="font-semibold">{impact.title}</p><p className="mt-1 text-sm">{impact.partner}{impact.scope ? ` · ${impact.scope}` : ""}{impact.severity ? ` · ${impact.severity}` : ""}</p>{impact.description && <p className="mt-1 text-sm">{impact.description}</p>}<p className="mt-1 text-sm font-medium">{tx("send.financialImpact")}: {money(impact.amount)}</p><p className="mt-1 text-sm">{tx("send.requiredAction")}: {tx("send.requiresFollowUp")}</p></div>)}</div> : <p className="font-semibold">{tx("send.noRisks")}</p>}</div></section><Separator className="my-6" /><section><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">5. {tx("send.expansion")}</h2><div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead className="bg-zinc-50 text-xs text-zinc-500"><tr><th className="p-2 text-left">{tx("send.partner")}</th><th className="p-2 text-left">{tx("send.country")}</th><th className="p-2 text-right">{tx("send.probability")}</th><th className="p-2 text-left">{tx("send.onboardingDate")}</th></tr></thead><tbody>{inProcessPartners.filter((partner) => partner.probability > 40).map((partner) => <tr key={partner.id} className="border-t"><td className="p-2 font-medium">{partner.name}</td><td className="p-2">{partner.country}</td><td className="p-2 text-right">{partner.probability}%</td><td className="p-2">{date(partner.closeDate, "en")}</td></tr>)}</tbody></table></div></section></article><footer className="border-t bg-zinc-100 p-4"><label htmlFor="status-note" className="sr-only">Notas de la reunión</label><section className="rounded-md border bg-zinc-50 p-4 print:hidden"><h2 className="text-sm font-semibold">Recipients</h2><p className="mt-1 text-xs text-zinc-500">Select TechCompany contacts/users and ScaleUp Admin or BDD users.</p><div className="mt-3 max-h-44 space-y-2 overflow-y-auto">{recipientLoading ? <p className="text-sm text-zinc-500">Loading recipients...</p> : recipients.map((recipient) => <label key={recipient.email} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedRecipients.includes(recipient.email)} onChange={() => setSelectedRecipients((current) => current.includes(recipient.email) ? current.filter((email) => email !== recipient.email) : [...current, recipient.email])} /> <span>{[recipient.first_name, recipient.last_name].filter(Boolean).join(" ") || recipient.email}</span><span className="text-xs text-zinc-500">{recipient.email} · {recipient.group}</span></label>)}</div><div className="mt-3 flex gap-2"><input value={additionalEmail} onChange={(event) => setAdditionalEmail(event.target.value)} placeholder="Additional email" type="email" className="min-w-0 flex-1 rounded-md border bg-white px-3 py-2 text-sm" /><Button type="button" variant="outline" onClick={() => { const email = additionalEmail.trim().toLowerCase(); if (email && !selectedRecipients.includes(email)) setSelectedRecipients((current) => [...current, email]); setAdditionalEmail("") }}>Add</Button></div></section><Textarea id="status-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder={tx("send.note")} className="mb-3 bg-white" /><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => { onCancel?.(); onOpenChange(false) }}>{tx("send.cancel")}</Button><Button variant="outline" onClick={() => window.print()}><Download className="mr-2 size-4" />{tx("send.download")}</Button><Button onClick={sendEmail}><Send className="mr-2 size-4" />{tx("send.email")}</Button></div></footer></DialogContent></Dialog>
}

function ProgressRow({ label, value, total, suffix, color }: { label: string; value: number; total: number; suffix: string; color: string }) {
  const percent = total ? Math.min(100, (value / total) * 100) : 0
  return <div><div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="text-zinc-500">{money(value)} ({suffix})</span></div><div className="h-2 rounded-full bg-zinc-200"><div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} /></div></div>
}

export default SendStatusModal
