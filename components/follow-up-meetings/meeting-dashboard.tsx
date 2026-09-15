"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "@/hooks/use-translations"
import { CheckCircle2, AlertCircle, Clock, TrendingUp, BarChart3, CalendarClock, Gauge, Trophy } from "lucide-react"
import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

type MeetingDashboardProps = {
  opportunities: any[]
  isLoading: boolean
  blank?: boolean
}

export function MeetingDashboard({ opportunities, isLoading, blank = false }: MeetingDashboardProps) {
  const { t } = useTranslations()
  const [rankingMetric, setRankingMetric] = useState("closed")

  if (blank) {
    const money = (value: number) => `$${(value / 1000).toFixed(1)}K`
    const amount = (opportunity: any) => Number(opportunity.amount ?? opportunity.value ?? opportunity.deal_value ?? 0)
    const won = opportunities.filter((opportunity) => ["won", "closed_won", "closed won"].includes(String(opportunity.stage ?? opportunity.status ?? "").toLowerCase())).reduce((sum, opportunity) => sum + amount(opportunity), 0)
    const target = Math.max(won * 2.8, 15000)
    const weighted = opportunities.reduce((sum, opportunity) => sum + amount(opportunity) * (Number(opportunity.probability ?? 50) / 100), 0)
    const gap = Math.max(0, target - won - weighted)
    const quarters = [
      { label: "Q1", won: target * 0.2, target: target * 0.2, status: "Done" },
      { label: "Q2", won: target * 0.16, target: target * 0.267, status: "Closed" },
      { label: "Q3", won: 0, weighted: weighted * 0.55, target: target * 0.267, status: "In progress" },
      { label: "Q4", won: 0, weighted: weighted * 0.45, target: target * 0.267, status: "In progress" },
    ]
    const hygiene = [
      { icon: CalendarClock, label: "Without close date", value: opportunities.filter((opportunity) => !opportunity.close_date && !opportunity.closeDate).length, detail: "Deals need an estimated close date" },
      { icon: Gauge, label: "Low probability (<50%)", value: opportunities.filter((opportunity) => Number(opportunity.probability ?? 0) < 50).length, detail: "Deals still in early stage" },
      { icon: Clock, label: "Stalled (>90 days)", value: opportunities.filter((opportunity) => opportunity.updated_at && Date.now() - new Date(opportunity.updated_at).getTime() > 90 * 86400000).length, detail: "Deals without recent movement" },
    ]
    const rankingLabels: Record<string, string> = { closed: "Closed amount", target: "Target attainment", deals: "Deal count", speed: "Close speed" }
    const currentPosition = 4
    return (
      <Card className="mx-auto min-h-[560px] w-full overflow-hidden border-2 border-primary/20 shadow-sm md:w-3/5">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100 pb-3">
          <div className="flex items-start justify-between gap-3"><div><CardTitle className="text-xl font-bold text-gray-900">Partner account <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">Needs focus</span></CardTitle><p className="mt-1 text-xs text-gray-500">Annual vision 2026 & quarterly breakdown (Q1–Q4)</p></div><BarChart3 className="h-5 w-5 text-indigo-500" /></div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 text-xs">
          <section><div className="mb-2 flex items-center justify-between font-semibold text-gray-700"><span>Annual performance matrix</span><span className="text-gray-500">Target {money(target)}</span></div><div className="mb-2 flex h-3 overflow-hidden rounded-full bg-gray-200"><div className="bg-emerald-500" style={{ width: `${Math.min(100, won / target * 100)}%` }} /><div className="bg-blue-500" style={{ width: `${Math.min(100 - won / target * 100, weighted / target * 100)}%` }} /><div className="flex-1 bg-gray-200" /></div><div className="flex justify-between text-gray-500"><span>Won {money(won)}</span><span>Weighted {money(weighted)}</span><span>Gap {money(gap)}</span></div></section>
          </section>
          <div className="grid grid-cols-4 gap-2">{quarters.map((quarter) => <div key={quarter.label} className="rounded-md border bg-white p-2"><div className="font-semibold text-gray-800">{quarter.label}</div><div className="mt-1 text-gray-500">{money(quarter.won ?? 0)} / {money(quarter.target)}</div><Progress value={Math.min(100, ((quarter.won ?? 0) + (quarter.weighted ?? 0)) / quarter.target * 100)} className="mt-2 h-1.5" indicatorClassName="bg-blue-500" /><div className="mt-1 text-[10px] text-gray-500">{quarter.status}</div></div>)}</div>
          <section><div className="mb-2 flex items-center gap-1 font-semibold text-gray-700"><AlertCircle className="h-3.5 w-3.5 text-amber-500" />Pipeline hygiene</div><div className="mb-3 rounded-xl border border-primary/15 bg-gradient-to-br from-card via-card to-primary/[0.04] p-3 shadow-sm"><div className="mb-3 flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-primary/75">Open opportunities</p><p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">24 <span className="text-xs font-normal text-gray-500">in pipeline</span></p></div><p className="rounded-full bg-primary/[0.08] px-2 py-1 text-[10px] font-medium text-primary">Opportunity probability</p></div><div className="flex flex-col gap-1.5 border-b border-border/70 pb-3">{[{ label: "0–25%", count: 8, amount: "$12.4K", tone: "bg-slate-400" }, { label: "26–50%", count: 6, amount: "$18.2K", tone: "bg-amber-500" }, { label: "51–75%", count: 6, amount: "$24.8K", tone: "bg-blue-500" }, { label: "76–100%", count: 4, amount: "$18.4K", tone: "bg-emerald-500" }].map((bucket) => <div key={bucket.label} className="flex items-center gap-2"><span className={`flex h-6 w-14 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white ${bucket.tone}`}>{bucket.label}</span><div className="relative h-7 flex-1 overflow-hidden rounded-r-lg bg-muted/50"><div className={`absolute inset-y-0 left-0 ${bucket.tone}`} style={{ width: `${bucket.count / 24 * 100}%` }} /><div className="relative z-10 flex h-full items-center justify-between px-2 text-[10px] font-semibold text-white"><span>{bucket.count} opportunities</span><span>{bucket.amount}</span></div></div></div>)}</div><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-xl border border-primary/10 bg-gradient-to-br from-primary/[0.05] to-card p-2 text-center"><p className="text-[10px] text-gray-500">Closing next 30 days</p><p className="mt-1 text-lg font-semibold text-gray-900">$18.4K</p><p className="text-[10px] text-gray-500">Weighted amount</p></div><div className="rounded-xl border border-sky-200/70 bg-gradient-to-br from-sky-50/80 to-card p-2 text-center"><p className="text-[10px] font-medium text-sky-700">Closing next 90 days</p><p className="mt-1 text-lg font-semibold text-gray-900">$42.7K</p><p className="text-[10px] text-gray-500">Weighted amount</p></div></div></div><div className="grid grid-cols-3 gap-2">{hygiene.map(({ icon: Icon, label, value, detail }) => <div key={label} className="rounded-md border border-amber-100 bg-amber-50/70 p-2"><Icon className="h-4 w-4 text-amber-600" /><div className="mt-1 font-semibold text-gray-800">{value} {label}</div><p className="mt-0.5 text-[10px] text-gray-500">{detail}</p></div>)}</div></section>
          <section><div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-1 font-semibold text-gray-700"><Trophy className="h-3.5 w-3.5 text-indigo-500" />Network benchmark</div><span className="text-[10px] text-gray-500">Position #{currentPosition} of 10</span></div><div className="mb-2 flex flex-wrap gap-1">{Object.entries(rankingLabels).map(([key, label]) => <button key={key} type="button" onClick={() => setRankingMetric(key)} className={`rounded border px-2 py-1 text-[10px] ${rankingMetric === key ? "border-primary bg-primary/10 font-semibold text-primary" : "bg-white text-gray-500"}`}>{label}</button>)}</div><div className="overflow-hidden rounded-md border"><div className="grid grid-cols-[1fr_auto] bg-gray-50 px-2 py-1 font-semibold"><span>{rankingLabels[rankingMetric]}</span><span>Score</span></div>{["Partner Alpha", "Partner Beta", "Partner account", "Partner Delta", "Partner Epsilon"].map((name, index) => <div key={name} className={`grid grid-cols-[1fr_auto] px-2 py-1 ${name === "Partner account" ? "bg-primary/10 font-bold" : ""}`}><span className={name === "Partner account" ? "" : "blur-[3px] select-none pointer-events-none"}>{name}</span><span>{index === 2 ? "Current" : `${5 - index}/10`}</span></div>)}</div></section>
        </CardContent>
      </Card>
    )
  }

  // Contar oportunidades con cambios recientes (última semana)
  const countRecentChanges = () => {
    if (!opportunities || opportunities.length === 0) return 0

    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)

    return opportunities.filter((opp) => {
      if (!opp.updated_at) return false
      return new Date(opp.updated_at) > lastWeek
    }).length
  }

  // Contar oportunidades por estado de validación
  const countByValidationStatus = () => {
    if (!opportunities || opportunities.length === 0) {
      return { validated: 0, pending: 0 }
    }

    return opportunities.reduce(
      (acc, opp) => {
        if (opp.validation_status === "validated") {
          acc.validated += 1
        } else {
          acc.pending += 1
        }
        return acc
      },
      { validated: 0, pending: 0 },
    )
  }

  const recentChangesCount = countRecentChanges()
  const noChangesCount = opportunities.length - recentChangesCount
  const { validated, pending } = countByValidationStatus()

  // Calcular porcentajes para las barras de progreso
  const recentChangesPercentage =
    opportunities.length > 0 ? Math.round((recentChangesCount / opportunities.length) * 100) : 0

  const validatedPercentage = opportunities.length > 0 ? Math.round((validated / opportunities.length) * 100) : 0

  if (isLoading) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-gray-800">
            {t("follow_up_meeting.dashboard.title", "Dashboard")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200 shadow-sm overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-gray-100">
        <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-500" />
          {t("follow_up_meeting.dashboard.title", "Dashboard")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total de oportunidades */}
          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="p-4 flex flex-col items-center justify-center h-28">
              <div className="w-full flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-600">
                  {t("follow_up_meeting.dashboard.total", "Total de Oportunidades")}
                </p>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-blue-600 self-start">{opportunities.length}</p>
            </CardContent>
          </Card>

          {/* Oportunidades con cambios recientes */}
          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="p-4 flex flex-col h-28">
              <div className="w-full flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-600">
                    {t("follow_up_meeting.dashboard.with_changes", "Con Cambios Recientes")}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-3xl font-bold text-green-600">{recentChangesCount}</p>
                <p className="text-sm font-medium text-gray-500">{recentChangesPercentage}%</p>
              </div>
              <Progress
                value={recentChangesPercentage}
                className="h-1.5 bg-gray-100"
                indicatorClassName="bg-green-500"
              />
            </CardContent>
          </Card>

          {/* Oportunidades sin cambios */}
          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="p-4 flex flex-col h-28">
              <div className="w-full flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-600">
                    {t("follow_up_meeting.dashboard.without_changes", "Sin Cambios Recientes")}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-3xl font-bold text-amber-600">{noChangesCount}</p>
                <p className="text-sm font-medium text-gray-500">
                  {opportunities.length > 0 ? Math.round((noChangesCount / opportunities.length) * 100) : 0}%
                </p>
              </div>
              <Progress
                value={opportunities.length > 0 ? Math.round((noChangesCount / opportunities.length) * 100) : 0}
                className="h-1.5 bg-gray-100"
                indicatorClassName="bg-amber-500"
              />
            </CardContent>
          </Card>

          {/* Oportunidades por estado de validación */}
          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="p-4 flex flex-col h-28">
              <div className="w-full flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-600">
                  {t("follow_up_meeting.dashboard.validation_status", "Estado de Validación")}
                </p>
                <div className="flex gap-1">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-gray-600">{t("follow_up_meeting.dashboard.validated", "Validadas")}</p>
                </div>
                <p className="text-sm font-medium">
                  {validated} <span className="text-gray-500 text-xs">({validatedPercentage}%)</span>
                </p>
              </div>
              <Progress
                value={validatedPercentage}
                className="h-1.5 mb-2 bg-gray-100"
                indicatorClassName="bg-green-500"
              />

              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-gray-600">{t("follow_up_meeting.dashboard.pending", "Pendientes")}</p>
                </div>
                <p className="text-sm font-medium">
                  {pending} <span className="text-gray-500 text-xs">({100 - validatedPercentage}%)</span>
                </p>
              </div>
              <Progress
                value={100 - validatedPercentage}
                className="h-1.5 bg-gray-100"
                indicatorClassName="bg-amber-500"
              />
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}

export default MeetingDashboard
