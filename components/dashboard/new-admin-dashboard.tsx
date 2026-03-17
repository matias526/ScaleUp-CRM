"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw, Download, Filter } from "lucide-react"
import { NewAdminKpiCards } from "./new-admin-kpi-cards"
import { NewAdminFilters } from "./new-admin-filters"
import { NewAdminPipelineChart } from "./new-admin-pipeline-chart"
import { NewAdminActivityChart } from "./new-admin-activity-chart"
import { NewAdminTopPartners } from "./new-admin-top-partners"
import { NewAdminTopTechCompanies } from "./new-admin-top-tech-companies"
import { NewAdminActionCenter } from "./new-admin-action-center"
import { NewAdminRecentActivity } from "./new-admin-recent-activity"
import { useTranslation } from "@/lib/hooks/use-translation"

interface DashboardFilters {
  dateRange: {
    from: Date
    to: Date
  }
  country: string | null
  partnerId: string | null
  techCompanyId: string | null
}

export function NewAdminDashboard() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      from: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1),
      to: new Date(),
    },
    country: null,
    partnerId: null,
    techCompanyId: null,
  })

  const handleRefresh = async () => {
    setIsLoading(true)
    // Simular refresh
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const handleExport = () => {
    // Implementar exportación
    console.log("Exporting dashboard data...")
  }

  const handleFiltersChange = (newFilters: DashboardFilters) => {
    setFilters(newFilters)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.dashboard.title")}</h1>
          <p className="text-muted-foreground">{t("admin.dashboard.subtitle")}</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            {t("admin.dashboard.filters.title")}
          </Button>

          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {t("admin.dashboard.buttons.refresh")}
          </Button>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {t("admin.dashboard.buttons.export")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.dashboard.filters.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <NewAdminFilters filters={filters} onFiltersChange={handleFiltersChange} />
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <NewAdminKpiCards filters={filters} />

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Pipeline Chart */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>{t("admin.dashboard.sections.pipelineStages")}</CardTitle>
                <CardDescription>{t("admin.dashboard.sections.pipelineStagesDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <NewAdminPipelineChart filters={filters} />
              </CardContent>
            </Card>

            {/* Action Center */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>{t("admin.dashboard.actions.title")}</CardTitle>
                <CardDescription>{t("admin.dashboard.actions.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                <NewAdminActionCenter filters={filters} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Monthly Activity */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>{t("admin.dashboard.sections.monthlyActivity")}</CardTitle>
                <CardDescription>{t("admin.dashboard.sections.monthlyActivityDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <NewAdminActivityChart filters={filters} />
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>{t("admin.dashboard.activity.title")}</CardTitle>
                <CardDescription>{t("admin.dashboard.activity.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                <NewAdminRecentActivity filters={filters} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.dashboard.sections.pipelineStages")}</CardTitle>
                <CardDescription>{t("admin.dashboard.sections.pipelineStagesDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <NewAdminPipelineChart filters={filters} detailed={true} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.dashboard.sections.monthlyActivity")}</CardTitle>
                <CardDescription>{t("admin.dashboard.sections.monthlyActivityDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <NewAdminActivityChart filters={filters} detailed={true} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="partners" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.dashboard.sections.topPartners")}</CardTitle>
                <CardDescription>{t("admin.dashboard.sections.topPartnersDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <NewAdminTopPartners filters={filters} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("admin.dashboard.sections.topTechCompanies")}</CardTitle>
                <CardDescription>{t("admin.dashboard.sections.topTechCompaniesDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <NewAdminTopTechCompanies filters={filters} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
