"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlusCircle, Search, Eye, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { useDebounce } from "@/hooks/use-debounce"
import { useTranslations } from "@/hooks/use-translations"
import { TechCompanyService, type TechCompany } from "@/lib/services/tech-company-service"

export default function TechCompaniesTable() {
  const router = useRouter()
  const [techCompanies, setTechCompanies] = useState<TechCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const { t } = useTranslations()

  useEffect(() => {
    const fetchTechCompanies = async () => {
      setLoading(true)
      try {
        const data = await TechCompanyService.getTechCompanies(debouncedSearchTerm)
        setTechCompanies(data)
      } catch (error) {
        console.error("Error fetching tech companies:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTechCompanies()
  }, [debouncedSearchTerm])

  const handleDelete = async (id: string) => {
    if (
      confirm(
        t(
          "tech_companies.delete.confirm",
          "¿Estás seguro de que deseas eliminar esta empresa tecnológica? Esta acción no se puede deshacer.",
        ),
      )
    ) {
      try {
        const success = await TechCompanyService.deleteTechCompany(id)
        if (success) {
          setTechCompanies(techCompanies.filter((company) => company.id !== id))
        }
      } catch (error) {
        console.error("Error deleting tech company:", error)
      }
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <CardTitle>{t("tech_companies.list.title", "Empresas Tecnológicas")}</CardTitle>
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("common.search", "Buscar...")}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button asChild>
            <Link href="/dashboard/tech-companies/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("tech_companies.create.button", "Añadir Empresa Tecnológica")}
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-24 items-center justify-center">
            <p className="text-muted-foreground">{t("common.loading", "Cargando...")}</p>
          </div>
        ) : techCompanies.length === 0 ? (
          <div className="flex h-24 flex-col items-center justify-center space-y-2">
            <p className="text-muted-foreground">
              {searchTerm
                ? t(
                    "tech_companies.list.no_results",
                    "No se encontraron empresas tecnológicas que coincidan con tu búsqueda.",
                  )
                : t("tech_companies.list.empty", "No se encontraron empresas tecnológicas. ¡Crea tu primera empresa!")}
            </p>
            {searchTerm ? null : (
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/tech-companies/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t("tech_companies.create.button", "Añadir Empresa Tecnológica")}
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tech_companies.fields.logo", "Logo")}</TableHead>
                  <TableHead>{t("tech_companies.fields.name", "Nombre")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("tech_companies.fields.website", "Sitio Web")}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">{t("tech_companies.fields.status", "Estado")}</TableHead>
                  <TableHead className="text-right">{t("common.actions", "Acciones")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {techCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md">
                        <ImageWithFallback
                          src={company.logo_url || "/placeholder.svg?height=40&width=40&query=company"}
                          alt={company.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 object-contain"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/tech-companies/${company.id}`} className="hover:underline">
                        {company.name}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {company.website ? (
                        <a
                          href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {company.website}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={company.is_active ? "success" : "destructive"}>
                        {company.is_active
                          ? t("tech_companies.status.active", "Activo")
                          : t("tech_companies.status.inactive", "Inactivo")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild title={t("common.view", "Ver")}>
                          <Link href={`/dashboard/tech-companies/${company.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">{t("common.view", "Ver")}</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title={t("common.edit", "Editar")}>
                          <Link href={`/dashboard/tech-companies/${company.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">{t("common.edit", "Editar")}</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(company.id)}
                          title={t("common.delete", "Eliminar")}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{t("common.delete", "Eliminar")}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
