"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, BarChart3, Building2, CalendarDays, CheckCircle2, Plus, ShieldAlert, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const techCompanies = ["GrowDirector", "Formagro", "Acme Cloud"]
const partners = ["Partner Norte", "Partner Centro", "Partner Sur"]
const pipeline = [
  { label: "Descubrimiento", range: "0–30%", count: 8, amount: "$42,000", tone: "bg-muted" },
  { label: "Fit validado & propuesta", range: "31–75%", count: 5, amount: "$78,500", tone: "bg-primary/10" },
  { label: "Fase cierre", range: "76–100%", count: 3, amount: "$64,000", tone: "bg-primary text-primary-foreground" },
]

export function StatusTechCompanyPage() {
  const [techCompany, setTechCompany] = useState(techCompanies[0])
  const [year, setYear] = useState("2026")
  const [quarter, setQuarter] = useState("all")
  const [selectedPartners, setSelectedPartners] = useState<string[]>(partners)
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  const togglePartner = (partner: string) => setSelectedPartners((current) => current.includes(partner) ? current.filter((item) => item !== partner) : [...current, partner])
  const selectedLabel = useMemo(() => selectedPartners.length === partners.length ? "Todos los Partners" : `${selectedPartners.length} Partners seleccionados`, [selectedPartners])

  return <main className="flex flex-col gap-6 p-6 lg:p-8">
    <header className="flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-3"><div><p className="text-sm font-medium text-muted-foreground">Review ejecutivo de alianza</p><h1 className="text-3xl font-semibold tracking-tight">Status TechCompany</h1><p className="mt-1 text-sm text-muted-foreground">Revisá la salud de la alianza sin micromanagement.</p></div><div className="flex flex-wrap items-center gap-2"><Select value={techCompany} onValueChange={setTechCompany}><SelectTrigger className="w-[210px]"><Building2 className="mr-2 size-4" /><SelectValue /></SelectTrigger><SelectContent>{techCompanies.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><Select value={year} onValueChange={setYear}><SelectTrigger className="w-[105px]"><SelectValue /></SelectTrigger><SelectContent>{["2026", "2027", "2028"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><Select value={quarter} onValueChange={setQuarter}><SelectTrigger className="w-[125px]"><SelectValue placeholder="Período" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{["Q1", "Q2", "Q3", "Q4"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></div>
      <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="mr-2 size-4" />Registrar factor de impacto</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Registrar factor de impacto</DialogTitle></DialogHeader><div className="flex flex-col gap-4"><div className="grid gap-2"><Label>Categoría</Label><Select><SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger><SelectContent>{["Falla técnica", "Pérdida de confianza", "Precios", "Soporte Vendor", "Mercado", "Otro"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label>Severidad</Label><Select><SelectTrigger><SelectValue placeholder="Seleccionar severidad" /></SelectTrigger><SelectContent>{["Baja", "Media", "Alta", "Crítica"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label>Título</Label><Input placeholder="Ej. Falla en API demo piloto" /></div><div className="grid gap-2"><Label>Descripción y acuerdos</Label><Textarea placeholder="Registrá el contexto y próximos pasos..." /></div><div className="grid gap-2"><Label>Impacto estimado (USD)</Label><Input type="number" min="0" placeholder="0" /></div><Button onClick={() => { setSaved(true); setOpen(false) }}>Guardar factor</Button></div></DialogContent></Dialog>
    </header>

    {saved && <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm"><CheckCircle2 className="size-4 text-primary" />Factor preparado para guardar en la bitácora de la alianza.</div>}
    <div className="flex flex-wrap gap-2"><span className="flex items-center gap-2 text-sm font-medium"><Users className="size-4" />Foco por Partner:</span>{partners.map((partner) => <Button key={partner} size="sm" variant={selectedPartners.includes(partner) ? "default" : "outline"} onClick={() => togglePartner(partner)}>{partner}</Button>)}<Badge variant="secondary">{selectedLabel}</Badge></div>

    <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"><Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="size-5" />Cumplimiento de Forecast <span className="text-sm font-normal text-muted-foreground">({year} · {quarter === "all" ? "Todos los trimestres" : quarter})</span></CardTitle></CardHeader><CardContent className="flex flex-col gap-5"><div className="grid gap-4 sm:grid-cols-3"><div><p className="text-sm text-muted-foreground">Target acordado</p><p className="text-2xl font-semibold">$184,500</p></div><div><p className="text-sm text-muted-foreground">Pipeline ponderado</p><p className="text-2xl font-semibold">$132,800</p></div><div><p className="text-sm text-muted-foreground">Ganado (Won)</p><p className="text-2xl font-semibold">$76,200</p></div></div><Progress value={72} /><div className="flex justify-between text-xs text-muted-foreground"><span>Won 41%</span><span>Pipeline 72%</span><span>Target 100%</span></div></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="size-5" />Bitácora de impacto</CardTitle></CardHeader><CardContent className="flex flex-col gap-3"><div className="rounded-lg border-l-4 border-destructive bg-muted/40 p-3"><div className="flex items-center justify-between gap-3"><p className="font-medium">Falla en API demo piloto</p><Badge variant="destructive">Alta</Badge></div><p className="mt-1 text-sm text-muted-foreground">Bloqueó la validación técnica del Partner Norte.</p><p className="mt-2 text-xs font-medium">Impacto estimado: $18,000</p></div><div className="rounded-lg border-l-4 border-amber-500 bg-muted/40 p-3"><div className="flex items-center justify-between gap-3"><p className="font-medium">Cambio en lista de precios</p><Badge variant="secondary">Media</Badge></div><p className="mt-1 text-sm text-muted-foreground">Requiere actualizar materiales comerciales.</p><p className="mt-2 text-xs font-medium">Impacto estimado: $7,500</p></div></CardContent></Card></section>

    <section className="grid gap-4 md:grid-cols-3">{pipeline.map((item) => <Card key={item.label} className={item.tone}><CardHeader><CardTitle className="text-base">{item.label}</CardTitle><p className="text-xs opacity-75">Checklist {item.range}</p></CardHeader><CardContent><p className="text-3xl font-semibold">{item.amount}</p><p className="mt-1 text-sm opacity-75">{item.count} oportunidades</p><div className="mt-4"><Progress value={item.count * 10 + 10} /></div></CardContent></Card>)}</section>

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="size-5" />Expansión de la red</CardTitle><p className="text-sm text-muted-foreground">Partners potenciales en onboarding para {techCompany}.</p></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-3">{["Partner Andino", "Partner Delta", "Partner Río"].map((partner, index) => <div key={partner} className="rounded-lg border p-4"><div className="flex items-center justify-between"><p className="font-medium">{partner}</p><Badge variant="outline">{[42, 68, 84][index]}%</Badge></div><Progress className="mt-3" value={[42, 68, 84][index]} /><p className="mt-3 text-sm text-muted-foreground">{["Validación de Fit", "Certificación Técnica", "Firma de Acuerdo"][index]}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="size-3" />Activación estimada: Q{index + 2} {year}</p></div>)}</div></CardContent></Card>
  </main>
}
