"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
// Importar el hook de traducciones
import { useTranslations } from "@/hooks/use-translations"
import PartnersTable from "@/components/partners/partners-table"
import { PartnerService } from "@/lib/services/partner-service"
import type { Partner } from "@/types"
import { useAuth } from "@/components/auth/auth-provider"

export default function PartnersPage() {
  const router = useRouter()
  const [partners, setPartners] = useState<Partner[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPartners, setTotalPartners] = useState(0)
  const pageSize = 10
  // Añadir el hook de traducciones
  const { t } = useTranslations()
  // Usar el hook de autenticación para obtener la información del usuario
  const { userInfo } = useAuth()

  // Debounce search term para evitar demasiadas consultas
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Función para cargar partners optimizada con useCallback
  const loadPartners = useCallback(async () => {
    try {
      setIsLoading(true)
      console.log("Cargando partners con userInfo:", userInfo ? { id: userInfo.id, roleCode: userInfo.roleCode } : null)

      // Limitar los campos que se solicitan para mejorar el rendimiento
      if (debouncedSearchTerm) {
        const searchResults = await PartnerService.searchPartners(
          debouncedSearchTerm,
          userInfo ? { id: userInfo.id, roleCode: userInfo.roleCode } : undefined,
        )
        setPartners(searchResults)
        setTotalPartners(searchResults.length)
      } else {
        const { data, total } = await PartnerService.getPartners(
          page,
          pageSize,
          userInfo ? { id: userInfo.id, roleCode: userInfo.roleCode } : undefined,
        )
        setPartners(data)
        setTotalPartners(total)
      }
    } catch (error) {
      console.error("Error loading partners:", error)
      setPartners([])
      setTotalPartners(0)
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, debouncedSearchTerm, userInfo])

  // Cargar partners cuando cambie la página, el término de búsqueda o la información del usuario
  useEffect(() => {
    loadPartners()
  }, [loadPartners])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPage(1) // Reset to first page on new search
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("partners")}</h1>
        <Button onClick={() => router.push("/dashboard/partners/create")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("new_partner")}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{t("partners_list")}</CardTitle>
          <CardDescription>{t("manage_partners_description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("search_partners")}
                className="pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <Button variant="outline" onClick={loadPartners} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {t("refresh")}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <PartnersTable partners={partners} onDelete={loadPartners} />

              {/* Paginación simplificada */}
              {!debouncedSearchTerm && totalPartners > pageSize && (
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    {`${partners.length} ${t("of")} ${totalPartners} ${t("partners").toLowerCase()}`}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * pageSize >= totalPartners}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
