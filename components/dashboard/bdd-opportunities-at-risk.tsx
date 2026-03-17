"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircleIcon, AlertTriangleIcon, CalendarIcon, ClockIcon, TrendingDownIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type OpportunityAtRisk = {
  id: string
  name: string
  techCompany: string
  value: number
  riskType: "inactive" | "closing_soon" | "low_probability"
  daysInactive?: number
  daysToClose?: number
  probability?: number
}

export function BddOpportunitiesAtRisk() {
  const [opportunities, setOpportunities] = useState<OpportunityAtRisk[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulación de carga de datos
    async function loadOpportunities() {
      try {
        setLoading(true)

        // Datos de ejemplo
        const mockData: OpportunityAtRisk[] = [
          {
            id: "1",
            name: "Implementación CRM",
            techCompany: "TechCorp",
            value: 25000,
            riskType: "inactive",
            daysInactive: 45,
          },
          {
            id: "2",
            name: "Migración a la nube",
            techCompany: "CloudSolutions",
            value: 75000,
            riskType: "closing_soon",
            daysToClose: 5,
          },
          {
            id: "3",
            name: "Desarrollo de API",
            techCompany: "DevTech",
            value: 30000,
            riskType: "low_probability",
            probability: 15,
          },
        ]

        // Simular retraso de red
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setOpportunities(mockData)
      } catch (err) {
        console.error("Error loading opportunities at risk:", err)
        setError("No se pudieron cargar las oportunidades en riesgo.")
      } finally {
        setLoading(false)
      }
    }

    loadOpportunities()
  }, [])

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Oportunidades en Riesgo</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : opportunities && opportunities.length > 0 ? (
          <div className="space-y-4">
            {opportunities.map((opportunity) => (
              <OpportunityRiskCard key={opportunity.id} opportunity={opportunity} />
            ))}

            <Button variant="outline" className="w-full mt-2">
              Ver todas las oportunidades en riesgo
            </Button>
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            <p>No hay oportunidades en riesgo actualmente.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function OpportunityRiskCard({ opportunity }: { opportunity: OpportunityAtRisk }) {
  // Determinar el icono y color según el tipo de riesgo
  const getRiskIcon = () => {
    switch (opportunity.riskType) {
      case "inactive":
        return <ClockIcon className="h-5 w-5 text-amber-500" />
      case "closing_soon":
        return <CalendarIcon className="h-5 w-5 text-red-500" />
      case "low_probability":
        return <TrendingDownIcon className="h-5 w-5 text-purple-500" />
      default:
        return <AlertCircleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  // Determinar el mensaje de riesgo
  const getRiskMessage = () => {
    switch (opportunity.riskType) {
      case "inactive":
        return `Inactiva por ${opportunity.daysInactive} días`
      case "closing_soon":
        return `Cierre en ${opportunity.daysToClose} días`
      case "low_probability":
        return `Probabilidad: ${opportunity.probability}%`
      default:
        return "En riesgo"
    }
  }

  // Determinar el color de la badge
  const getBadgeColor = () => {
    switch (opportunity.riskType) {
      case "inactive":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200"
      case "closing_soon":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      case "low_probability":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  return (
    <div className="p-3 rounded-lg border border-gray-200 hover:bg-muted/50 transition-colors">
      <div className="flex items-start space-x-3">
        <div className="mt-1">{getRiskIcon()}</div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h4 className="font-medium">{opportunity.name}</h4>
            <Badge variant="outline" className={getBadgeColor()}>
              {getRiskMessage()}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mt-1">
            {opportunity.techCompany} · €{opportunity.value.toLocaleString()}
          </p>

          <div className="flex justify-end mt-2">
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <AlertTriangleIcon className="h-3 w-3 mr-1" />
              Tomar acción
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
