"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BddKpiCards } from "./bdd-kpi-cards"
import { BddPipelineAnalysis } from "./bdd-pipeline-analysis"
import { BddUpcomingActivities } from "./bdd-upcoming-activities"
import { BddPartnersAnalysis } from "./bdd-partners-analysis"

export function BddDashboard() {
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "quarter" | "year">("month")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido a tu panel de control personalizado. Aquí puedes ver tus métricas y actividades.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="p-2 border rounded-md"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
          >
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="quarter">Este trimestre</option>
            <option value="year">Este año</option>
          </select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="partners">Mis Partners</TabsTrigger>
          <TabsTrigger value="activities">Actividades</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <BddKpiCards />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Mi Pipeline</CardTitle>
                <CardDescription>Distribución de oportunidades por etapa del pipeline</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <BddPipelineAnalysis />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Próximas Actividades</CardTitle>
                <CardDescription>Tareas y actividades programadas</CardDescription>
              </CardHeader>
              <CardContent>
                <BddUpcomingActivities />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="partners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mis Partners</CardTitle>
              <CardDescription>Partners asignados y su rendimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <BddPartnersAnalysis />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendario de Actividades</CardTitle>
              <CardDescription>Vista de tus próximas actividades y tareas</CardDescription>
            </CardHeader>
            <CardContent>
              <BddUpcomingActivities showCalendar />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
