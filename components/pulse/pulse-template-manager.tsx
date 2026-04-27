"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/hooks/use-translations"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Edit2, Copy, Loader2, Globe, X, Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import PulseTemplateForm from "./pulse-template-form"
import { getActiveTechCompaniesClient } from "@/lib/services/tech-company-service-client"
import { UserService } from "@/lib/services/user-service"
import { useDebounce } from "@/hooks/use-debounce"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PulseTemplate {
  id: string
  internal_code: string
  category: string
  tech_company_id: string | null
  user_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  translations: {
    language_code: string
    display_name: string
    subject: string
    body_content: string
  }[]
}

const CATEGORIES = [
  { value: "metodologia", label: "Metodologia" },
  { value: "posteos_redes", label: "Posteos en Redes" },
  { value: "campanas", label: "Campañas" },
  { value: "noticias", label: "Noticias" },
]

const CATEGORY_COLORS: Record<string, string> = {
  metodologia: "bg-blue-100 text-blue-800",
  posteos_redes: "bg-purple-100 text-purple-800",
  campanas: "bg-green-100 text-green-800",
  noticias: "bg-orange-100 text-orange-800",
}

export default function PulseTemplateManager() {
  const { t } = useTranslation()
  const [templates, setTemplates] = useState<PulseTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PulseTemplate | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copying, setCopying] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Filtros
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterTechCompany, setFilterTechCompany] = useState<string>("all")
  const [filterAuthor, setFilterAuthor] = useState<string>("all")
  const [techCompanies, setTechCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [authors, setAuthors] = useState<Array<{ id: string; name: string }>>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [loadingAuthors, setLoadingAuthors] = useState(true)

  useEffect(() => {
    fetchTemplates()
    fetchTechCompanies()
    fetchAuthors()
  }, [])

  useEffect(() => {
    if (debouncedSearchTerm || filterCategory !== "all" || filterTechCompany !== "all") {
      // Ya se filtra en el computed
    }
  }, [debouncedSearchTerm, filterCategory, filterTechCompany])

  const fetchTechCompanies = async () => {
    try {
      setLoadingCompanies(true)
      const companies = await getActiveTechCompaniesClient()
      setTechCompanies(companies)
    } catch (error) {
      console.error("[v0] Error al cargar tech_companies:", error)
    } finally {
      setLoadingCompanies(false)
    }
  }

  const fetchAuthors = async () => {
    try {
      setLoadingAuthors(true)
      const users = await UserService.getUsersByRoles(["Admin", "BDD", "Marketing"])
      console.log("[v0] Usuarios obtenidos:", users)
      const authorsList = users.map((user) => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
      }))
      console.log("[v0] Lista de autores formateada:", authorsList)
      setAuthors(authorsList)
    } catch (error) {
      console.error("[v0] Error al cargar autores:", error)
    } finally {
      setLoadingAuthors(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      console.log("[v0] Trayendo templates...")

      const { data, error } = await (supabase as any)
        .from("pulse_message_templates")
        .select(
          `
          id,
          internal_code,
          category,
          tech_company_id,
          user_id,
          is_active,
          created_at,
          updated_at,
          pulse_message_template_translations (
            language_code,
            display_name,
            subject,
            body_content
          )
        `,
        )
        .order("created_at", { ascending: false })

      if (error) throw error

      const templates = (data || []).map((template: any) => ({
        ...template,
        translations: template.pulse_message_template_translations || [],
      }))

      console.log("[v0] Templates trayidos:", templates)
      setTemplates(templates)
    } catch (err) {
      console.error("[v0] Error fetching pulse templates:", err)
      alert(`Error al traer templates: ${err instanceof Error ? err.message : "Error desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async () => {
    if (!deletingId) return

    try {
      console.log("[v0] Eliminando template:", deletingId)

      const { error } = await supabase.from("pulse_message_templates" as any).delete().eq("id", deletingId)
      if (error) throw error

      setTemplates(templates.filter((t) => t.id !== deletingId))
      setDeletingId(null)
      console.log("[v0] Template eliminado")
    } catch (err) {
      console.error("[v0] Error deleting pulse template:", err)
      alert(`Error al eliminar: ${err instanceof Error ? err.message : "Error desconocido"}`)
    }
  }

  const handleCopyTemplate = async (template: PulseTemplate) => {
    try {
      setCopying(template.id)
      console.log("[v0] Copiando template:", template.id)

      // 1. Crear nuevo template
      const { data: newTemplateData, error: templateError } = await (supabase as any)
        .from("pulse_message_templates")
        .insert([
          {
            internal_code: `${template.internal_code}_COPY`,
            category: template.category,
            is_active: true,
          },
        ])
        .select()
        .single()

      if (templateError) throw templateError

      // 2. Copiar traducciones
      const newTranslations = template.translations.map((tr) => ({
        template_id: newTemplateData.id,
        language_code: tr.language_code,
        display_name: `${tr.display_name} (Copia)`,
        subject: tr.subject,
        body_content: tr.body_content,
      }))

      const { error: translationsError } = await (supabase as any)
        .from("pulse_message_template_translations")
        .insert(newTranslations)

      if (translationsError) throw translationsError

      console.log("[v0] Template copiado exitosamente")
      await fetchTemplates()
    } catch (err) {
      console.error("[v0] Error copying pulse template:", err)
      alert(`Error al copiar: ${err instanceof Error ? err.message : "Error desconocido"}`)
    } finally {
      setCopying(null)
    }
  }

  const handleTemplateSubmit = async () => {
    console.log("[v0] Template guardado, actualizando lista")
    setEditingTemplate(null)
    setShowForm(false)
    await fetchTemplates()
  }

  // Filtrar templates basado en categoría, tech_company, autor y búsqueda
  const filteredTemplates = templates.filter((template) => {
    const categoryMatch = filterCategory === "all" || template.category === filterCategory
    const companyMatch = filterTechCompany === "all" || template.tech_company_id === filterTechCompany
    const authorMatch =
      filterAuthor === "all" ||
      (filterAuthor === "sistema" && template.user_id === null) ||
      (filterAuthor !== "sistema" && template.user_id === filterAuthor)
    const esTranslation = template.translations.find((tr) => tr.language_code === "es")
    const searchMatch =
      !debouncedSearchTerm ||
      template.internal_code.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      esTranslation?.display_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      esTranslation?.subject.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    return categoryMatch && companyMatch && authorMatch && searchMatch
  })

  return (
    <Card>
      {/* Card Header */}
      <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 pb-4">
        <div>
          <CardTitle>{t("pulse.templates_list", "Plantillas de Mensaje")}</CardTitle>
          <CardDescription className="mt-1">
            {t("pulse.description", "Gestiona templates reutilizables para Pulse en múltiples idiomas")}
          </CardDescription>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("pulse.create_template", "Crear Template")}
        </Button>
      </CardHeader>

      {/* Filters */}
      <CardContent className="border-t border-b border-slate-200 py-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 block mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder={t("common.search", "Buscar por código o nombre...")}
                className="pl-8 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 block mb-2">Categoría</label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Company Filter */}
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 block mb-2">Empresa</label>
            <Select value={filterTechCompany} onValueChange={setFilterTechCompany} disabled={loadingCompanies}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empresas</SelectItem>
                <SelectItem value="null">Sin empresa</SelectItem>
                {techCompanies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Author Filter */}
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 block mb-2">Origen/Autor</label>
            <Select value={filterAuthor} onValueChange={setFilterAuthor} disabled={loadingAuthors}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los orígenes</SelectItem>
                <SelectItem value="sistema">Sistema</SelectItem>
                {authors.map((author) => (
                  <SelectItem key={author.id} value={author.id}>
                    {author.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters Button */}
          {(filterCategory !== "all" || filterTechCompany !== "all" || filterAuthor !== "all" || searchTerm) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterCategory("all")
                setFilterTechCompany("all")
                setFilterAuthor("all")
                setSearchTerm("")
              }}
              className="gap-2 h-9"
            >
              <X className="h-4 w-4" />
              Limpiar
            </Button>
          )}
        </div>
      </CardContent>

      {/* Modal de Formulario */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowForm(false)
            setEditingTemplate(null)
          }}
        >
          <Card
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="p-0 border-0">
            </CardHeader>
            <CardContent>
              <PulseTemplateForm
                template={editingTemplate}
                onSubmit={handleTemplateSubmit}
                onCancel={() => {
                  setShowForm(false)
                  setEditingTemplate(null)
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Dialog */}
      {deletingId && (
        <AlertDialog open={!!deletingId}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("common.confirm_delete", "¿Confirmar eliminación?")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  "pulse.delete_template_description",
                  "Esta acción no se puede deshacer. El template y todas sus traducciones serán eliminados permanentemente.",
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-red-600">
              {t("common.delete", "Eliminar")}
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setDeletingId(null)}>{t("common.cancel", "Cancelar")}</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Tabla de Templates */}
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center space-y-2">
            <Globe className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500 font-medium">
              {templates.length === 0
                ? t("pulse.no_templates", "No hay templates creados todavía")
                : t("pulse.no_results", "No hay templates que coincidan con los filtros")}
            </p>
            <p className="text-xs text-slate-400">
              {templates.length === 0
                ? t("pulse.create_first_template", "Crea tu primer template para comenzar")
                : t("pulse.adjust_filters", "Ajusta los filtros e intenta de nuevo")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-600">Código</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-600">Nombre</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-600 hidden md:table-cell">Categoría</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-600 hidden lg:table-cell">Idiomas</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-600 hidden lg:table-cell">Empresa</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-600 hidden md:table-cell">Origen/Autor</TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wide text-slate-600">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => {
                  const esTranslation = template.translations.find((tr) => tr.language_code === "es")
                  const categoryData = CATEGORIES.find((cat) => cat.value === template.category)
                  const hasAll3Languages = ["es", "en", "pt"].every((lang) =>
                    template.translations.some((tr) => tr.language_code === lang)
                  )
                  const techCompany = techCompanies.find((tc) => tc.id === template.tech_company_id)

                  return (
                    <TableRow key={template.id} className="hover:bg-slate-50">
                      <TableCell>
                        <code className="bg-slate-100 px-2.5 py-1 rounded text-xs font-medium text-slate-700">
                          {template.internal_code}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{esTranslation?.display_name || "Sin nombre"}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{esTranslation?.subject || ""}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className={CATEGORY_COLORS[template.category] || "bg-slate-100 text-slate-800"}>
                          {categoryData?.label || template.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex gap-1">
                          {["es", "en", "pt"].map((lang) => {
                            const hasLang = template.translations.some((tr) => tr.language_code === lang)
                            return (
                              <span
                                key={lang}
                                className={`px-2 py-0.5 rounded text-xs font-semibold ${hasLang ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
                                  }`}
                              >
                                {lang.toUpperCase()}
                              </span>
                            )
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-slate-600">
                          {techCompany?.name || <span className="text-slate-400">-</span>}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {template.user_id === null ? (
                          <Badge className="bg-slate-200 text-slate-800 hover:bg-slate-200">
                            Sistema
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-600">
                            {authors.find((a) => a.id === template.user_id)?.name || "-"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyTemplate(template)}
                            disabled={copying === template.id}
                            title={t("common.copy", "Copiar")}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                          >
                            {copying === template.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTemplate(template)
                              setShowForm(true)
                            }}
                            title={t("common.edit", "Editar")}
                            className="h-8 w-8 p-0 hover:bg-amber-50 hover:text-amber-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingId(template.id)}
                            title={t("common.delete", "Eliminar")}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
