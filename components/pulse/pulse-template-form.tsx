"use client"

import { useState } from "react"
import { useTranslation } from "@/hooks/use-translations"
import { supabase } from "@/lib/supabase/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2 } from "lucide-react"
import MultiLanguageEditor from "./multi-language-editor"

const pulseTemplateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional().nullable(),
  content_es: z.string().min(1, "El contenido en español es requerido"),
  content_en: z.string().min(1, "El contenido en inglés es requerido"),
  content_pt: z.string().min(1, "El contenido en portugués es requerido"),
})

type PulseTemplateFormData = z.infer<typeof pulseTemplateSchema>

interface PulseTemplateFormProps {
  template?: {
    id: string
    name: string
    description: string | null
    content_es: string
    content_en: string
    content_pt: string
  } | null
  onSubmit: () => void
  onCancel: () => void
}

export default function PulseTemplateForm({ template, onSubmit, onCancel }: PulseTemplateFormProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [multiLangContent, setMultiLangContent] = useState({
    es: template?.content_es || "",
    en: template?.content_en || "",
    pt: template?.content_pt || "",
  })

  const form = useForm<PulseTemplateFormData>({
    resolver: zodResolver(pulseTemplateSchema),
    defaultValues: {
      name: template?.name || "",
      description: template?.description || "",
      content_es: template?.content_es || "",
      content_en: template?.content_en || "",
      content_pt: template?.content_pt || "",
    },
  })

  const handleSave = async (data: PulseTemplateFormData) => {
    try {
      setLoading(true)

      const payload = {
        name: data.name,
        description: data.description || null,
        content_es: multiLangContent.es,
        content_en: multiLangContent.en,
        content_pt: multiLangContent.pt,
      }

      console.log("[v0] Guardando template:", payload)

      if (template?.id) {
        // Update existing
        const { error } = await supabase
          .from("pulse_message_templates")
          .update(payload)
          .eq("id", template.id)
        if (error) throw error
        console.log("[v0] Template actualizado")
      } else {
        // Create new
        const { error } = await supabase
          .from("pulse_message_templates")
          .insert([payload])
        if (error) throw error
        console.log("[v0] Template creado")
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
      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("pulse.template_name", "Nombre del Template")}</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Bienvenida Oportunidad Tech" {...field} />
              </FormControl>
              <FormDescription>
                {t("pulse.name_hint", "Un nombre descriptivo para identificar rápidamente el template")}
              </FormDescription>
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
                <Textarea 
                  placeholder="Describe cuándo y cómo se usa este template..." 
                  {...field} 
                  value={field.value || ""} 
                  className="resize-none"
                  rows={2}
                />
              </FormControl>
              <FormDescription>
                {t("pulse.description_hint", "Proporciona contexto para otros usuarios")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Multi-Language Content Editor */}
        <div>
          <FormLabel className="block mb-4">{t("pulse.template_content", "Contenido del Template")}</FormLabel>
          <MultiLanguageEditor
            content={multiLangContent}
            onChange={setMultiLangContent}
            disabled={loading}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            {t("common.cancel", "Cancelar")}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {template ? t("common.save", "Guardar Cambios") : t("common.create", "Crear Template")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
