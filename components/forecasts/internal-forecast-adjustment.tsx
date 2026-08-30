"use client"

import { useEffect, useMemo, useState } from "react"
import { Lock, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export interface QuarterlyProjection {
  id: string
  period_quarter: 1 | 2 | 3 | 4
  target_revenue_amount: number
  scaleup_internal_target_revenue: number
  display_target_type: "scaleup_internal" | "partner_target"
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projections: QuarterlyProjection[]
  year?: string
  partnerName?: string
  techCompanyName?: string
  onSave: (projections: QuarterlyProjection[]) => Promise<void> | void
}

const quarters = [1, 2, 3, 4] as const
const labels = ["Q1", "Q2", "Q3", "Q4"] as const

export function InternalForecastAdjustment({ open, onOpenChange, projections, year = "2026", partnerName = "Partner", techCompanyName = "TechCompany", onSave }: Props) {
  const [draft, setDraft] = useState<QuarterlyProjection[]>(projections)
  const [displayTarget, setDisplayTarget] = useState<QuarterlyProjection["display_target_type"]>("scaleup_internal")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setDraft(projections)
      setDisplayTarget(projections.find((item) => item.display_target_type)?.display_target_type ?? "scaleup_internal")
    }
  }, [open, projections])

  const rows = useMemo(() => quarters.map((quarter) => draft.find((item) => item.period_quarter === quarter) ?? {
    id: `new-${quarter}`,
    period_quarter: quarter,
    target_revenue_amount: 0,
    scaleup_internal_target_revenue: 0,
    display_target_type: displayTarget,
  }), [draft, displayTarget])
  const total = useMemo(() => rows.reduce((sum, row) => sum + row.scaleup_internal_target_revenue, 0), [rows])
  const money = (value: number) => `$${value.toLocaleString("en-US")} USD`
  const updateQuarter = (quarter: QuarterlyProjection["period_quarter"], value: string) => setDraft((current) => {
    const nextValue = Number(value.replace(/[^0-9.-]/g, "")) || 0
    const existing = current.find((row) => row.period_quarter === quarter)
    if (existing) return current.map((row) => row.period_quarter === quarter ? { ...row, scaleup_internal_target_revenue: nextValue, display_target_type: displayTarget } : row)
    return [...current, { id: `new-${quarter}`, period_quarter: quarter, target_revenue_amount: 0, scaleup_internal_target_revenue: nextValue, display_target_type: displayTarget }]
  })
  const save = async () => { setSaving(true); try { await onSave(draft.map((row) => ({ ...row, display_target_type: displayTarget }))); toast.success("Ajuste interno guardado correctamente"); onOpenChange(false) } catch { toast.error("No se pudo guardar el ajuste interno") } finally { setSaving(false) } }

  return <Dialog open={open} onOpenChange={(value) => { if (value) setDraft(projections); onOpenChange(value) }}><DialogContent className="max-w-4xl"><DialogHeader><div className="flex flex-wrap gap-2"><Badge variant="secondary">Vista de Administración Interna</Badge><Badge variant="outline">Período: {year}</Badge><Badge variant="outline">Solo Admin / Acceso Restringido</Badge></div><DialogTitle className="pt-2">Ajuste Interno de Forecast</DialogTitle><DialogDescription>Configura la expectativa realista de ScaleUP para {partnerName} × {techCompanyName}.</DialogDescription></DialogHeader><div className="flex flex-col gap-6"><Card><CardHeader><CardTitle className="text-base">Forecast trimestral</CardTitle><CardDescription>El compromiso del Partner es informativo y no puede editarse. El administrador define el forecast interno de ScaleUP.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b text-left"><th className="px-3 py-3 font-medium">Concepto</th>{labels.map((label) => <th key={label} className="px-3 py-3 font-medium">{label}</th>)}<th className="px-3 py-3 text-right font-medium">Total anual</th></tr></thead><tbody><tr className="border-b"><th className="px-3 py-4 text-left font-medium"><span className="flex items-center gap-2"><Lock data-icon="inline-start" />Compromiso Partner</span><span className="mt-1 block text-xs font-normal text-muted-foreground">Solo lectura</span></th>{rows.map((row) => <td key={row.period_quarter} className="px-3 py-4 text-muted-foreground">{money(row.target_revenue_amount)}</td>)}<td className="px-3 py-4 text-right font-semibold text-foreground">{money(rows.reduce((sum, row) => sum + row.target_revenue_amount, 0))}</td></tr><tr><th className="px-3 py-4 text-left font-medium">Forecast interno ScaleUP<span className="mt-1 block text-xs font-normal text-muted-foreground">Editable por Admin</span></th>{rows.map((row) => <td key={row.period_quarter} className="px-3 py-4"><Input aria-label={`Forecast interno Q${row.period_quarter}`} value={row.scaleup_internal_target_revenue} onChange={(event) => updateQuarter(row.period_quarter, event.target.value)} /></td>)}<td className="px-3 py-4 text-right text-lg font-semibold text-primary">{money(total)}</td></tr></tbody></table></div></CardContent></Card><Card><CardHeader><CardTitle className="text-base">¿Qué valor verá TechCompany?</CardTitle><CardDescription>Elegí qué target se mostrará externamente para este forecast.</CardDescription></CardHeader><CardContent><div className="flex flex-col gap-3"><label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-3"><input type="radio" name="display-target" value="scaleup_internal" checked={displayTarget === "scaleup_internal"} onChange={() => setDisplayTarget("scaleup_internal")} className="mt-1" /><span><span className="font-medium">Forecast interno ScaleUP</span><span className="mt-1 block text-sm text-muted-foreground">Mostrar la expectativa interna de ScaleUP.</span></span></label><label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-3"><input type="radio" name="display-target" value="partner_target" checked={displayTarget === "partner_target"} onChange={() => setDisplayTarget("partner_target")} className="mt-1" /><span><span className="font-medium">Compromiso original del Partner</span><span className="mt-1 block text-sm text-muted-foreground">Mantener visible el target declarado originalmente.</span></span></label></div></CardContent></Card></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={save} disabled={saving}><Save data-icon="inline-start" />{saving ? "Guardando..." : "Guardar Ajuste Interno"}</Button></DialogFooter></DialogContent></Dialog>
}
