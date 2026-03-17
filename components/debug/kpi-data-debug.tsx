"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Database, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface DebugData {
  opportunities: any[]
  pipelineStages: any[]
  partners: any[]
  techCompanies: any[]
  kpiCalculations: {
    totalPipeline: number
    activeOpportunities: number
    conversionRate: number
    activePartners: number
    activeTechCompanies: number
    averageDealSize: number
  }
}

export function KPIDataDebug() {
  const [data, setData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDebugData = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Fetch opportunities with pipeline stages
      const { data: opportunities, error: oppError } = await supabase
        .from("opportunities")
        .select(`
          *,
          pipeline_stages (
            id,
            code,
            display_order
          ),
          partners (
            id,
            name
          ),
          tech_companies (
            id,
            name
          )
        `)
        .eq("validation_status", "validated")
        .order("created_at", { ascending: false })

      if (oppError) throw oppError

      // Fetch pipeline stages
      const { data: pipelineStages, error: stagesError } = await supabase
        .from("pipeline_stages")
        .select("*")
        .order("display_order")

      if (stagesError) throw stagesError

      // Fetch partners
      const { data: partners, error: partnersError } = await supabase.from("partners").select("id, name").order("name")

      if (partnersError) throw partnersError

      // Fetch tech companies
      const { data: techCompanies, error: techError } = await supabase
        .from("tech_companies")
        .select("id, name")
        .order("name")

      if (techError) throw techError

      // Calculate KPIs
      const activeStages = pipelineStages?.filter((stage) => !["Lost", "Freeze"].includes(stage.code)) || []

      const activeOpportunities =
        opportunities?.filter((opp) => activeStages.some((stage) => stage.id === opp.pipeline_stage_id)) || []

      const wonOpportunities =
        opportunities?.filter(
          (opp) => pipelineStages?.find((stage) => stage.id === opp.pipeline_stage_id)?.code === "Won",
        ) || []

      const totalPipeline = activeOpportunities.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0)

      const conversionRate =
        opportunities && opportunities.length > 0 ? (wonOpportunities.length / opportunities.length) * 100 : 0

      const activePartnerIds = new Set(activeOpportunities.filter((opp) => opp.partner_id).map((opp) => opp.partner_id))

      const activeTechCompanyIds = new Set(
        activeOpportunities.filter((opp) => opp.tech_company_id).map((opp) => opp.tech_company_id),
      )

      const averageDealSize = activeOpportunities.length > 0 ? totalPipeline / activeOpportunities.length : 0

      const kpiCalculations = {
        totalPipeline,
        activeOpportunities: activeOpportunities.length,
        conversionRate,
        activePartners: activePartnerIds.size,
        activeTechCompanies: activeTechCompanyIds.size,
        averageDealSize,
      }

      setData({
        opportunities: opportunities || [],
        pipelineStages: pipelineStages || [],
        partners: partners || [],
        techCompanies: techCompanies || [],
        kpiCalculations,
      })
    } catch (err) {
      console.error("Error fetching debug data:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Debug KPI Data</h1>
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-[150px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Debug KPI Data</h1>
        <Button onClick={fetchDebugData} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="grid gap-6">
          {/* KPI Calculations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Cálculos de KPIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Pipeline Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${data.kpiCalculations.totalPipeline.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Oportunidades Activas</p>
                  <p className="text-2xl font-bold text-blue-600">{data.kpiCalculations.activeOpportunities}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tasa de Conversión</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {data.kpiCalculations.conversionRate.toFixed(1)}%
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Partners Activos</p>
                  <p className="text-2xl font-bold text-orange-600">{data.kpiCalculations.activePartners}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tech Companies Activas</p>
                  <p className="text-2xl font-bold text-indigo-600">{data.kpiCalculations.activeTechCompanies}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tamaño Promedio Deal</p>
                  <p className="text-2xl font-bold text-teal-600">
                    ${data.kpiCalculations.averageDealSize.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Stages */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Stages ({data.pipelineStages.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                {data.pipelineStages.map((stage) => (
                  <div key={stage.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm font-medium">{stage.code}</span>
                    <Badge variant={["Lost", "Freeze"].includes(stage.code) ? "destructive" : "default"}>
                      {stage.display_order}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Opportunities Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Oportunidades ({data.opportunities.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold text-green-600">
                      {
                        data.opportunities.filter((opp) =>
                          data.pipelineStages.find(
                            (stage) => stage.id === opp.pipeline_stage_id && !["Lost", "Freeze"].includes(stage.code),
                          ),
                        ).length
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">Activas</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold text-blue-600">
                      {
                        data.opportunities.filter((opp) =>
                          data.pipelineStages.find(
                            (stage) => stage.id === opp.pipeline_stage_id && stage.code === "Won",
                          ),
                        ).length
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">Ganadas</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold text-red-600">
                      {
                        data.opportunities.filter((opp) =>
                          data.pipelineStages.find(
                            (stage) => stage.id === opp.pipeline_stage_id && ["Lost", "Freeze"].includes(stage.code),
                          ),
                        ).length
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">Perdidas/Congeladas</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Últimas 5 oportunidades:</h4>
                  {data.opportunities.slice(0, 5).map((opp) => (
                    <div key={opp.id} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div>
                        <p className="font-medium">{opp.title}</p>
                        <p className="text-muted-foreground">
                          {data.pipelineStages.find((stage) => stage.id === opp.pipeline_stage_id)?.code || "Unknown"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${opp.estimated_value?.toLocaleString() || "0"}</p>
                        <p className="text-muted-foreground">{new Date(opp.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partners & Tech Companies */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Partners ({data.partners.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {data.partners.slice(0, 10).map((partner) => (
                    <div key={partner.id} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span>{partner.name}</span>
                      <Badge variant="outline">
                        {data.opportunities.filter((opp) => opp.partner_id === partner.id).length}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tech Companies ({data.techCompanies.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {data.techCompanies.slice(0, 10).map((company) => (
                    <div key={company.id} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span>{company.name}</span>
                      <Badge variant="outline">
                        {data.opportunities.filter((opp) => opp.tech_company_id === company.id).length}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
