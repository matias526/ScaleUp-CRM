"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTranslations } from "@/hooks/use-translations"
import { DICT_LANG_TECH_DASHBOARD } from "@/lib/constants/dict-lang-tech-dashboard"
import { supabase } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  TrendingUp,
  Users,
  Zap,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import type { Database } from "@/types/supabase"

type TechDashboardMetrics = {
  total_pipeline_value: number
  total_opportunities: number
  conversion_rate: number
  active_partners: number
}

type RecentOpportunity = {
  id: string
  title: string
  stage_name: string
  estimated_value?: number
  partner_name?: string
  updated_at: string
}

type RecentTask = {
  id: string
  title: string
  status: string
  priority: string
  due_date?: string
  updated_at: string
}

type RecentPurchaseOrder = {
  id: string
  po_number: string
  status: string
  total_amount: number
  partner_name?: string
  created_at: string
}

type ActivePartner = {
  id: string
  name: string
  opportunities_count: number
  total_value: number
}

export function TechCompanyDashboard() {
  const { t } = useTranslations(DICT_LANG_TECH_DASHBOARD)
  const [metrics, setMetrics] = useState<TechDashboardMetrics | null>(null)
  const [recentOpportunities, setRecentOpportunities] = useState<RecentOpportunity[]>([])
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([])
  const [recentPurchaseOrders, setRecentPurchaseOrders] = useState<RecentPurchaseOrder[]>([])
  const [activePartners, setActivePartners] = useState<ActivePartner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError(t("tech_dashboard.error"))
        return
      }

      // Get tech company for current user
      const { data: userData } = await supabase
        .from("users")
        .select("tech_company_id")
        .eq("id", user.id)
        .single()

      if (!userData?.tech_company_id) {
        setError(t("tech_dashboard.error"))
        return
      }

      const techCompanyId = userData.tech_company_id

      // Load metrics
      const [oppData, taskData, poData, partnerData] = await Promise.all([
        loadOpportunitiesMetrics(techCompanyId),
        loadTasksData(techCompanyId),
        loadPurchaseOrdersData(techCompanyId),
        loadPartnersData(techCompanyId),
      ])

      // Calculate metrics
      const totalValue = oppData.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0)
      const convertedOpps = oppData.filter((opp) => opp.stage_name === "Won").length
      const conversionRate = oppData.length > 0 ? (convertedOpps / oppData.length) * 100 : 0

      setMetrics({
        total_pipeline_value: totalValue,
        total_opportunities: oppData.length,
        conversion_rate: conversionRate,
        active_partners: partnerData.length,
      })

      setRecentOpportunities(oppData.slice(0, 5))
      setRecentTasks(taskData.slice(0, 5))
      setRecentPurchaseOrders(poData.slice(0, 5))
      setActivePartners(partnerData.slice(0, 5))
    } catch (err) {
      console.error("[v0] Error loading dashboard:", err)
      setError(t("tech_dashboard.error"))
    } finally {
      setLoading(false)
    }
  }

  const loadOpportunitiesMetrics = async (techCompanyId: string) => {
    const { data, error } = await supabase
      .from("opportunities")
      .select(
        `
        id,
        title,
        estimated_value,
        updated_at,
        pipeline_stages(code)
      `,
      )
      .eq("tech_company_id", techCompanyId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("[v0] Error loading opportunities:", error)
      return []
    }

    return (
      data?.map((opp: any) => ({
        id: opp.id,
        title: opp.title || "Untitled Opportunity",
        stage_name: opp.pipeline_stages?.code || "Unknown",
        estimated_value: opp.estimated_value || 0,
        partner_name: undefined,
        updated_at: opp.updated_at,
      })) || []
    )
  }

  const loadTasksData = async (techCompanyId: string) => {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        id,
        title,
        status,
        priority,
        due_date,
        updated_at
      `,
      )
      .eq("tech_company_id", techCompanyId)
      .eq("status", "pending")
      .order("due_date", { ascending: true })

    if (error) {
      console.error("[v0] Error loading tasks:", error)
      return []
    }

    return data || []
  }

  const loadPurchaseOrdersData = async (techCompanyId: string) => {
    // First get all opportunities for this tech company
    const { data: opportunities, error: oppError } = await supabase
      .from("opportunities")
      .select("purchase_order_id")
      .eq("tech_company_id", techCompanyId)
      .not("purchase_order_id", "is", null)

    if (oppError) {
      console.error("[v0] Error loading opportunities for PO:", oppError)
      return []
    }

    if (!opportunities || opportunities.length === 0) {
      return []
    }

    // Get unique PO IDs
    const poIds = Array.from(new Set(opportunities.map((opp: any) => opp.purchase_order_id)))

    // Get purchase orders with partner info
    const { data, error } = await supabase
      .from("purchase_orders")
      .select(
        `
        id,
        po_number,
        status,
        total_amount,
        created_at,
        partners(name)
      `,
      )
      .in("id", poIds)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error loading purchase orders:", error)
      return []
    }

    return (
      data?.map((po: any) => ({
        id: po.id,
        po_number: po.po_number,
        status: po.status,
        total_amount: po.total_amount || 0,
        partner_name: po.partners?.name,
        created_at: po.created_at,
      })) || []
    )
  }

  const loadPartnersData = async (techCompanyId: string) => {
    // First get all partners for this tech company
    const { data: partnerTechComps, error: ptcError } = await supabase
      .from("partner_tech_companies")
      .select(
        `
        partner_id,
        partners(id, name)
      `,
      )
      .eq("tech_company_id", techCompanyId)

    if (ptcError) {
      console.error("[v0] Error loading partner_tech_companies:", ptcError)
      return []
    }

    if (!partnerTechComps || partnerTechComps.length === 0) {
      return []
    }

    // Get partner IDs
    const partnerIds = partnerTechComps.map((ptc: any) => ptc.partner_id)

    // Get opportunities and purchase orders for these partners
    const { data: opportunities, error: oppError } = await supabase
      .from("opportunities")
      .select("partner_id, estimated_value")
      .in("partner_id", partnerIds)

    const { data: purchaseOrders, error: poError } = await supabase
      .from("purchase_orders")
      .select("partner_id, total_amount")
      .in("partner_id", partnerIds)

    if (oppError) console.error("[v0] Error loading opportunities for partners:", oppError)
    if (poError) console.error("[v0] Error loading purchase orders for partners:", poError)

    // Group and calculate metrics
    const partnerMetrics = new Map()

    partnerTechComps.forEach((ptc: any) => {
      const partnerId = ptc.partner_id
      const partnerName = ptc.partners?.name || "Unknown Partner"

      partnerMetrics.set(partnerId, {
        id: partnerId,
        name: partnerName,
        opportunities_count: 0,
        total_value: 0,
      })
    })

    opportunities?.forEach((opp: any) => {
      const metric = partnerMetrics.get(opp.partner_id)
      if (metric) {
        metric.opportunities_count++
      }
    })

    purchaseOrders?.forEach((po: any) => {
      const metric = partnerMetrics.get(po.partner_id)
      if (metric) {
        metric.total_value += po.total_amount || 0
      }
    })

    return Array.from(partnerMetrics.values())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Zap className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-gray-600">{t("tech_dashboard.loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t("tech_dashboard.title")}</h1>
        <p className="text-gray-600 mt-1">{t("tech_dashboard.welcome")}</p>
      </div>

      {/* KPIs */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Pipeline Value */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("tech_dashboard.kpi.total_pipeline")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics.total_pipeline_value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-gray-500 mt-1">{metrics.total_opportunities} oportunidades</p>
            </CardContent>
          </Card>

          {/* Total Opportunities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("tech_dashboard.kpi.total_opportunities")}</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_opportunities}</div>
              <p className="text-xs text-gray-500 mt-1">En tu pipeline</p>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("tech_dashboard.kpi.conversion_rate")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.conversion_rate.toFixed(1)}%</div>
              <p className="text-xs text-gray-500 mt-1">De conversión</p>
            </CardContent>
          </Card>

          {/* Active Partners */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("tech_dashboard.kpi.active_partners")}</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.active_partners}</div>
              <p className="text-xs text-gray-500 mt-1">Partners activos</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle>{t("tech_dashboard.opportunities.recent")}</CardTitle>
            <CardDescription>{t("tech_dashboard.section.opportunities")}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOpportunities.length > 0 ? (
              <div className="space-y-4">
                {recentOpportunities.map((opp) => (
                  <div key={opp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{opp.title}</p>
                      <p className="text-xs text-gray-500">{opp.partner_name}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{opp.stage_name}</Badge>
                      {opp.estimated_value && <p className="text-sm font-semibold mt-1">${opp.estimated_value.toLocaleString()}</p>}
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/opportunities">
                  <Button variant="ghost" className="w-full mt-2">
                    {t("tech_dashboard.opportunities.view_all")}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">{t("tech_dashboard.opportunities.no_data")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>{t("tech_dashboard.tasks.pending")}</CardTitle>
            <CardDescription>{t("tech_dashboard.section.tasks")}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTasks.length > 0 ? (
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.due_date}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {task.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/tasks">
                  <Button variant="ghost" className="w-full mt-2">
                    {t("tech_dashboard.tasks.view_all")}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">{t("tech_dashboard.tasks.no_data")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Purchase Orders */}
        <Card>
          <CardHeader>
            <CardTitle>{t("tech_dashboard.purchase_orders.recent")}</CardTitle>
            <CardDescription>{t("tech_dashboard.section.purchase_orders")}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPurchaseOrders.length > 0 ? (
              <div className="space-y-4">
                {recentPurchaseOrders.map((po) => (
                  <div key={po.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex-1">
                      <p className="font-medium text-sm">PO #{po.po_number}</p>
                      <p className="text-xs text-gray-500">{po.partner_name}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{po.status}</Badge>
                      <p className="text-sm font-semibold mt-1">${po.total_amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/purchase-orders">
                  <Button variant="ghost" className="w-full mt-2">
                    {t("tech_dashboard.purchase_orders.view_all")}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">{t("tech_dashboard.purchase_orders.no_data")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Partners */}
        <Card>
          <CardHeader>
            <CardTitle>{t("tech_dashboard.partners.active")}</CardTitle>
            <CardDescription>{t("tech_dashboard.section.partners")}</CardDescription>
          </CardHeader>
          <CardContent>
            {activePartners.length > 0 ? (
              <div className="space-y-4">
                {activePartners.map((partner) => (
                  <div key={partner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{partner.name}</p>
                      <p className="text-xs text-gray-500">{partner.opportunities_count} oportunidades</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${partner.total_value.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/partners">
                  <Button variant="ghost" className="w-full mt-2">
                    {t("tech_dashboard.partners.view_all")}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">{t("tech_dashboard.partners.no_data")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
