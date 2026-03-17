"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Users,
  Target,
} from "lucide-react"
import Image from "next/image"

interface TechCompanyStatusProps {
  meetingId: string
  techCompanies: Array<{ id: string; name: string; logo_url?: string }>
  currentIndex: number
  onNext: () => void
  onPrevious: () => void
}

interface StatusData {
  techCompany: {
    id: string
    name: string
    logo_url?: string
  }
  funnel: Array<{
    stage: string
    count: number
    value: number
  }>
  involucrados: Array<{
    id: string
    name: string
    opportunities: number
    partners: number
    tasks: number
  }>
  goodIndicators: {
    closedOpportunities: number
    movedOpportunities: number
    newOpportunities: number
  }
  badIndicators: {
    stagnantOpportunities: number
    oldOpportunities: number
    opportunitiesWithoutValue: number
    opportunitiesWithoutCloseDate: number
    lostOpportunities: number
  }
  aiAnalysis: {
    status: "VERDE" | "AMARILLO" | "ROJO"
    suggestions: string[]
  }
  totalOpportunities: number
  totalValue: number
}

export default function TechCompanyStatus({
  meetingId,
  techCompanies,
  currentIndex,
  onNext,
  onPrevious,
}: TechCompanyStatusProps) {
  const [statusData, setStatusData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)

  const currentTechCompany = techCompanies[currentIndex]

  useEffect(() => {
    if (currentTechCompany) {
      fetchStatusData()
    }
  }, [currentTechCompany])

  const fetchStatusData = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/internal-meetings/${meetingId}/tech-company-status?techCompanyId=${currentTechCompany.id}`,
      )
      if (response.ok) {
        const data = await response.json()
        setStatusData(data)
      }
    } catch (error) {
      console.error("Error fetching tech company status:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando estado de {currentTechCompany?.name}...</p>
        </div>
      </div>
    )
  }

  if (!statusData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No se pudieron cargar los datos</p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VERDE":
        return "bg-green-500"
      case "AMARILLO":
        return "bg-yellow-500"
      case "ROJO":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Logo and Company Name */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {statusData.techCompany.logo_url && (
            <div className="w-16 h-16 relative">
              <Image
                src={statusData.techCompany.logo_url || "/placeholder.svg"}
                alt={`${statusData.techCompany.name} logo`}
                fill
                className="object-contain"
              />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold">{statusData.techCompany.name}</h2>
            <p className="text-muted-foreground">
              {statusData.totalOpportunities} oportunidades • ${statusData.totalValue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* AI Traffic Light */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">Semáforo AI</p>
            <p className="text-xs text-muted-foreground">Estado General</p>
          </div>
          <div className={`w-8 h-8 rounded-full ${getStatusColor(statusData.aiAnalysis.status)}`}></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Funnel de Oportunidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusData.funnel.map((stage, index) => (
                <div key={stage.stage} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{stage.stage}</p>
                    <p className="text-sm text-muted-foreground">${stage.value.toLocaleString()}</p>
                  </div>
                  <Badge variant="secondary">{stage.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Center Column - Good and Bad Indicators */}
        <div className="space-y-6">
          {/* Good Indicators */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <TrendingUp className="w-5 h-5" />
                Lo Bueno
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Oportunidades cerradas</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {statusData.goodIndicators.closedOpportunities}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Oportunidades que avanzaron</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {statusData.goodIndicators.movedOpportunities}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Nuevas oportunidades</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {statusData.goodIndicators.newOpportunities}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bad Indicators */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <TrendingDown className="w-5 h-5" />
                Lo Malo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sin movimiento &gt;30 días</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {statusData.badIndicators.stagnantOpportunities}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Oportunidades viejas</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {statusData.badIndicators.oldOpportunities}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sin valor estimado</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {statusData.badIndicators.opportunitiesWithoutValue}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sin fecha de cierre</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {statusData.badIndicators.opportunitiesWithoutCloseDate}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Perdidas esta semana</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {statusData.badIndicators.lostOpportunities}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Involved Team and AI Suggestions */}
        <div className="space-y-6">
          {/* Involved Team */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Involucrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statusData.involucrados.map((person) => (
                  <div key={person.id} className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">{person.name}</p>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{person.opportunities} oportunidades</span>
                      <span>{person.partners} partners</span>
                      <span>{person.tasks} tareas</span>
                    </div>
                  </div>
                ))}
                {statusData.involucrados.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay personas asignadas</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Recomendaciones AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statusData.aiAnalysis.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 bg-transparent"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        <div className="flex items-center gap-2">
          {techCompanies.map((_, index) => (
            <div key={index} className={`w-2 h-2 rounded-full ${index === currentIndex ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <Button
          variant="outline"
          onClick={onNext}
          disabled={currentIndex === techCompanies.length - 1}
          className="flex items-center gap-2 bg-transparent"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
