"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/hooks/use-translations"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Edit2, Copy, Loader2, Globe, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import PulseTemplateForm from "./pulse-template-form"
import { getActiveTechCompaniesClient } from "@/lib/services/tech-company-service-client"
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

export default function PulseTemplateManager() {
  const { t } = useTranslation()
  const [templates, setTemplates] = useState<PulseTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PulseTemplate | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copying, setCopying] = useState<string | null>(null)
  
  // Filtros
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterTechCompany, setFilterTechCompany] = useState<string>("all")
  const [techCompanies, setTechCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)

  useEffect(() => {
    fetchTemplates()
    fetchTechCompanies()
  }, [])

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

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      console.log("[v0] Trayendo templates...")

      const { data, error } = await supabase
        .from("pulse_message_templates")
        .select(
          `
          id,
          internal_code,
          category,
          tech_company_id,
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

      const { error } = await supabase.from("pulse_message_templates").delete().eq("id", deletingId)
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
      const { data: newTemplateData, error: templateError } = await supabase
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

      const { error: translationsError } = await supabase
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

  // Filtrar templates basado en categoría y tech_company
  const filteredTemplates = templates.filter((template) => {
    const categoryMatch = filterCategory === "all" || template.category === filterCategory
    const companyMatch = filterTechCompany === "all" || template.tech_company_id === filterTechCompany
    return categoryMatch && companyMatch
  })

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">{t("pulse.templates_list", "Plantillas de Mensaje")}</h2>
          <p className="text-sm text-gray-600">
            {t("pulse.description", "Gestiona templates reutilizables para Pulse en múltiples idiomas con inserción atómica")}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("pulse.create_template", "Crear Template")}
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium block mb-2">Categoría</label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las categorías" />
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

        <div className="flex-1">
          <label className="text-sm font-medium block mb-2">Empresa Tecnológica</label>
          <Select value={filterTechCompany} onValueChange={setFilterTechCompany} disabled={loadingCompanies}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las empresas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las empresas</SelectItem>
              <SelectItem value="null">Sin empresa asignada</SelectItem>
              {techCompanies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(filterCategory !== "all" || filterTechCompany !== "all") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilterCategory("all")
              setFilterTechCompany("all")
            }}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingTemplate
                  ? t("pulse.edit_template", "Editar Template")
                  : t("pulse.create_template", "Crear Template Nuevo")}
              </CardTitle>
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

      {/* Templates List */}
      {loading ? (
        <Card>
          <CardContent className="py-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {templates.length === 0
                ? t("pulse.no_templates", "No hay templates creados todavía")
                : t("pulse.no_results", "No hay templates que coincidan con los filtros")}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {templates.length === 0
                ? t("pulse.create_first_template", "Crea tu primer template para comenzar")
                : t("pulse.adjust_filters", "Ajusta los filtros e intenta de nuevo")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTemplates.map((template) => {
            const esTranslation = template.translations.find((tr) => tr.language_code === "es")

            return (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-3">
                        <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">{template.internal_code}</span>
                        <span className="flex gap-1">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">ES</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">EN</span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">PT</span>
                        </span>
                      </CardTitle>
                      {esTranslation && <CardDescription className="mt-2">{esTranslation.display_name}</CardDescription>}
                      <p className="text-xs text-gray-500 mt-1">
                        Categoría: <span className="font-semibold">{template.category}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyTemplate(template)}
                        disabled={copying === template.id}
                        title={t("common.copy", "Copiar")}
                      >
                        {copying === template.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template)
                          setShowForm(true)
                        }}
                        title={t("common.edit", "Editar")}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingId(template.id)}
                        className="text-red-600 hover:bg-red-50"
                        title={t("common.delete", "Eliminar")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Preview ES */}
                  {esTranslation && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">Asunto (ES)</p>
                      <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 max-h-16 overflow-y-auto">
                        {esTranslation.subject}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
