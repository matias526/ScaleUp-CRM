"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslations } from "@/hooks/use-translations"
import { supabase } from "@/lib/supabase/client"

interface TechCompanyData {
  id: string
  name: string
  logo: string | null
  opportunities: number
  value: number
}

interface DashboardFilters {
  dateRange: {
    from: Date
    to: Date
  }
  country: string | null
  partnerId: string | null
  techCompanyId: string | null
}

interface NewAdminTopTechCompaniesProps {
  filters: DashboardFilters
}

export function NewAdminTopTechCompanies({ filters }: NewAdminTopTechCompaniesProps) {
  const { t, isLoaded } = useTranslations()
  const [techCompaniesData, setTechCompaniesData] = useState<TechCompanyData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded) {
      loadTechCompaniesData()
    }
  }, [filters, isLoaded])

  const loadTechCompaniesData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Obtener todas las tech companies
      const { data: techCompanies, error: techCompaniesError } = await supabase
        .from("tech_companies")
        .select("id, name, logo")
        .eq("is_active", true)

      if (techCompaniesError) throw techCompaniesError

      // Para cada tech company, obtener sus oportunidades en el período
      const techCompanyPromises = techCompanies.map(async (company) => {
        let query = supabase
          .from("opportunities")
          .select("estimated_value")
          .eq("tech_company_id", company.id)
          .gte("created_at", filters.dateRange.from.toISOString())
          .lte("created_at", filters.dateRange.to.toISOString())

        // Aplicar filtro de partner si existe
        if (filters.partnerId) {
          query = query.eq("partner_id", filters.partnerId)
        }

        const { data: opportunities, error: oppsError } = await query

        if (oppsError) throw oppsError

        const count = opportunities?.length || 0
        const value = opportunities?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0

        return {
          id: company.id,
          name: company.name,
          logo: company.logo,
          opportunities: count,
          value,
        }
      })

      const results = await Promise.all(techCompanyPromises)

      // Filtrar tech companies con actividad y ordenar por valor
      const activeTechCompanies = results
        .filter((company) => company.opportunities > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

      setTechCompaniesData(activeTechCompanies)
    } catch (err) {
      console.error("Error loading tech companies data:", err)
      setError("Error al cargar datos de tech companies")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (!isLoaded || isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.dashboard.topTechCompanies.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (techCompaniesData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.dashboard.topTechCompanies.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            No hay datos de tech companies para el período seleccionado
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.dashboard.topTechCompanies.title")}</CardTitle>
        <div className="text-sm text-muted-foreground">Top 5 tech companies por valor de pipeline</div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {techCompaniesData.map((company, index) => (
            <div key={company.id} className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {index + 1}
              </div>
              <Avatar className="w-10 h-10">
                <AvatarImage src={company.logo || undefined} alt={company.name} />
                <AvatarFallback>{company.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{company.name}</p>
                <p className="text-sm text-muted-foreground">{company.opportunities} oportunidades</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(company.value)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
