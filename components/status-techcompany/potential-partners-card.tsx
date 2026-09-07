"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MapPin } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps"

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
const countryCoordinates: Record<string, [number, number]> = { Argentina: [-64, -34], Bolivia: [-64, -17], Brasil: [-51, -10], Brazil: [-51, -10], Chile: [-71, -33], Colombia: [-74, 4], Ecuador: [-78, -1], Paraguay: [-58, -23], Peru: [-75, -10], Uruguay: [-56, -33], Venezuela: [-66, 7], Mexico: [-102, 23], Panamá: [-80, 9], Panama: [-80, 9], "Costa Rica": [-84, 10], Guatemala: [-90, 15] }

type PotentialPartner = { id: string; name: string; country: string; probability: number; closeDate: string | null }
type CountryCount = { country: string; active: number; potential: number }

export function PotentialPartnersCard({ countryCounts, prospects }: { countryCounts: CountryCount[]; prospects: PotentialPartner[] }) {
  const [showBelow50, setShowBelow50] = useState(false)
  const visibleProspects = showBelow50 ? prospects : prospects.filter((prospect) => prospect.probability >= 50)
  return <Card className="overflow-hidden border-border shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="size-5 text-primary" />Partners potenciales</CardTitle><p className="text-sm text-muted-foreground">Cobertura actual y oportunidades de expansión en Latinoamérica.</p></CardHeader><CardContent className="grid gap-6 lg:grid-cols-[3fr_2fr]"><div className="rounded-xl border bg-muted/10 p-3"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-medium">Partners por país</p><div className="flex gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><span className="size-2 rounded-full bg-primary" />Activos</span><span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-500" />Potenciales</span></div></div><ComposableMap projection="geoMercator" projectionConfig={{ scale: 420, center: [-65, -12] }} className="h-auto w-full"><Geographies geography={geoUrl}>{({ geographies }) => geographies.map((geo) => <Geography key={geo.rsmKey} geography={geo} fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth={0.5} />)}</Geographies>{countryCounts.map((item) => { const coordinates = countryCoordinates[item.country]; if (!coordinates) return null; return <Marker key={item.country} coordinates={coordinates}><circle r={Math.max(4, Math.min(12, item.active * 2))} fill="hsl(var(--primary))" opacity={0.85} /><circle cy={Math.max(8, item.active * 2 + 5)} r={Math.max(3, Math.min(10, item.potential * 2))} fill="hsl(var(--warning, 38 92% 50%))" opacity={0.9} /><text textAnchor="middle" y={-10} className="fill-foreground text-[8px]">{item.country}</text></Marker> })}</ComposableMap><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">{countryCounts.map((item) => <span key={item.country}>{item.country}: {item.active} activos · {item.potential} potenciales</span>)}</div></div><div className="flex flex-col gap-3"><label htmlFor="show-below-50" className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground"><Checkbox id="show-below-50" checked={showBelow50} onCheckedChange={(checked) => setShowBelow50(checked === true)} />Mostrar menores de 50%</label><div><p className="text-sm font-medium">Pipeline de partners potenciales</p><p className="text-xs text-muted-foreground">Ordenados por probabilidad de avance.</p></div>{prospects.length ? visibleProspects.map((prospect) => <div key={prospect.id} className="rounded-xl border p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{prospect.name}</p><p className="mt-1 text-xs text-muted-foreground">{prospect.country}</p></div><Badge variant="secondary">{prospect.probability}%</Badge></div><Progress value={prospect.probability} className="mt-3 h-2" /><p className="mt-2 text-xs text-muted-foreground">{prospect.closeDate ? `Cierre estimado: ${new Date(prospect.closeDate).toLocaleDateString("es-AR")}` : "Sin fecha de cierre"}</p></div>) : <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No hay partners potenciales para mostrar.</div>}</div></CardContent></Card>
}

export type { CountryCount, PotentialPartner }
export { countryCoordinates }
