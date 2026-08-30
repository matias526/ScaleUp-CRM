"use client"

import { useMemo, useState } from "react"
import { Lock, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

type Props = { open: boolean; onOpenChange: (open: boolean) => void; partnerId?: string; techCompanyId?: string; userId?: string; partnerName?: string; techCompanyName?: string; declaredRevenue?: number; year?: string }
type Quarter = "Q1" | "Q2" | "Q3" | "Q4"
const quarters: Quarter[] = ["Q1", "Q2", "Q3", "Q4"]

export function InternalForecastAdjustment({ open, onOpenChange, partnerId, techCompanyId, userId, partnerName = "Partner", techCompanyName = "TechCompany", declaredRevenue = 30000, year = "2026" }: Props) {
  const supabase = createClient()
  const [values, setValues] = useState<Record<Quarter, string>>({ Q1: "7500", Q2: "7500", Q3: "7500", Q4: "7500" })
  const [saving, setSaving] = useState(false)
  const [displayTarget, setDisplayTarget] = useState("scaleup_internal")
  const total = useMemo(() => quarters.reduce((sum, quarter) => sum + (Number(values[quarter]) || 0), 0), [values])
  const money = (value: number) => `$${value.toLocaleString("en-US")} USD`
  const save = async () => {
    if (!partnerId || !techCompanyId || !userId) { toast.error("Seleccioná Partner y TechCompany antes de guardar"); return }
    setSaving(true)
    const fieldByQuarter = { Q1: "scaleup_q1_revenue", Q2: "scaleup_q2_revenue", Q3: "scaleup_q3_revenue", Q4: "scaleup_q4_revenue" } as const
    const payload = quarters.map((quarter, index) => ({ partner_id: partnerId, tech_company_id: techCompanyId, period_year: Number(year), period_quarter: index + 1, scaleup_internal_target_revenue: total, display_target_type: displayTarget, internal_target_updated_by: userId, updated_at: new Date().toISOString(), [fieldByQuarter[quarter]]: Number(values[quarter]) || 0 }))
    const { error } = await (supabase.from("partner_tech_projections" as any) as any).upsert(payload, { onConflict: "partner_id,tech_company_id,period_year,period_quarter" })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success("Ajuste interno guardado correctamente")
    onOpenChange(false)
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-4xl"><DialogHeader><div className="flex flex-wrap gap-2"><Badge variant="secondary">Vista de Administración Interna</Badge><Badge variant="outline">Período: {year}</Badge><Badge variant="outline">Solo Admin / Acceso Restringido</Badge></div><DialogTitle className="pt-2">Ajuste Interno de Forecast</DialogTitle><DialogDescription>Configura la expectativa realista de ScaleUP para {partnerName} × {techCompanyName}.</DialogDescription></DialogHeader><div className="flex flex-col gap-6"><Card><CardHeader><CardTitle className="text-base">Forecast trimestral</CardTitle><CardDescription>El compromiso del Partner es informativo y no puede editarse. El administrador define el forecast interno de ScaleUP.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b text-left"><th className="px-3 py-3 font-medium">Concepto</th>{quarters.map((quarter) => <th key={quarter} className="px-3 py-3 font-medium">{quarter}</th>)}<th className="px-3 py-3 text-right font-medium">Total anual</th></tr></thead><tbody><tr className="border-b"><th className="px-3 py-4 text-left font-medium"><span className="flex items-center gap-2"><Lock data-icon="inline-start" />Compromiso Partner</span><span className="mt-1 block text-xs font-normal text-muted-foreground">Solo lectura</span></th>{quarters.map((quarter) => <td key={quarter} className="px-3 py-4 text-muted-foreground">{money(declaredRevenue / 4)}</td>)}<td className="px-3 py-4 text-right font-semibold text-foreground">{money(declaredRevenue)}</td></tr><tr><th className="px-3 py-4 text-left font-medium">Forecast interno ScaleUP<span className="mt-1 block text-xs font-normal text-muted-foreground">Editable por Admin</span></th>{quarters.map((quarter) => <td key={quarter} className="px-3 py-4"><div className="relative min-w-28"><span className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground">$</span><Input aria-label={`${quarter} Forecast interno ScaleUP`} className="pl-7 pr-10" inputMode="decimal" min="0" type="number" value={values[quarter]} onChange={(event) => setValues((current) => ({ ...current, [quarter]: event.target.value }))} /><span className="pointer-events-none absolute right-3 top-2.5 text-xs text-muted-foreground">USD</span></div></td>)}<td className="px-3 py-4 text-right text-lg font-semibold text-primary">{money(total)}</td></tr></tbody></table></div></CardContent></Card><Card className="border-primary/20 bg-primary/5"><CardHeader><CardTitle className="text-base">Target visible en reportes de TechCompany</CardTitle><CardDescription>Define qué valor verán por defecto los reportes externos.</CardDescription></CardHeader><CardContent><div className="flex flex-col gap-3"><label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-3"><input type="radio" name="display-target" value="scaleup_internal" checked={displayTarget === "scaleup_internal"} onChange={(event) => setDisplayTarget(event.target.value)} className="mt-1" /><span><span className="font-medium">Forecast realista ScaleUP</span><span className="block text-sm text-muted-foreground">{money(total)}</span></span></label><label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-3"><input type="radio" name="display-target" value="partner_target" checked={displayTarget === "partner_target"} onChange={(event) => setDisplayTarget(event.target.value)} className="mt-1" /><span><span className="font-medium">Compromiso original del Partner</span><span className="block text-sm text-muted-foreground">{money(declaredRevenue)}</span></span></label></div></CardContent></Card></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={save} disabled={saving}><Save data-icon="inline-start" />Guardar Ajuste</Button></DialogFooter></DialogContent></Dialog>
}
