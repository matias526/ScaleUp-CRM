"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from "@/hooks/use-translations"
//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  LineChart,
  PieChart,
  Plus,
  Handshake,
  Lightbulb,
  CheckCircle,
  Timer,
  MapPin,
} from "lucide-react"
import Link from "next/link"
import type { Database } from "@/types/supabase"
import { getCountryName } from "@/lib/utils/country-utils"

type PartnerOpportunity = {
  id: string
  title: string
  tech_company_name: string
  tech_company_logo?: string
  stage_name: string
  created_at: string
  updated_at?: string
  progress: number
  country?: string
  estimated_close_date?: string
  last_activity?: string
}

type PartnerTask = {
  id: string
  title: string
  due_date: string
  status: string
  priority: string
  related_to?: {
    type: string
    id: string
    name: string
  }
}

type PartnerTechCompany = {
  id: string
  name: string
  logo_url?: string
  opportunities_count: number
  total_value: number
}

type PartnerMetrics = {
  total_opportunities: number
  active_opportunities: number
  won_opportunities: number
  conversion_rate: number
  last_opportunity_days: number | null
}

type Opportunity = {
  id: string
  title: string
  pipeline_stage: string
  tech_company_name: string
  updated_at: string
}

export function PartnerDashboard() {
  const { t } = useTranslations()
  const [activeTab, setActiveTab] = useState("opportunities")
  const [opportunities, setOpportunities] = useState<PartnerOpportunity[]>([])
  const [tasks, setTasks] = useState<PartnerTask[]>([])
  const [techCompanies, setTechCompanies] = useState<PartnerTechCompany[]>([])
  const [metrics, setMetrics] = useState<PartnerMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [partnerName, setPartnerName] = useState<string>("")
  const [closingSoon, setClosingSoon] = useState<Opportunity[]>([])
  const [toValidate, setToValidate] = useState<Opportunity[]>([])
  const [validatedRecently, setValidatedRecently] = useState<Opportunity[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      //const supabase = createClientComponentClient<Database>()

      try {
        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()
        if (userError) throw userError

        if (user) {
          setUserId(user.id)

          // Get partner_id for this user
          const { data: userData, error: partnerError } = await supabase
            .from("users")
            .select("partner_id")
            .eq("id", user.id)
            .single()

          if (partnerError) throw partnerError

          if (userData?.partner_id) {
            setPartnerId(userData.partner_id)
            await fetchPartnerData(userData.partner_id, user)
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        setError("Failed to load user data.")
      } finally {
        setLoading(false)
      }
    }

    const fetchPartnerData = async (partnerId: string, user: any) => {
      //const supabase = createClientComponentClient<Database>()

      try {
        // Get partner name
        const { data: partnerData, error: partnerError } = await supabase
          .from("partners")
          .select("name")
          .eq("id", partnerId)
          .single()

        if (partnerError) throw partnerError
        if (partnerData) {
          setPartnerName(partnerData.name)
        }

        // Fetch opportunities with additional fields
        const { data: oppsData, error: oppsError } = await supabase
          .from("opportunities")
          .select(`
            id, 
            title, 
            updated_at,
            created_at,
            validation_status,
            estimated_close_date,
            country,
            tech_company_id,
            tech_companies!inner(id, name, logo_url),
            pipeline_stage_id,
            pipeline_stages!inner(id, code)
          `)
          .eq("partner_id", partnerId)
          .order("estimated_close_date", { ascending: false, nullsLast: true })

        if (oppsError) throw oppsError

        if (oppsData) {
          const formattedOpps: PartnerOpportunity[] = oppsData.map((opp) => ({
            id: opp.id,
            title: opp.title || "Untitled Opportunity",
            tech_company_name: opp.tech_companies?.name || "Unknown",
            tech_company_logo: opp.tech_companies?.logo_url || undefined,
            stage_name: opp.pipeline_stages?.code || "Unknown",
            created_at: opp.created_at,
            updated_at: opp.updated_at,
            progress: calculateProgress(opp.pipeline_stages?.code || ""),
            country: opp.country,
            estimated_close_date: opp.estimated_close_date,
            last_activity: opp.last_activity,
          }))

          setOpportunities(formattedOpps)

          // Calculate metrics
          const activeOpps = oppsData.filter(
            (opp) => !["Won", "Lost", "Freeze"].includes(opp.pipeline_stages?.code || ""),
          )

          const wonOpps = oppsData.filter((opp) => opp.pipeline_stages?.code === "Won")

          // Calculate days since last opportunity
          let lastOpportunityDays = null
          if (oppsData.length > 0) {
            const lastOpportunity = oppsData.reduce((latest, current) => {
              return new Date(current.created_at) > new Date(latest.created_at) ? current : latest
            })
            const lastDate = new Date(lastOpportunity.created_at)
            const today = new Date()
            const diffTime = Math.abs(today.getTime() - lastDate.getTime())
            lastOpportunityDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          }

          setMetrics({
            total_opportunities: oppsData.length,
            active_opportunities: activeOpps.length,
            won_opportunities: wonOpps.length,
            conversion_rate: oppsData.length > 0 ? (wonOpps.length / oppsData.length) * 100 : 0,
            last_opportunity_days: lastOpportunityDays,
          })

          // Filter opportunities for "Próximas a Cerrar" (within next 25 days)
          const today = new Date()
          const next25Days = new Date()
          next25Days.setDate(today.getDate() + 25)

          const closingSoonOpps = oppsData
            .filter((opp) => {
              if (!opp.estimated_close_date) return false
              const closeDate = new Date(opp.estimated_close_date)
              return closeDate >= today && closeDate <= next25Days
            })
            .map((opp) => ({
              id: opp.id,
              title: opp.title,
              pipeline_stage: opp.pipeline_stages?.code,
              tech_company_name: opp.tech_companies?.name,
              updated_at: opp.updated_at,
            }))
            .slice(0, 3) // Limit to 3 opportunities
          setClosingSoon(closingSoonOpps)

          // Filter opportunities for "Por Validar"
          const toValidateOpps = oppsData
            .filter((opp) => opp.validation_status === "pending")
            .map((opp) => ({
              id: opp.id,
              title: opp.title,
              pipeline_stage: opp.pipeline_stages?.code,
              tech_company_name: opp.tech_companies?.name,
              updated_at: opp.updated_at,
            }))
            .slice(0, 3) // Limit to 3 opportunities
          setToValidate(toValidateOpps)

          // Filter opportunities for "Validadas Recientemente"
          const validatedRecentlyOpps = oppsData
            .filter((opp) => opp.pipeline_stages?.code === "Won")
            .map((opp) => ({
              id: opp.id,
              title: opp.title,
              pipeline_stage: opp.pipeline_stages?.code,
              tech_company_name: opp.tech_companies?.name,
              updated_at: opp.updated_at,
            }))
            .slice(0, 3) // Limit to 3 opportunities
          setValidatedRecently(validatedRecentlyOpps)
        }

        // Fetch tasks - Solo tareas asignadas al usuario o creadas por él
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select(`
            id, 
            title, 
            due_date,
            status,
            priority,
            opportunity_id,
            opportunities!left(id, title),
            tech_company_id,
            tech_companies!left(id, name)
          `)
          .eq("partner_id", partnerId)
          .or(`assigned_to.eq.${user.id},assigned_by.eq.${user.id}`) // Solo tareas del usuario actual
          .order("due_date", { ascending: true })
          .limit(10)

        if (tasksError) throw tasksError

        if (tasksData) {
          const formattedTasks: PartnerTask[] = tasksData.map((task) => {
            let relatedTo = undefined

            if (task.opportunity_id && task.opportunities) {
              relatedTo = {
                type: "opportunity",
                id: task.opportunity_id,
                name: task.opportunities.title,
              }
            } else if (task.tech_company_id && task.tech_companies) {
              relatedTo = {
                type: "tech_company",
                id: task.tech_company_id,
                name: task.tech_companies.name,
              }
            }

            return {
              id: task.id,
              title: task.title,
              due_date: task.due_date,
              status: task.status,
              priority: task.priority || "medium",
              related_to: relatedTo,
            }
          })

          setTasks(formattedTasks)
        }

        // Fetch tech companies
        const { data: techData, error: techError } = await supabase
          .from("partner_tech_companies")
          .select(`
            tech_company_id,
            tech_companies!inner(id, name, logo_url)
          `)
          .eq("partner_id", partnerId)

        if (techError) throw techError

        if (techData) {
          const techCompanyIds = techData.map((item) => item.tech_company_id)

          // For each tech company, get opportunity count and total value
          const techCompaniesWithStats = await Promise.all(
            techData.map(async (item) => {
              if (!item.tech_companies) return null

              const { data: techOpps, error: techOppsError } = await supabase
                .from("opportunities")
                .select("id")
                .eq("tech_company_id", item.tech_company_id)
                .eq("partner_id", partnerId)

              if (techOppsError) throw techOppsError

              const oppsCount = techOpps?.length || 0
              const totalValue = 0

              return {
                id: item.tech_companies.id,
                name: item.tech_companies.name,
                logo_url: item.tech_companies.logo_url,
                opportunities_count: oppsCount,
                total_value: totalValue,
              }
            }),
          )

          setTechCompanies(techCompaniesWithStats.filter(Boolean) as PartnerTechCompany[])
        }
      } catch (error) {
        console.error("Error fetching partner data:", error)
        setError("Failed to load partner data.")
      }
    }

    fetchUserData()
  }, [])

  // Helper function to calculate progress based on pipeline stage
  const calculateProgress = (stageCode: string) => {
    const stageProgressMap: { [key: string]: number } = {
      Lead: 10,
      Qualified: 30,
      Proposal: 50,
      Negotiation: 70,
      Closing: 90,
      Won: 100,
      Lost: 0,
      Freeze: 0,
    }

    return stageProgressMap[stageCode] || 0
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  // Format days for last opportunity KPI
  const formatLastOpportunityDays = (days: number | null) => {
    if (days === null) return { number: "N/A", unit: "" }
    if (days === 0) return { number: "0", unit: "días" }
    if (days === 1) return { number: "1", unit: "día" }
    return { number: days.toString(), unit: "días" }
  }

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const lastOpportunityFormat = formatLastOpportunityDays(metrics?.last_opportunity_days || null)

  return (
    <div className="min-h-screen w-full p-6 space-y-6">
      {/* Header with partner-specific styling */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-lg shadow-md text-white">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.partner.title", "Dashboard")}</h1>
        </div>
        <p className="text-blue-100">{t("dashboard.partner.subtitle", "Gestiona tus oportunidades y actividades")}</p>
      </div>

      {/* General Information Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("dashboard.partner.indicators", `Indicadores de ${partnerName}`).replace("{partnerName}", partnerName)}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* KPI Cards */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.partner.metrics.opportunities", "Oportunidades Activas")}
              </CardTitle>
              <LineChart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.active_opportunities || 0}</div>
              <p className="text-xs text-muted-foreground">
                {t(
                  "dashboard.partner.metrics.totalOpportunities",
                  `De ${metrics?.total_opportunities || 0} oportunidades totales`,
                ).replace("{count}", (metrics?.total_opportunities || 0).toString())}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.partner.toValidate", "Por Validar")}</CardTitle>
              <Lightbulb className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{toValidate.length}</div>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.partner.opportunitiesCount", `{count} oportunidades`, {
                  count: toValidate.length || 0,
                }).replace("{count}", (toValidate.length || 0).toString())}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.partner.closingSoon", "Próximas a Cerrar")}
              </CardTitle>
              <Handshake className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{closingSoon.length}</div>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.partner.opportunitiesCount", `{count} oportunidades`, {
                  count: closingSoon.length || 0,
                }).replace("{count}", (closingSoon.length || 0).toString())}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.partner.lastOpportunity", "Última Oportunidad hace")}
              </CardTitle>
              <Timer className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lastOpportunityFormat.number}</div>
              <p className="text-xs text-muted-foreground">{lastOpportunityFormat.unit}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("dashboard.partner.metrics.conversionRate", "Tasa de Conversión")}
              </CardTitle>
              <PieChart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(metrics?.conversion_rate || 0).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.partner.metrics.wonOpportunities", `{count} oportunidades ganadas`, {
                  count: metrics?.won_opportunities || 0,
                }).replace("{count}", (metrics?.won_opportunities || 0).toString())}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Detailed Cards Section */}
      <section className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        {/* Próximas a Cerrar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Handshake className="h-5 w-5 text-blue-600" />
              {t("dashboard.partner.closingSoon", "Próximas a Cerrar")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.partner.closingSoonDesc", "Oportunidades que están por cerrarse")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {closingSoon.length > 0 ? (
              <div className="space-y-4">
                {closingSoon.map((opp) => (
                  <Link
                    key={opp.id}
                    href={`/dashboard/opportunities?selected=${opp.id}`}
                    className="block hover:bg-blue-50 p-2 rounded-md transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium hover:underline">{opp.title}</h4>
                        <p className="text-xs text-muted-foreground">{opp.tech_company_name}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>{t("dashboard.partner.noOpportunities", "No hay oportunidades disponibles")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Por Validar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              {t("dashboard.partner.toValidate", "Por Validar")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.partner.toValidateDesc", "Oportunidades que necesitan ser validadas")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {toValidate.length > 0 ? (
              <div className="space-y-4">
                {toValidate.map((opp) => (
                  <Link
                    key={opp.id}
                    href={`/dashboard/opportunities?selected=${opp.id}`}
                    className="block hover:bg-blue-50 p-2 rounded-md transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium hover:underline">{opp.title}</h4>
                        <p className="text-xs text-muted-foreground">{opp.tech_company_name}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>{t("dashboard.partner.noOpportunities", "No hay oportunidades disponibles")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validadas Recientemente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              {t("dashboard.partner.validatedRecently", "Validadas Recientemente")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.partner.validatedRecentlyDesc", "Oportunidades que han sido validadas recientemente")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validatedRecently.length > 0 ? (
              <div className="space-y-4">
                {validatedRecently.map((opp) => (
                  <Link
                    key={opp.id}
                    href={`/dashboard/opportunities?selected=${opp.id}`}
                    className="block hover:bg-blue-50 p-2 rounded-md transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium hover:underline">{opp.title}</h4>
                        <p className="text-xs text-muted-foreground">{opp.tech_company_name}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>{t("dashboard.partner.noOpportunities", "No hay oportunidades disponibles")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Tabs for Opportunities and Tasks */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("dashboard.partner.myActivities", "Mis Actividades")}
        </h2>
        <Tabs defaultValue="opportunities" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-blue-50 border border-blue-100">
            <TabsTrigger
              value="opportunities"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              {t("dashboard.partner.opportunities", "Oportunidades")}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              {t("dashboard.partner.tasks", "Tareas")}
            </TabsTrigger>
          </TabsList>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t("dashboard.partner.myOpportunities", "Mis Oportunidades")}</CardTitle>
                  <CardDescription>
                    {t("dashboard.partner.myOpportunitiesDesc", "Gestiona tus oportunidades")}
                  </CardDescription>
                </div>
                <Button size="sm" asChild>
                  <Link href="/dashboard/opportunities/create">
                    <Plus className="h-4 w-4 mr-1" />
                    {t("dashboard.partner.new", "Nueva")}
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {opportunities.length > 0 ? (
                  <div className="h-96 overflow-y-auto space-y-4">
                    {opportunities.map((opp) => (
                      <Link
                        key={opp.id}
                        href={`/dashboard/opportunities?selected=${opp.id}`}
                        className="block p-3 rounded-lg border hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            {opp.tech_company_logo ? (
                              <img
                                src={opp.tech_company_logo || "/placeholder.svg"}
                                alt={opp.tech_company_name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <Building2 className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate hover:underline">{opp.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{opp.tech_company_name}</span>
                              {opp.country && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{getCountryName(opp.country)}</span>
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>
                                  {t("dashboard.partner.lastUpdate", "Última actualización")}:{" "}
                                  {formatDate(opp.last_activity || opp.updated_at)}
                                </span>
                                <span>
                                  {t("dashboard.partner.estimatedClose", "Cierre estimado")}:{" "}
                                  {opp.estimated_close_date
                                    ? formatDate(opp.estimated_close_date)
                                    : t("dashboard.partner.notDefined", "No Definida")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>{t("dashboard.partner.noOpportunities", "No hay oportunidades disponibles")}</p>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <Link href="/dashboard/opportunities/create">
                        <Plus className="h-4 w-4 mr-1" />
                        {t("dashboard.partner.createOpportunity", "Crear oportunidad")}
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t("dashboard.partner.myTasks", "Mis Tareas")}</CardTitle>
                  <CardDescription>{t("dashboard.partner.myTasksDesc", "Gestiona tus tareas")}</CardDescription>
                </div>
                <Button size="sm" asChild>
                  <Link href="/dashboard/tasks/create">
                    <Plus className="h-4 w-4 mr-1" />
                    {t("dashboard.partner.new", "Nueva")}
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {tasks.length > 0 ? (
                  <div className="h-96 overflow-y-auto space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start space-x-4 p-3 rounded-lg border hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {task.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/dashboard/tasks/${task.id}`} className="hover:underline">
                            <h4 className="text-sm font-medium truncate">{task.title}</h4>
                          </Link>
                          {task.related_to && (
                            <p className="text-xs text-muted-foreground">
                              {task.related_to.type === "opportunity"
                                ? t("dashboard.partner.opportunity", "Oportunidad") + ": "
                                : t("dashboard.partner.techCompany", "Tech Company") + ": "}
                              {task.related_to.name}
                            </p>
                          )}
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-xs flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(task.due_date)}
                            </span>
                            <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>{t("dashboard.partner.noTasks", "No hay tareas pendientes")}</p>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <Link href="/dashboard/tasks/create">
                        <Plus className="h-4 w-4 mr-1" />
                        {t("dashboard.partner.createTask", "Crear tarea")}
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
