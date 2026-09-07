"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MapPin } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps"

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
const countryCoordinates: Record<string, [number, number]> = { Argentina: [-64, -34], Bolivia: [-64, -17], Brasil: [-51, -10], Brazil: [-51, -10], Chile: [-71, -33], Colombia: [-74, 4], Ecuador: [-78, -1], Paraguay: [-58, -23], Peru: [-75, -10], Uruguay: [-56, -33], Venezuela: [-66, 7], Mexico: [-102, 23], México: [-102, 23], Panamá: [-80, 9], Panama: [-80, 9], "Costa Rica": [-84, 10], Guatemala: [-90, 15] }

type PotentialPartner = { id: string; name: string; country: string; probability: number; closeDate: string | null }
type CountryCount = { country: string; active: number; potential: number; activeNames: string[]; potentialNames: string[] }

export function PotentialPartnersCard({ countryCounts, prospects }: { countryCounts: CountryCount[]; prospects: PotentialPartner[] }) {
  const [showBelow50, setShowBelow50] = useState(false)
  const visibleProspects = showBelow50 ? prospects : prospects.filter((prospect) => prospect.probability >= 50)
  return <Card className="relative z-10 overflow-hidden rounded-2xl border-primary/10 shadow-[0_10px_30px_-24px_hsl(var(--primary)/0.45)]"><CardHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/[0.04] to-accent/[0.35]"><CardTitle className="flex items-center gap-2"><MapPin className="size-5 text-primary" />Partners potenciales</CardTitle><p className="text-sm text-muted-foreground">Cobertura actual y oportunidades de expansión en Latinoamérica.</p></CardHeader><CardContent className="grid gap-6 lg:grid-cols-[3fr_2fr]"><div className="rounded-xl border border-primary/10 bg-gradient-to-br from-primary/[0.03] via-card to-accent/[0.35] p-3 shadow-inner"><div className="mb-3"><p className="text-sm font-medium">Partners por país</p></div><ComposableMap projection="geoMercator" projectionConfig={{ scale: 420, center: [-65, -12] }} className="h-auto w-full"><Geographies geography={geoUrl}>{({ geographies }) => geographies.map((geo) => <Geography key={geo.rsmKey} geography={geo} fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth={0.5} />)}</Geographies>{countryCounts.map((item) => { const coordinates = countryCoordinates[item.country]; if (!coordinates) return null; return <Marker key={item.country} coordinates={coordinates}>{item.active > 0 && <g><circle r={18} fill="hsl(221 83% 53%)" stroke="white" strokeWidth={2} /><text textAnchor="middle" dominantBaseline="central" className="fill-white text-[12px] font-semibold">{item.active}</text><title>{item.activeNames.join(", ")}</title></g>}{item.potential > 0 && <g transform="translate(0 30)"><circle r={18} fill="hsl(45 93% 47%)" stroke="white" strokeWidth={2} /><text textAnchor="middle" dominantBaseline="central" className="fill-foreground text-[12px] font-semibold">{item.potential}</text><title>{item.potentialNames.join(", ")}</title></g>}<text textAnchor="middle" y={-24} style={{ fontSize: 16, fontWeight: 700 }} className="fill-foreground">{item.country}</text></Marker> })}</ComposableMap></div><div className="flex flex-col gap-3"><label htmlFor="show-below-50" className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground"><Checkbox id="show-below-50" checked={showBelow50} onCheckedChange={(checked) => setShowBelow50(checked === true)} />Mostrar menores de 50%</label><div><p className="text-sm font-medium">Pipeline de partners potenciales</p><p className="text-xs text-muted-foreground">Ordenados por probabilidad de avance.</p></div>{prospects.length ? visibleProspects.map((prospect) => <div key={prospect.id} className="rounded-xl border p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{prospect.name}</p><p className="mt-1 text-xs text-muted-foreground">{prospect.country}</p></div><Badge variant="secondary">{prospect.probability}%</Badge></div><Progress value={prospect.probability} className="mt-3 h-2" /><p className="mt-2 text-xs text-muted-foreground">{prospect.closeDate ? `Cierre estimado: ${new Date(prospect.closeDate).toLocaleDateString("es-AR")}` : "Sin fecha de cierre"}</p></div>) : <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No hay partners potenciales para mostrar.</div>}</div></CardContent></Card>
}

export type { CountryCount, PotentialPartner }
export { countryCoordinates }
