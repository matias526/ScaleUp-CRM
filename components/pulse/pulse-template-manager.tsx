"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/hooks/use-translations"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Edit2, Copy, Loader2, Globe } from "lucide-react"
import PulseTemplateForm from "./pulse-template-form"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface PulseTemplate {
  id: string
  name: string
  description: string | null
  content_es: string
  content_en: string
  content_pt: string
  created_at: string
  updated_at: string
}

export default function PulseTemplateManager() {
  const { t } = useTranslation()
  const [templates, setTemplates] = useState<PulseTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PulseTemplate | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copying, setCopying] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("pulse_message_templates")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setTemplates(data || [])
      console.log("[v0] Templates cargados:", data)
    } catch (err) {
      console.error("[v0] Error fetching pulse templates:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async () => {
    if (!deletingId) return

    try {
      const { error } = await supabase
        .from("pulse_message_templates")
        .delete()
        .eq("id", deletingId)
      if (error) throw error
      setTemplates(templates.filter((t) => t.id !== deletingId))
      setDeletingId(null)
      console.log("[v0] Template eliminado")
    } catch (err) {
      console.error("[v0] Error deleting pulse template:", err)
    }
  }

  const handleCopyTemplate = async (template: PulseTemplate) => {
    try {
      setCopying(template.id)
      const newTemplate = {
        name: `${template.name} (Copia)`,
        description: template.description,
        content_es: template.content_es,
        content_en: template.content_en,
        content_pt: template.content_pt,
      }

      const { data, error } = await supabase
        .from("pulse_message_templates")
        .insert([newTemplate])
        .select()
      if (error) throw error
      if (data) {
        setTemplates([data[0], ...templates])
        console.log("[v0] Template copiado")
      }
    } catch (err) {
      console.error("[v0] Error copying pulse template:", err)
    } finally {
      setCopying(null)
    }
  }

  const handleTemplateSubmit = async () => {
    setEditingTemplate(null)
    setShowForm(false)
    await fetchTemplates()
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">{t("pulse.templates_list", "Plantillas de Mensaje")}</h2>
          <p className="text-sm text-gray-600">{t("pulse.description", "Gestiona templates reutilizables para Pulse en múltiples idiomas")}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("pulse.create_template", "Crear Template")}
        </Button>
      </div>

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingTemplate ? t("pulse.edit_template", "Editar Template") : t("pulse.create_template", "Crear Template Nuevo")}</CardTitle>
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
                {t("pulse.delete_template_description", "Esta acción no se puede deshacer. El template y todas sus versiones de idioma será eliminado permanentemente.")}
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
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t("pulse.no_templates", "No hay templates creados todavía")}</p>
            <p className="text-sm text-gray-400 mt-2">{t("pulse.create_first_template", "Crea tu primer template para comenzar")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.name}
                      <span className="text-xs font-normal text-gray-500 flex gap-1">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">ES</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">EN</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">PT</span>
                      </span>
                    </CardTitle>
                    {template.description && <CardDescription className="mt-1">{template.description}</CardDescription>}
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
                {/* Preview de contenido en español */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Versión Español (ES)</p>
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 max-h-20 overflow-y-auto whitespace-pre-wrap break-words">
                    {template.content_es.substring(0, 150)}
                    {template.content_es.length > 150 ? "..." : ""}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PulseTemplateManager() {
  const { t } = useTranslation()
  const [templates, setTemplates] = useState<PulseTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PulseTemplate | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copying, setCopying] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("pulse_templates")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (err) {
      console.error("[v0] Error fetching pulse templates:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async () => {
    if (!deletingId) return

    try {
      const { error } = await supabase.from("pulse_templates").delete().eq("id", deletingId)
      if (error) throw error
      setTemplates(templates.filter((t) => t.id !== deletingId))
      setDeletingId(null)
    } catch (err) {
      console.error("[v0] Error deleting pulse template:", err)
    }
  }

  const handleCopyTemplate = async (template: PulseTemplate) => {
    try {
      setCopying(template.id)
      const newTemplate = {
        name: `${template.name} (Copy)`,
        description: template.description,
        content: template.content,
        variables: template.variables,
      }

      const { data, error } = await supabase.from("pulse_templates").insert([newTemplate]).select()
      if (error) throw error
      if (data) {
        setTemplates([data[0], ...templates])
      }
    } catch (err) {
      console.error("[v0] Error copying pulse template:", err)
    } finally {
      setCopying(null)
    }
  }

  const handleTemplateSubmit = async () => {
    setEditingTemplate(null)
    setShowForm(false)
    await fetchTemplates()
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">{t("pulse.description", "Gestiona templates reutilizables para Pulse")}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("pulse.create_template", "Crear Template")}
        </Button>
      </div>

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingTemplate ? t("pulse.edit_template", "Editar Template") : t("pulse.create_template", "Crear Template")}</CardTitle>
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
                {t("pulse.delete_template_description", "Esta acción no se puede deshacer. El template será eliminado permanentemente.")}
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
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">{t("pulse.no_templates", "No hay templates creados todavía")}</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.description && <CardDescription>{template.description}</CardDescription>}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyTemplate(template)}
                      disabled={copying === template.id}
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
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingId(template.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-3 rounded text-sm font-mono text-gray-700 max-h-32 overflow-y-auto">
                  {template.content}
                </div>
                {template.variables && template.variables.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1">{t("pulse.variables", "Variables disponibles")}:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable) => (
                        <span key={variable} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
