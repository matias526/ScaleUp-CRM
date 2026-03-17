"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Edit, Globe, RefreshCw } from "lucide-react"
import Image from "next/image"
import { useTranslations } from "@/hooks/use-translations"
import { TechCompanyService } from "@/lib/services/tech-company-service"
import { TechCompanyPartners } from "@/components/tech-companies/tech-company-partners"
import { TechCompanyUsers } from "@/components/tech-companies/tech-company-users"
import { TechCompanyTasks } from "@/components/tech-companies/tech-company-tasks"

export default function TechCompanyDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { t } = useTranslations()
  const [company, setCompany] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCompany = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await TechCompanyService.getTechCompanyById(params.id)
        if (!data) {
          throw new Error("Empresa no encontrada")
        }
        setCompany(data)
      } catch (err: any) {
        setError(err.message || "Error al cargar la empresa")
        console.error("Error al cargar empresa:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadCompany()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{t("error") || "Error"}</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive text-lg">
                {error || t("tech_company_not_found") || "Empresa no encontrada"}
              </p>
              <Button className="mt-4" onClick={() => router.push("/dashboard/tech-companies")}>
                {t("back_to_list") || "Volver a la lista"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Asegurarse de que los valores sean strings o valores primitivos
  const companyName = typeof company.name === "string" ? company.name : "Sin nombre"
  const logoAlt = typeof company.name === "string" ? `Logo de ${company.name}` : "Logo de la empresa"
  const logoUrl = typeof company.logo_url === "string" ? company.logo_url : "/placeholder.svg"
  const companyCode = typeof company.code === "string" ? company.code : "Sin código"
  const companyWebsite = typeof company.website === "string" ? company.website : ""
  const creationDate = company.created_at ? new Date(company.created_at).toLocaleDateString() : "Desconocida"
  const updateDate = company.updated_at ? new Date(company.updated_at).toLocaleDateString() : "Desconocida"
  const isActive = !!company.is_active

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{companyName}</h1>
          <Badge variant={isActive ? "success" : "destructive"}>
            {isActive ? t("active") || "Activo" : t("inactive") || "Inactivo"}
          </Badge>
        </div>
        <Button onClick={() => router.push(`/dashboard/tech-companies/${company.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          {t("edit") || "Editar"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("tech_company_details") || "Detalles de la empresa tecnológica"}</CardTitle>
          <CardDescription>
            {t("complete_info_about", { name: companyName }) || `Información completa sobre ${companyName}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {logoUrl && (
            <div className="flex justify-center">
              <div className="relative w-40 h-40 rounded-md overflow-hidden border">
                <Image src={logoUrl || "/placeholder.svg"} alt={logoAlt} fill className="object-contain" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">{t("code") || "Código"}</h3>
              <p>{companyCode}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">{t("website") || "Sitio Web"}</h3>
              {companyWebsite ? (
                <a
                  href={companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:underline"
                >
                  <Globe className="mr-1 h-4 w-4" />
                  {companyWebsite}
                </a>
              ) : (
                <p className="text-muted-foreground">{t("not_available") || "No disponible"}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                {t("creation_date") || "Fecha de creación"}
              </h3>
              <p>{creationDate}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                {t("last_update") || "Última actualización"}
              </h3>
              <p>{updateDate}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">{t("status") || "Estado"}</h3>
              <Badge variant={isActive ? "success" : "destructive"}>
                {isActive ? t("active") || "Activo" : t("inactive") || "Inactivo"}
              </Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/dashboard/tech-companies")}>
            {t("back_to_list") || "Volver a la lista"}
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("refresh") || "Actualizar"}
          </Button>
        </CardFooter>
      </Card>

      {/* Cambiar el orden de estos componentes */}
      <TechCompanyPartners techCompanyId={company.id} />
      <TechCompanyUsers techCompanyId={company.id} />
      <TechCompanyTasks techCompanyId={company.id} techCompanyName={companyName} />
    </div>
  )
}
