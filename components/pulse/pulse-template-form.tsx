"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/hooks/use-translations"
import { supabase } from "@/lib/supabase/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2, X } from "lucide-react"

const pulseTemplateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional().nullable(),
  content: z.string().min(1, "El contenido es requerido").min(5, "El contenido debe tener al menos 5 caracteres"),
  variables: z.array(z.string()).optional().nullable(),
})

type PulseTemplateFormData = z.infer<typeof pulseTemplateSchema>

interface PulseTemplateFormProps {
  template?: {
    id: string
    name: string
    description: string | null
    content: string
    variables: string[] | null
  } | null
  onSubmit: () => void
  onCancel: () => void
}

export default function PulseTemplateForm({ template, onSubmit, onCancel }: PulseTemplateFormProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [newVariable, setNewVariable] = useState("")
  const [variables, setVariables] = useState<string[]>(template?.variables || [])

  const form = useForm<PulseTemplateFormData>({
    resolver: zodResolver(pulseTemplateSchema),
    defaultValues: {
      name: template?.name || "",
      description: template?.description || "",
      content: template?.content || "",
      variables: template?.variables || [],
    },
  })

  const handleAddVariable = () => {
    if (newVariable.trim() && !variables.includes(newVariable)) {
      setVariables([...variables, newVariable])
      form.setValue("variables", [...variables, newVariable])
      setNewVariable("")
    }
  }

  const handleRemoveVariable = (varToRemove: string) => {
    const updated = variables.filter((v) => v !== varToRemove)
    setVariables(updated)
    form.setValue("variables", updated)
  }

  const handleSave = async (data: PulseTemplateFormData) => {
    try {
      setLoading(true)
      const payload = {
        ...data,
        variables: variables.length > 0 ? variables : null,
      }

      if (template?.id) {
        // Update existing
        const { error } = await supabase
          .from("pulse_templates")
          .update(payload)
          .eq("id", template.id)
        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase.from("pulse_templates").insert([payload])
        if (error) throw error
      }

      onSubmit()
    } catch (err) {
      console.error("[v0] Error saving pulse template:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("pulse.template_name", "Nombre del Template")}</FormLabel>
              <FormControl>
                <Input placeholder="Mi Template Pulse" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("pulse.template_description", "Descripción (opcional)")}</FormLabel>
              <FormControl>
                <Textarea placeholder="Descripción del template..." {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>{t("pulse.description_hint", "Describe qué hace este template")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Content */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("pulse.template_content", "Contenido del Template")}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Contenido del template con {{variables}}" 
                  {...field} 
                  className="font-mono"
                  rows={8}
                />
              </FormControl>
              <FormDescription>
                {t("pulse.content_hint", "Usa {{variable}} para reemplazos dinámicos")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Variables */}
        <FormItem>
          <FormLabel>{t("pulse.variables", "Variables disponibles")}</FormLabel>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="{{nombre_variable}}"
              value={newVariable}
              onChange={(e) => setNewVariable(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddVariable()}
            />
            <Button type="button" onClick={handleAddVariable} variant="outline">
              {t("common.add", "Agregar")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {variables.map((variable) => (
              <span
                key={variable}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm flex items-center gap-2"
              >
                {variable}
                <button
                  type="button"
                  onClick={() => handleRemoveVariable(variable)}
                  className="hover:text-blue-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </FormItem>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            {t("common.cancel", "Cancelar")}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {template ? t("common.save", "Guardar") : t("common.create", "Crear")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
