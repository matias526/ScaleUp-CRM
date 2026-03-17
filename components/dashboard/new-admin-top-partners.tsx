"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslations } from "@/hooks/use-translations"
import { supabase } from "@/lib/supabase/client"

interface PartnerData {
  id: string
  name: string
  logo_url: string | null
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

interface NewAdminTopPartnersProps {
  filters: DashboardFilters
}

export function NewAdminTopPartners({ filters }: NewAdminTopPartnersProps) {
  const { t, isLoaded } = useTranslations()
  const [partnersData, setPartnersData] = useState<PartnerData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded) {
      loadPartnersData()
    }
  }, [filters, isLoaded])

  const loadPartnersData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Obtener todos los partners
      const { data: partners, error: partnersError } = await supabase
        .from("partners")
        .select("id, name, logo_url")
        .eq("is_active", true)

      if (partnersError) throw partnersError

      // Para cada partner, obtener sus oportunidades en el período
      const partnerPromises = partners.map(async (partner) => {
        let query = supabase
          .from("opportunities")
          .select("estimated_value")
          .eq("partner_id", partner.id)
          .gte("created_at", filters.dateRange.from.toISOString())
          .lte("created_at", filters.dateRange.to.toISOString())

        // Aplicar filtro de tech company si existe
        if (filters.techCompanyId) {
          query = query.eq("tech_company_id", filters.techCompanyId)
        }

        const { data: opportunities, error: oppsError } = await query

        if (oppsError) throw oppsError

        const count = opportunities?.length || 0
        const value = opportunities?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0

        return {
          id: partner.id,
          name: partner.name,
          logo_url: partner.logo_url,
          opportunities: count,
          value,
        }
      })

      const results = await Promise.all(partnerPromises)

      // Filtrar partners con actividad y ordenar por valor
      const activePartners = results
        .filter((partner) => partner.opportunities > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

      setPartnersData(activePartners)
    } catch (err) {
      console.error("Error loading partners data:", err)
      setError("Error al cargar datos de partners")
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
          <CardTitle>{t("admin.dashboard.topPartners.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (partnersData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.dashboard.topPartners.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">No hay datos de partners para el período seleccionado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.dashboard.topPartners.title")}</CardTitle>
        <div className="text-sm text-muted-foreground">Top 5 partners por valor de pipeline</div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {partnersData.map((partner, index) => (
            <div key={partner.id} className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {index + 1}
              </div>
              <Avatar className="w-10 h-10">
                <AvatarImage src={partner.logo_url || undefined} alt={partner.name} />
                <AvatarFallback>{partner.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{partner.name}</p>
                <p className="text-sm text-muted-foreground">{partner.opportunities} oportunidades</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(partner.value)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
