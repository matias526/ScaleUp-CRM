"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KpiCards } from "./kpi-cards"
import { PipelineAnalysis } from "./pipeline-analysis"
import { TimeAnalysis } from "./time-analysis"
import { BddPerformance } from "./bdd-performance"
import { PartnersAnalysis } from "./partners-analysis"
import { TechCompaniesAnalysis } from "./tech-companies-analysis"
import { ActionCenter } from "./action-center"
import { DashboardFilters } from "./dashboard-filters"
import { useTranslations } from "@/hooks/use-translations"

export function AdminDashboard() {
  const { t } = useTranslations()
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      <DashboardFilters />

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="overview">{t("dashboard.components.overview")}</TabsTrigger>
          <TabsTrigger value="performance">{t("dashboard.components.performance")}</TabsTrigger>
          <TabsTrigger value="actions">{t("dashboard.components.actions")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <KpiCards />

          <div className="grid gap-6 md:grid-cols-2">
            <PipelineAnalysis />
            <TimeAnalysis />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <BddPerformance />
          <PartnersAnalysis />
          <TechCompaniesAnalysis />
        </TabsContent>

        <TabsContent value="actions">
          <ActionCenter />
        </TabsContent>
      </Tabs>
    </div>
  )
}
