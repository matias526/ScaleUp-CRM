"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "@/hooks/use-translations"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  createOpportunityTechFieldClient,
  updateOpportunityTechFieldClient,
} from "@/lib/services/opportunity-tech-field-service-client"
import { ArrowLeft, Plus, Trash2, FileText } from "lucide-react"
import Link from "next/link"

interface CustomFieldFormProps {
  techCompanies: any[]
  field?: any
}

export function CustomFieldForm({ techCompanies, field }: CustomFieldFormProps) {
  const { t } = useTranslations()
  const { toast } = useToast()
  const router = useRouter()

  // Agregar log para depuración
  useEffect(() => {
    console.log("CustomFieldForm received techCompanies:", techCompanies)
  }, [techCompanies])

  const [formData, setFormData] = useState({
    tech_company_id: field?.tech_company_id || "",
    field_name: field?.field_name || "",
    field_type: field?.field_type || "text",
    is_required: field?.is_required || false,
    options: field?.options ? [...field.options] : [],
    file_config: field?.file_config || {
      allowed_types: ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png"],
      max_size: 5, // en MB
    },
  })

  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState({
    techCompaniesCount: techCompanies?.length || 0,
    techCompaniesData: techCompanies || [],
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleOptionChange = (index: number, field: string, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setFormData((prev) => ({ ...prev, options: newOptions }))
  }

  const handleFileConfigChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      file_config: {
        ...prev.file_config,
        [field]: value,
      },
    }))
  }

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { value: "", label: "" }],
    }))
  }

  const removeOption = (index: number) => {
    const newOptions = [...formData.options]
    newOptions.splice(index, 1)
    setFormData((prev) => ({ ...prev, options: newOptions }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("FORM: Iniciando envío del formulario con datos:", formData)

    if (!formData.tech_company_id || !formData.field_name || !formData.field_type) {
      console.log("FORM: Validación fallida - campos requeridos faltantes")
      toast({
        title: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    // Validar opciones para tipos select y multiselect
    if (
      (formData.field_type === "select" || formData.field_type === "multiselect") &&
      (!formData.options.length || formData.options.some((opt) => !opt.value || !opt.label))
    ) {
      console.log("FORM: Validación fallida - opciones incompletas")
      toast({
        title: "Por favor completa todas las opciones correctamente",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      console.log("FORM: Iniciando proceso de guardado...")

      const fieldData = {
        tech_company_id: formData.tech_company_id,
        field_name: formData.field_name,
        field_type: formData.field_type,
        is_required: formData.is_required,
        options: formData.field_type === "select" || formData.field_type === "multiselect" ? formData.options : null,
        file_config: formData.field_type === "file" ? formData.file_config : null,
      }

      console.log("FORM: Datos preparados para envío:", fieldData)

      if (field) {
        console.log("FORM: Actualizando campo existente...")
        const result = await updateOpportunityTechFieldClient(field.id, fieldData)
        console.log("FORM: Resultado de actualización:", result)
        toast({
          title: t("opportunity_tech_fields.success_update"),
          variant: "default",
        })
      } else {
        console.log("FORM: Creando nuevo campo...")
        const result = await createOpportunityTechFieldClient(fieldData)
        console.log("FORM: Resultado de creación:", result)
        toast({
          title: t("opportunity_tech_fields.success_create"),
          variant: "default",
        })
      }

      console.log("FORM: Redirigiendo a la página principal...")
      router.push("/dashboard/settings/custom-fields")
      router.refresh()
    } catch (error: any) {
      console.error("FORM ERROR:", error)
      toast({
        title: field ? t("opportunity_tech_fields.error_update") : t("opportunity_tech_fields.error_create"),
        description: error.message || "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const needsOptions = formData.field_type === "select" || formData.field_type === "multiselect"
  const isFileType = formData.field_type === "file"

  return (
    <Card>
      <CardContent className="p-6">
        {/* Información de depuración */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-medium mb-2">Información de depuración:</h3>
          <p>Número de empresas tecnológicas recibidas: {debugInfo.techCompaniesCount}</p>
          <details>
            <summary className="cursor-pointer text-sm text-blue-600">Ver datos completos</summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(debugInfo.techCompaniesData, null, 2)}
            </pre>
          </details>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center mb-6">
            <Button type="button" variant="ghost" size="sm" asChild className="mr-2">
              <Link href="/dashboard/settings/custom-fields">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("opportunity_tech_fields.back")}
              </Link>
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tech_company_id">{t("opportunity_tech_fields.tech_company")} *</Label>
                <Select
                  value={formData.tech_company_id}
                  onValueChange={(value) => handleSelectChange("tech_company_id", value)}
                  disabled={!!field}
                >
                  <SelectTrigger id="tech_company_id">
                    <SelectValue placeholder={t("opportunity_tech_fields.select_tech_company")} />
                  </SelectTrigger>
                  <SelectContent>
                    {techCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="field_name">{t("opportunity_tech_fields.field_name")} *</Label>
                <Input id="field_name" name="field_name" value={formData.field_name} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="field_type">{t("opportunity_tech_fields.field_type")} *</Label>
                <Select
                  value={formData.field_type}
                  onValueChange={(value) => handleSelectChange("field_type", value)}
                  disabled={!!field}
                >
                  <SelectTrigger id="field_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">{t("opportunity_tech_fields.field_type.text")}</SelectItem>
                    <SelectItem value="number">{t("opportunity_tech_fields.field_type.number")}</SelectItem>
                    <SelectItem value="select">{t("opportunity_tech_fields.field_type.select")}</SelectItem>
                    <SelectItem value="multiselect">{t("opportunity_tech_fields.field_type.multiselect")}</SelectItem>
                    <SelectItem value="date">{t("opportunity_tech_fields.field_type.date")}</SelectItem>
                    <SelectItem value="boolean">{t("opportunity_tech_fields.field_type.boolean")}</SelectItem>
                    <SelectItem value="file">{t("opportunity_tech_fields.field_type.file")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="is_required"
                  checked={formData.is_required}
                  onCheckedChange={(checked) => handleSwitchChange("is_required", checked)}
                />
                <Label htmlFor="is_required">{t("opportunity_tech_fields.is_required")}</Label>
              </div>
            </div>

            {needsOptions && (
              <div className="space-y-4 border p-4 rounded-md">
                <div className="flex items-center justify-between">
                  <Label>{t("opportunity_tech_fields.options")}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("opportunity_tech_fields.add_option")}
                  </Button>
                </div>

                {formData.options.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No hay opciones. Haz clic en "Añadir opción" para agregar una.
                  </div>
                )}

                {formData.options.map((option, index) => (
                  <div key={index} className="grid gap-4 sm:grid-cols-2 items-center">
                    <div className="space-y-2">
                      <Label htmlFor={`option-value-${index}`}>{t("opportunity_tech_fields.option_value")}</Label>
                      <Input
                        id={`option-value-${index}`}
                        value={option.value}
                        onChange={(e) => handleOptionChange(index, "value", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`option-label-${index}`}>{t("opportunity_tech_fields.option_label")}</Label>
                      <div className="flex space-x-2">
                        <Input
                          id={`option-label-${index}`}
                          value={option.label}
                          onChange={(e) => handleOptionChange(index, "label", e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{t("opportunity_tech_fields.remove_option")}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isFileType && (
              <div className="space-y-4 border p-4 rounded-md">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-500" />
                  <Label className="text-lg font-medium">{t("opportunity_tech_fields.file_types")}</Label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="max_size">{t("opportunity_tech_fields.file_size")} (MB)</Label>
                    <Input
                      id="max_size"
                      type="number"
                      min="1"
                      max="50"
                      value={formData.file_config.max_size}
                      onChange={(e) => handleFileConfigChange("max_size", Number.parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("opportunity_tech_fields.file_types")}</Label>
                    <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                      {["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "txt"].map((type) => (
                        <div key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`file-type-${type}`}
                            className="mr-1"
                            checked={formData.file_config.allowed_types.includes(type)}
                            onChange={(e) => {
                              const newTypes = e.target.checked
                                ? [...formData.file_config.allowed_types, type]
                                : formData.file_config.allowed_types.filter((t) => t !== type)
                              handleFileConfigChange("allowed_types", newTypes)
                            }}
                          />
                          <label htmlFor={`file-type-${type}`} className="text-sm">
                            .{type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/settings/custom-fields")}>
              {t("opportunity_tech_fields.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : t("opportunity_tech_fields.save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
