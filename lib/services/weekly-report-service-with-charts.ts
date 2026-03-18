//import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@/lib/supabase/server"
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns"
import { Resend } from "resend"
import { WeeklyReportService } from "@/lib/services/weekly-report-service" // Import the base service

// Extender la interfaz para incluir datos de gráficos
export interface WeeklyReportDataWithCharts extends WeeklyReportData {
  charts: {
    opportunitiesByStage: Array<{ stage: string; count: number; color: string }>
    opportunitiesByPartner: Array<{ partner: string; count: number; value: number }>
    weeklyTrend: Array<{ week: string; opened: number; closed: number }>
  }
}

export interface WeeklyReportData {
  techCompany: {
    id: string
    name: string
    logo_url?: string
  }
  period: {
    start: Date
    end: Date
    previousStart: Date
    previousEnd: Date
  }
  summary: {
    openOpportunities: number
    withActivity: number
    withoutActivity: number
    closedThisWeek: number
    previousOpenOpportunities: number
    previousClosedOpportunities: number
  }
  opportunitiesByPartner: {
    [partnerName: string]: {
      new: OpportunityData[]
      existing: OpportunityData[]
      closedWon: OpportunityData[]
      closedLost: OpportunityData[]
    }
  }
  recipients: {
    id: string
    email: string
    first_name: string
    last_name: string
    preferred_language: string
  }[]
}

export interface OpportunityData {
  id: string
  title: string
  country?: string
  estimated_value?: number
  estimated_close_date?: string
  stage_name?: string
  partner_name?: string
  custom_fields?: { [key: string]: any }
  created_at: string
  updated_at?: string
}

export class WeeklyReportServiceWithCharts {
  private static resend = new Resend(process.env.RESEND_API_KEY)

  /**
   * Genera datos de gráficos para el reporte
   */
  static async generateChartData(
    techCompanyId: string,
    reportData: WeeklyReportData,
  ): Promise<WeeklyReportDataWithCharts["charts"]> {
    const supabase = createServerClient()

    try {
      // 1. Oportunidades por etapa
      const { data: stageData, error: stageError } = await supabase
        .from("opportunities")
        .select(`
          pipeline_stage_id,
          stage:pipeline_stages (code, name, display_order)
        `)
        .eq("tech_company_id", techCompanyId)
        .not("stage.code", "in", "(Won,Lost)")

      const stageColors = {
        Lead: "#3b82f6",
        Qualified: "#10b981",
        Proposal: "#f59e0b",
        Negotiation: "#ef4444",
        default: "#6b7280",
      }

      const opportunitiesByStage = (stageData || [])
        .reduce((acc: any[], opp) => {
          const stageName = opp.stage?.name || opp.stage?.code || "Sin Etapa"
          const existing = acc.find((item) => item.stage === stageName)

          if (existing) {
            existing.count++
          } else {
            acc.push({
              stage: stageName,
              count: 1,
              color: stageColors[stageName as keyof typeof stageColors] || stageColors.default,
            })
          }

          return acc
        }, [])
        .sort((a, b) => b.count - a.count)

      // 2. Oportunidades por partner (top 5)
      const opportunitiesByPartner = Object.entries(reportData.opportunitiesByPartner)
        .map(([partnerName, partnerOpps]) => {
          const totalCount =
            partnerOpps.new.length +
            partnerOpps.existing.length +
            partnerOpps.closedWon.length +
            partnerOpps.closedLost.length
          const totalValue = [
            ...partnerOpps.new,
            ...partnerOpps.existing,
            ...partnerOpps.closedWon,
            ...partnerOpps.closedLost,
          ].reduce((sum, opp) => sum + (opp.estimated_value || 0), 0)

          return {
            partner: partnerName,
            count: totalCount,
            value: totalValue,
          }
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

      // 3. Tendencia semanal (últimas 4 semanas)
      const weeklyTrend = []
      for (let i = 3; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(reportData.period.start, i), { weekStartsOn: 1 })
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

        const { data: weekOpps, error: weekError } = await supabase
          .from("opportunities")
          .select("id, created_at, updated_at, stage:pipeline_stages (code)")
          .eq("tech_company_id", techCompanyId)
          .or(`created_at.gte.${weekStart.toISOString()},updated_at.gte.${weekStart.toISOString()}`)
          .lte("created_at", weekEnd.toISOString())

        if (!weekError && weekOpps) {
          const opened = weekOpps.filter(
            (opp) => new Date(opp.created_at) >= weekStart && new Date(opp.created_at) <= weekEnd,
          ).length

          const closed = weekOpps.filter(
            (opp) =>
              opp.stage?.code &&
              ["Won", "Lost"].includes(opp.stage.code) &&
              opp.updated_at &&
              new Date(opp.updated_at) >= weekStart &&
              new Date(opp.updated_at) <= weekEnd,
          ).length

          weeklyTrend.push({
            week: format(weekStart, "dd/MM"),
            opened,
            closed,
          })
        }
      }

      return {
        opportunitiesByStage,
        opportunitiesByPartner,
        weeklyTrend,
      }
    } catch (error) {
      console.error("Error al generar datos de gráficos:", error)
      return {
        opportunitiesByStage: [],
        opportunitiesByPartner: [],
        weeklyTrend: [],
      }
    }
  }

  /**
   * Genera SVG para gráfico de barras simple
   */
  static generateBarChartSVG(data: Array<{ label: string; value: number; color?: string }>, title: string): string {
    if (data.length === 0) return ""

    const width = 400
    const height = 200
    const margin = { top: 30, right: 20, bottom: 40, left: 60 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    const maxValue = Math.max(...data.map((d) => d.value))
    const barWidth = (chartWidth / data.length) * 0.8
    const barSpacing = (chartWidth / data.length) * 0.2

    const bars = data
      .map((item, index) => {
        const barHeight = (item.value / maxValue) * chartHeight
        const x = margin.left + index * (barWidth + barSpacing)
        const y = margin.top + (chartHeight - barHeight)
        const color = item.color || "#3b82f6"

        return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="2"/>
        <text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="12" fill="#374151">${item.value}</text>
        <text x="${x + barWidth / 2}" y="${height - 10}" text-anchor="middle" font-size="10" fill="#6b7280" transform="rotate(-45 ${x + barWidth / 2} ${height - 10})">${item.label}</text>
      `
      })
      .join("")

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .chart-title { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #1f2937; }
          .chart-text { font-family: Arial, sans-serif; }
        </style>
        <text x="${width / 2}" y="20" text-anchor="middle" class="chart-title">${title}</text>
        ${bars}
      </svg>
    `
  }

  /**
   * Genera SVG para gráfico de líneas simple
   */
  static generateLineChartSVG(data: Array<{ label: string; opened: number; closed: number }>, title: string): string {
    if (data.length === 0) return ""

    const width = 400
    const height = 200
    const margin = { top: 30, right: 20, bottom: 40, left: 40 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    const maxValue = Math.max(...data.flatMap((d) => [d.opened, d.closed]))
    const stepX = chartWidth / (data.length - 1)

    // Puntos para línea de abiertos
    const openedPoints = data
      .map((item, index) => {
        const x = margin.left + index * stepX
        const y = margin.top + (chartHeight - (item.opened / maxValue) * chartHeight)
        return `${x},${y}`
      })
      .join(" ")

    // Puntos para línea de cerrados
    const closedPoints = data
      .map((item, index) => {
        const x = margin.left + index * stepX
        const y = margin.top + (chartHeight - (item.closed / maxValue) * chartHeight)
        return `${x},${y}`
      })
      .join(" ")

    // Etiquetas del eje X
    const xLabels = data
      .map((item, index) => {
        const x = margin.left + index * stepX
        return `<text x="${x}" y="${height - 10}" text-anchor="middle" font-size="10" fill="#6b7280">${item.label}</text>`
      })
      .join("")

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .chart-title { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #1f2937; }
          .line-opened { stroke: #10b981; stroke-width: 2; fill: none; }
          .line-closed { stroke: #ef4444; stroke-width: 2; fill: none; }
          .legend { font-family: Arial, sans-serif; font-size: 12px; }
        </style>
        <text x="${width / 2}" y="20" text-anchor="middle" class="chart-title">${title}</text>
        <polyline points="${openedPoints}" class="line-opened"/>
        <polyline points="${closedPoints}" class="line-closed"/>
        ${xLabels}
        <!-- Leyenda -->
        <circle cx="${width - 100}" cy="40" r="4" fill="#10b981"/>
        <text x="${width - 90}" y="45" class="legend" fill="#10b981">Abiertas</text>
        <circle cx="${width - 100}" cy="55" r="4" fill="#ef4444"/>
        <text x="${width - 90}" y="60" class="legend" fill="#ef4444">Cerradas</text>
      </svg>
    `
  }

  /**
   * Genera el HTML del email con gráficos
   */
  static generateWeeklyReportHtmlWithCharts(data: WeeklyReportDataWithCharts, language = "es"): string {
    // Usar la función base y agregar gráficos
    const baseHtml = WeeklyReportService.generateWeeklyReportHtml(data, language)

    // Generar gráficos SVG
    const stageChartData = data.charts.opportunitiesByStage.map((item) => ({
      label: item.stage,
      value: item.count,
      color: item.color,
    }))

    const partnerChartData = data.charts.opportunitiesByPartner.map((item) => ({
      label: item.partner.length > 15 ? item.partner.substring(0, 15) + "..." : item.partner,
      value: item.count,
    }))

    const stageChart = this.generateBarChartSVG(stageChartData, "Oportunidades por Etapa")
    const partnerChart = this.generateBarChartSVG(partnerChartData, "Oportunidades por Partner")
    const trendChart = this.generateLineChartSVG(data.charts.weeklyTrend, "Tendencia Semanal")

    // Insertar gráficos después del resumen ejecutivo
    const chartsSection = `
      <!-- Gráficos -->
      <div style="margin-bottom: 40px;">
        <h2 style="color: #0055b8; font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid #0055b8; padding-bottom: 5px;">
          Análisis Visual
        </h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            ${stageChart}
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
            ${partnerChart}
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
          ${trendChart}
        </div>
      </div>
    `

    // Insertar después del resumen ejecutivo
    return baseHtml.replace(
      "</div>\n\n          <!-- Oportunidades por Partner -->",
      `</div>\n\n          ${chartsSection}\n\n          <!-- Oportunidades por Partner -->`,
    )
  }
}
