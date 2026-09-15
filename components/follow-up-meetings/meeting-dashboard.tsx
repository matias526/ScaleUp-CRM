"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "@/hooks/use-translations"
import { CheckCircle2, AlertCircle, Clock, TrendingUp, BarChart3, CalendarClock, Gauge, Trophy, Filter } from "lucide-react"
import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

const MEETING_DASHBOARD_TRANSLATIONS = {
  "dashboard.partnerAccount": { es: "Cuenta del partner", en: "Partner account", pt: "Conta do partner" },
  "dashboard.needsFocus": { es: "Requiere foco", en: "Needs focus", pt: "Requer foco" },
  "dashboard.annualSubtitle": { es: "Visión anual 2026 y desglose trimestral (Q1–Q4)", en: "Annual vision 2026 & quarterly breakdown (Q1–Q4)", pt: "Visão anual 2026 e detalhamento trimestral (Q1–Q4)" },
  "dashboard.annualMatrix": { es: "Matriz de performance anual", en: "Annual performance matrix", pt: "Matriz de desempenho anual" },
  "dashboard.target": { es: "Objetivo", en: "Target", pt: "Meta" },
  "dashboard.won": { es: "Ganado", en: "Won", pt: "Ganho" },
  "dashboard.weighted": { es: "Ponderado", en: "Weighted", pt: "Ponderado" },
  "dashboard.gap": { es: "Brecha", en: "Gap", pt: "Diferença" },
  "dashboard.onTarget": { es: "En objetivo", en: "On target", pt: "Na meta" },
  "dashboard.inProgress": { es: "En progreso", en: "In progress", pt: "Em andamento" },
  "dashboard.noPipeline": { es: "Sin pipeline", en: "No pipeline", pt: "Sem pipeline" },
  "dashboard.quarter": { es: "Trimestre", en: "Quarter", pt: "Trimestre" },
  "dashboard.declared": { es: "Declaradas", en: "Declared", pt: "Declaradas" },
  "dashboard.proposal": { es: "Propuestas", en: "Proposal", pt: "Propostas" },
  "dashboard.amount": { es: "Monto", en: "Amount", pt: "Valor" },
  "dashboard.actual": { es: "Real", en: "Actual", pt: "Real" },
  "dashboard.openOpportunities": { es: "Oportunidades abiertas", en: "Open opportunities", pt: "Oportunidades abertas" },
  "dashboard.inPipeline": { es: "en pipeline", en: "in pipeline", pt: "no pipeline" },
  "dashboard.opportunityProbability": { es: "Probabilidad de oportunidad", en: "Opportunity probability", pt: "Probabilidade da oportunidade" },
  "dashboard.closing30": { es: "Cierre en próximos 30 días", en: "Closing next 30 days", pt: "Fechamento nos próximos 30 dias" },
  "dashboard.closing90": { es: "Cierre en próximos 90 días", en: "Closing next 90 days", pt: "Fechamento nos próximos 90 dias" },
  "dashboard.weightedAmount": { es: "Monto ponderado", en: "Weighted amount", pt: "Valor ponderado" },
  "dashboard.pipelineHygiene": { es: "Higiene del pipeline", en: "Pipeline hygiene", pt: "Higiene do pipeline" },
  "dashboard.withoutCloseDate": { es: "Sin fecha de cierre", en: "Without close date", pt: "Sem data de fechamento" },
  "dashboard.lowProbability": { es: "Baja probabilidad (<50%)", en: "Low probability (<50%)", pt: "Baixa probabilidade (<50%)" },
  "dashboard.stalled": { es: "Estancadas (>90 días)", en: "Stalled (>90 days)", pt: "Paradas (>90 dias)" },
  "dashboard.openPipelineValue": { es: "Valor del pipeline abierto", en: "Open pipeline value", pt: "Valor do pipeline aberto" },
  "dashboard.networkBenchmark": { es: "Comparativa de red", en: "Network benchmark", pt: "Comparativo da rede" },
  "dashboard.closedAmount": { es: "Monto cerrado", en: "Closed amount", pt: "Valor fechado" },
  "dashboard.targetAttainment": { es: "Cumplimiento del objetivo", en: "Target attainment", pt: "Atingimento da meta" },
  "dashboard.dealCount": { es: "Cantidad de negocios", en: "Deal count", pt: "Quantidade de negócios" },
  "dashboard.closeSpeed": { es: "Velocidad de cierre", en: "Close speed", pt: "Velocidade de fechamento" },
  "dashboard.score": { es: "Puntaje", en: "Score", pt: "Pontuação" },
  "dashboard.current": { es: "Actual", en: "Current", pt: "Atual" },
  "dashboard.noBenchmarkData": { es: "No hay datos de comparativa", en: "No benchmark data", pt: "Sem dados de comparação" },
} as const

type MeetingDashboardProps = {
  opportunities: any[]
  projections?: any[]
  isLoading: boolean
  blank?: boolean
  partnerName?: string
  benchmarkPartners?: any[]
}

export function MeetingDashboard({ opportunities, projections = [], isLoading, blank = false, partnerName = "", benchmarkPartners = [] }: MeetingDashboardProps) {
  const { t } = useTranslations(MEETING_DASHBOARD_TRANSLATIONS)
  const [rankingMetric, setRankingMetric] = useState("closed")

  if (blank) {
    const money = (value: number) => `$${(value / 1000).toFixed(1)}K`
    const normalizeStatus = (value: unknown) => String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_")
    const amount = (opportunity: any) => Number(opportunity.estimated_value ?? 0)
    const stage = (opportunity: any) => normalizeStatus(opportunity.pipeline_stage?.code ?? opportunity.validation_status)
    const closedStates = new Set(["closed", "closed_won", "closed_lost", "lost", "won", "freeze", "frozen"])
    const isWon = (opportunity: any) => Boolean(opportunity.purchase_order_id)
    const isOpen = (opportunity: any) => !isWon(opportunity) && !closedStates.has(stage(opportunity))
    const opportunityAmount = (opportunity: any) => Number(opportunity.estimated_value ?? opportunity.amount ?? opportunity.value ?? opportunity.deal_value ?? 0)
    const opportunityCloseDate = (opportunity: any) => opportunity.estimated_close_date ?? opportunity.close_date ?? opportunity.closeDate
    const currentYear = new Date().getFullYear()
    const closesInYear = (opportunity: any) => { const closeDate = opportunityCloseDate(opportunity); if (!closeDate) return false; const date = new Date(String(closeDate)); return !Number.isNaN(date.getTime()) && date.getFullYear() === currentYear }
    const openOpportunities = opportunities.filter((opportunity) => isOpen(opportunity) && closesInYear(opportunity))
    const won = opportunities.filter((opportunity) => isWon(opportunity) && closesInYear(opportunity)).reduce((sum, opportunity) => sum + amount(opportunity), 0)
    const quarterTarget = (quarter: number) => Number(projections.find((projection) => Number(projection.period_quarter) === quarter)?.target_revenue_amount ?? 0)
    const target = [1, 2, 3, 4].reduce((sum, quarter) => sum + quarterTarget(quarter), 0)
    const weighted = openOpportunities.reduce((sum, opportunity) => sum + amount(opportunity) * (Number(opportunity.probability ?? opportunity.win_probability ?? opportunity.pipeline_stage?.probability ?? 0) / 100), 0)
    const gap = Math.max(0, target - won - weighted)
    const now = new Date()
    const dueWithin = (days: number) => openOpportunities.filter((opportunity) => { const closeDate = opportunityCloseDate(opportunity); if (!closeDate) return false; const diff = (new Date(closeDate).getTime() - now.getTime()) / 86400000; return diff >= 0 && diff <= days })
    const closing30 = dueWithin(30)
    const closing90 = dueWithin(90)
    const weighted90 = closing90.reduce((sum, opportunity) => sum + opportunityAmount(opportunity) * (Number(opportunity.probability ?? opportunity.win_probability ?? 0) / 100), 0)
    const probabilityBuckets = [
      { label: "0–25%", min: 0, max: 25, tone: "bg-slate-400" },
      { label: "26–50%", min: 26, max: 50, tone: "bg-amber-500" },
      { label: "51–75%", min: 51, max: 75, tone: "bg-blue-500" },
      { label: "76–100%", min: 76, max: 100, tone: "bg-emerald-500" },
    ].map((bucket) => { const bucketOpportunities = openOpportunities.filter((opportunity) => { const probability = Number(opportunity.probability ?? opportunity.win_probability ?? 0); return probability >= bucket.min && probability <= bucket.max }); return { ...bucket, count: bucketOpportunities.length, amount: bucketOpportunities.reduce((sum, opportunity) => sum + opportunityAmount(opportunity), 0) } })
    const quarterWon = (quarter: number) => opportunities.filter((opportunity) => { const date = opportunityCloseDate(opportunity); return date && new Date(date).getFullYear() === currentYear && Math.floor(new Date(date).getMonth() / 3) + 1 === quarter && isWon(opportunity) }).reduce((sum, opportunity) => sum + amount(opportunity), 0)
    const quarterWeighted = (quarter: number) => opportunities.filter((opportunity) => { const date = opportunityCloseDate(opportunity); return date && new Date(date).getFullYear() === currentYear && Math.floor(new Date(date).getMonth() / 3) + 1 === quarter && isOpen(opportunity) }).reduce((sum, opportunity) => sum + amount(opportunity) * (Number(opportunity.probability ?? opportunity.pipeline_stage?.probability ?? 0) / 100), 0)
    const inQuarter = (dateValue: unknown, quarter: number) => { if (!dateValue) return false; const date = new Date(String(dateValue)); return !Number.isNaN(date.getTime()) && date.getFullYear() === new Date().getFullYear() && Math.floor(date.getMonth() / 3) + 1 === quarter }
    const quarterMetrics = (quarter: number) => {
      const declaredDeals = opportunities.filter((opportunity) => inQuarter(opportunity.created_at, quarter))
      const proposalDeals = opportunities.filter((opportunity) => inQuarter(opportunity.quote_completed_at, quarter))
      const wonDeals = opportunities.filter((opportunity) => inQuarter(opportunity.updated_at, quarter) && Boolean(opportunity.purchase_order_id))
      const projection = projections.find((item) => Number(item.period_quarter) === quarter)
      return { declared: declaredDeals.length, declaredAmount: declaredDeals.reduce((sum, opportunity) => sum + amount(opportunity), 0), declaredTarget: Number(projection?.target_opportunities_declared ?? 0), proposal: proposalDeals.length, proposalAmount: proposalDeals.reduce((sum, opportunity) => sum + amount(opportunity), 0), proposalTarget: Number(projection?.target_opportunities_proposal ?? 0), won: wonDeals.length, wonAmount: wonDeals.reduce((sum, opportunity) => sum + amount(opportunity), 0), wonTarget: Number(projection?.target_opportunities_won ?? 0) }
    }
    const quarters = [1, 2, 3, 4].map((quarter) => { const quarterTargetValue = quarterTarget(quarter); const wonValue = quarterWon(quarter); const weightedValue = quarterWeighted(quarter); return { label: `Q${quarter}`, target: quarterTargetValue, won: wonValue, weighted: weightedValue, metrics: quarterMetrics(quarter), status: wonValue >= quarterTargetValue && quarterTargetValue > 0 ? "On target" : weightedValue > 0 ? "In progress" : "No pipeline" } })
    const projectionTotals = projections.reduce((totals, projection) => ({ declared: totals.declared + Number(projection.target_opportunities_declared ?? 0), proposal: totals.proposal + Number(projection.target_opportunities_proposal ?? 0), won: totals.won + Number(projection.target_opportunities_won ?? 0) }), { declared: 0, proposal: 0, won: 0 })
    const actualWonCount = opportunities.filter(isWon).length
    const actualProposalCount = opportunities.filter((opportunity) => Boolean(opportunity.quote_completed_at)).length
    const openCurrentYearOpportunities = opportunities.filter((opportunity) => isOpen(opportunity) && (closesInYear(opportunity) || !opportunityCloseDate(opportunity)))
    const hygiene = [
      { icon: CalendarClock, label: t("dashboard.withoutCloseDate"), value: openCurrentYearOpportunities.filter((opportunity) => !opportunityCloseDate(opportunity)).length, detail: t("dashboard.openOpportunities") },
      { icon: Gauge, label: t("dashboard.lowProbability"), value: openOpportunities.filter((opportunity) => Number(opportunity.probability ?? opportunity.win_probability ?? opportunity.pipeline_stage?.probability ?? 0) < 50).length, detail: t("dashboard.openOpportunities") },
      { icon: Clock, label: t("dashboard.stalled"), value: openOpportunities.filter((opportunity) => opportunity.updated_at && Date.now() - new Date(opportunity.updated_at).getTime() > 90 * 86400000).length, detail: t("dashboard.openOpportunities") },
      { icon: TrendingUp, label: t("dashboard.openPipelineValue"), value: money(openOpportunities.reduce((sum, opportunity) => sum + opportunityAmount(opportunity), 0)), detail: t("dashboard.openOpportunities") },
    ]
    const rankingLabels: Record<string, string> = { closed: t("dashboard.closedAmount"), target: t("dashboard.targetAttainment"), deals: t("dashboard.dealCount"), speed: t("dashboard.closeSpeed") }
    const benchmarkRows = benchmarkPartners.map((partner) => ({ name: partner.name, value: Number(partner.closed_amount ?? partner.won_amount ?? 0) })).sort((a, b) => b.value - a.value)
    const currentPosition = Math.max(1, benchmarkRows.findIndex((row) => row.name === partnerName) + 1)
    return (
      <Card className="mx-auto min-h-[560px] w-full overflow-hidden border-2 border-primary/20 shadow-sm md:w-3/5">
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100 pb-3">
          <div className="flex items-start justify-between gap-3"><div><CardTitle className="text-xl font-bold text-gray-900">{partnerName || t("dashboard.partnerAccount")} <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">{t("dashboard.needsFocus")}</span></CardTitle><p className="mt-1 text-xs text-gray-500">{t("dashboard.annualSubtitle")}</p></div><BarChart3 className="h-5 w-5 text-indigo-500" /></div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 text-xs">
          <section><div className="mb-2 flex items-center justify-between font-semibold text-gray-700"><span>{t("dashboard.annualMatrix")}</span><span className="text-gray-500">{t("dashboard.target")} {money(target)}</span></div><div className="mb-2 flex h-3 overflow-hidden rounded-full bg-gray-200"><div className="bg-emerald-500" style={{ width: `${Math.min(100, won / target * 100)}%` }} /><div className="bg-blue-500" style={{ width: `${Math.min(100 - won / target * 100, weighted / target * 100)}%` }} /><div className="flex-1 bg-gray-200" /></div><div className="flex justify-between text-gray-500"><span>{t("dashboard.won")} {money(won)}</span><span>{t("dashboard.weighted")} {money(weighted)}</span><span>{t("dashboard.gap")} {money(gap)}</span></div></section>
          <div className="mb-3 grid grid-cols-3 gap-2">{[{ label: "Declared", target: projectionTotals.declared, actual: opportunities.filter((opportunity) => Boolean(opportunity.created_at)).length }, { label: "Proposal", target: projectionTotals.proposal, actual: actualProposalCount }, { label: "Won", target: projectionTotals.won, actual: actualWonCount }].map((metric) => <div key={metric.label} className="rounded-md border bg-white p-2"><div className="text-[10px] font-semibold text-gray-600">{metric.label} opportunities</div><div className="mt-1 flex items-end justify-between"><span className="text-lg font-bold text-gray-900">{metric.actual}</span><span className="text-[10px] text-gray-500">target {metric.target}</span></div><Progress value={metric.target ? Math.min(100, metric.actual / metric.target * 100) : 0} className="mt-1 h-1.5" indicatorClassName="bg-indigo-500" /></div>)}</div><div className="grid grid-cols-4 gap-2">{quarters.map((quarter) => <div key={quarter.label} className="rounded-md border bg-white p-2"><div className="flex items-center justify-between"><div className="font-semibold text-gray-800">{quarter.label}</div><span className="text-[10px] text-gray-500">{t("dashboard.target")} {money(quarter.target)}</span></div><div className="mt-2 space-y-1.5"><div className="flex items-center justify-between"><span className="text-gray-500">{t("dashboard.declared")}</span><span className="font-semibold text-gray-800">{quarter.metrics.declared} <span className="font-normal text-gray-400">({quarter.metrics.declaredTarget})</span></span></div><div className="flex items-center justify-between"><span className="text-gray-500">{t("dashboard.proposal")}</span><span className="font-semibold text-gray-800">{quarter.metrics.proposal} <span className="font-normal text-gray-400">({quarter.metrics.proposalTarget})</span></span></div><div className="flex items-center justify-between"><span className="text-gray-500">{t("dashboard.won")}</span><span className="font-semibold text-emerald-700">{quarter.metrics.won} <span className="font-normal text-emerald-600">({quarter.metrics.wonTarget})</span></span></div></div><Progress value={quarter.target ? Math.min(100, (quarter.won + quarter.weighted) / quarter.target * 100) : 0} className="mt-2 h-1.5" indicatorClassName="bg-blue-500" /><div className="mt-1 text-[10px] text-gray-500">{quarter.status === "On target" ? t("dashboard.onTarget") : quarter.status === "In progress" ? t("dashboard.inProgress") : t("dashboard.noPipeline")}</div></div>)}</div>
          <section><div className="mb-2 flex items-center gap-1 font-semibold text-gray-700"><Filter className="h-3.5 w-3.5 text-amber-500" />{t("dashboard.pipelineHygiene")}</div><div className="mb-3 grid gap-3 rounded-xl border border-primary/15 bg-gradient-to-br from-card via-card to-primary/[0.04] p-3 shadow-sm md:grid-cols-5"><div className="md:col-span-5 mb-0 flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-primary/75">{t("dashboard.openOpportunities")}</p><p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{openOpportunities.length} <span className="text-xs font-normal text-gray-500">{t("dashboard.inPipeline")}</span></p></div><p className="rounded-full bg-primary/[0.08] px-2 py-1 text-[10px] font-medium text-primary">{t("dashboard.opportunityProbability")}</p></div><div className="md:col-span-3 flex flex-col gap-1.5 border-b border-border/70 pb-3">{probabilityBuckets.map((bucket) => <div key={bucket.label} className="flex items-center gap-2"><span className={`flex h-6 w-14 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white ${bucket.tone}`}>{bucket.label}</span><div className="relative h-7 flex-1 overflow-hidden rounded-r-lg bg-muted/50"><div className={`absolute inset-y-0 left-0 ${bucket.tone}`} style={{ width: `${bucket.count / Math.max(openOpportunities.length, 1) * 100}%` }} /><div className="relative z-10 flex h-full items-center justify-between px-2 text-[10px] font-semibold text-white"><span>{bucket.count} opportunities</span><span>{bucket.amount}</span></div></div></div>)}</div><div className="md:col-span-2 mt-0 grid grid-cols-2 gap-2"><div className="rounded-xl border border-primary/10 bg-gradient-to-br from-primary/[0.05] to-card p-2 text-center"><p className="text-[10px] text-gray-500">Closing next 30 days</p><p className="mt-1 text-lg font-semibold text-gray-900">{money(closing30.reduce((sum, opportunity) => sum + opportunityAmount(opportunity), 0))}</p><p className="text-[10px] text-gray-500">Weighted amount</p></div><div className="rounded-xl border border-sky-200/70 bg-gradient-to-br from-sky-50/80 to-card p-2 text-center"><p className="text-[10px] font-medium text-sky-700">Closing next 90 days</p><p className="mt-1 text-lg font-semibold text-gray-900">{money(weighted90)}</p><p className="text-[10px] text-gray-500">Weighted amount</p></div></div></div><div className="md:col-span-5 grid grid-cols-2 gap-2">{hygiene.map(({ icon: Icon, label, value, detail }) => <div key={label} className="rounded-md border border-amber-100 bg-amber-50/70 p-2"><Icon className="h-4 w-4 text-amber-600" /><div className="mt-1 font-semibold text-gray-800">{value} {label}</div><p className="mt-0.5 text-[10px] text-gray-500">{detail}</p></div>)}</div></section>
          <section><div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-1 font-semibold text-gray-700"><Trophy className="h-3.5 w-3.5 text-indigo-500" />{t("dashboard.networkBenchmark")}</div><span className="text-[10px] text-gray-500">{t("dashboard.current")}: #{currentPosition}</span></div><div className="mb-2 flex flex-wrap gap-1">{Object.entries(rankingLabels).map(([key, label]) => <button key={key} type="button" onClick={() => setRankingMetric(key)} className={`rounded border px-2 py-1 text-[10px] ${rankingMetric === key ? "border-primary bg-primary/10 font-semibold text-primary" : "bg-white text-gray-500"}`}>{label}</button>)}</div><div className="overflow-hidden rounded-md border"><div className="grid grid-cols-[1fr_auto] bg-gray-50 px-2 py-1 font-semibold"><span>{rankingLabels[rankingMetric]}</span><span>{t("dashboard.score")}</span></div>{benchmarkRows.length > 0 ? benchmarkRows.slice(0, 5).map((row, index) => <div key={row.name} className={`grid grid-cols-[1fr_auto] px-2 py-1 ${row.name === partnerName ? "bg-primary/10 font-bold" : ""}`}><span className={row.name === partnerName ? "" : "blur-[3px] select-none pointer-events-none"}>{row.name}</span><span>{row.name === partnerName ? t("dashboard.current") : `${index + 1}`}</span></div>) : <div className="px-2 py-2 text-gray-500">{t("dashboard.noBenchmarkData")}</div>}</div></section>
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
