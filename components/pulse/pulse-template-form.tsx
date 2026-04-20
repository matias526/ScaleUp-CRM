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
import { Loader2, Zap } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const pulseTemplateSchema = z.object({
  internal_code: z
    .string()
    .min(1, "El código interno es requerido")
    .min(3, "Mínimo 3 caracteres")
    .regex(/^[A-Z0-9_]+$/, "Solo mayúsculas, números y guiones bajos"),
  category: z.string().min(1, "La categoría es requerida"),
  display_name_es: z.string().min(1, "El nombre en español es requerido"),
  subject_es: z.string().min(1, "El asunto en español es requerido"),
  body_content_es: z.string().min(1, "El contenido en español es requerido"),
  display_name_en: z.string().min(1, "El nombre en inglés es requerido"),
  subject_en: z.string().min(1, "El asunto en inglés es requerido"),
  body_content_en: z.string().min(1, "El contenido en inglés es requerido"),
  display_name_pt: z.string().min(1, "El nombre en portugués es requerido"),
  subject_pt: z.string().min(1, "El asunto en portugués es requerido"),
  body_content_pt: z.string().min(1, "El contenido en portugués es requerido"),
})

type PulseTemplateFormData = z.infer<typeof pulseTemplateSchema>

const CATEGORIES = [
  { value: "opportunities", label: "Oportunidades" },
  { value: "partners", label: "Socios" },
  { value: "contacts", label: "Contactos" },
  { value: "tech_companies", label: "Empresas Tech" },
  { value: "end_customers", label: "Clientes Finales" },
]

interface PulseTemplateFormProps {
  template?: {
    id: string
    internal_code: string
    category: string
    translations: {
      language_code: string
      display_name: string
      subject: string
      body_content: string
    }[]
  } | null
  onSubmit: () => void
  onCancel: () => void
}

export default function PulseTemplateForm({ template, onSubmit, onCancel }: PulseTemplateFormProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState("es")

  const defaultValues = {
    internal_code: template?.internal_code || "",
    category: template?.category || "opportunities",
    display_name_es: template?.translations.find((tr) => tr.language_code === "es")?.display_name || "",
    subject_es: template?.translations.find((tr) => tr.language_code === "es")?.subject || "",
    body_content_es: template?.translations.find((tr) => tr.language_code === "es")?.body_content || "",
    display_name_en: template?.translations.find((tr) => tr.language_code === "en")?.display_name || "",
    subject_en: template?.translations.find((tr) => tr.language_code === "en")?.subject || "",
    body_content_en: template?.translations.find((tr) => tr.language_code === "en")?.body_content || "",
    display_name_pt: template?.translations.find((tr) => tr.language_code === "pt")?.display_name || "",
    subject_pt: template?.translations.find((tr) => tr.language_code === "pt")?.subject || "",
    body_content_pt: template?.translations.find((tr) => tr.language_code === "pt")?.body_content || "",
  }

  const form = useForm<PulseTemplateFormData>({
    resolver: zodResolver(pulseTemplateSchema),
    defaultValues,
  })

  const handleSave = async (data: PulseTemplateFormData) => {
    try {
      setLoading(true)
      console.log("[v0] Iniciando guardado de template:", data)

      if (template?.id) {
        // UPDATE: Solo actualizar traducciones
        console.log("[v0] Actualizando template existente:", template.id)

        const translations = [
          {
            language_code: "es",
            display_name: data.display_name_es,
            subject: data.subject_es,
            body_content: data.body_content_es,
          },
          {
            language_code: "en",
            display_name: data.display_name_en,
            subject: data.subject_en,
            body_content: data.body_content_en,
          },
          {
            language_code: "pt",
            display_name: data.display_name_pt,
            subject: data.subject_pt,
            body_content: data.body_content_pt,
          },
        ]

        // Actualizar cada traducción
        for (const translation of translations) {
          const { error } = await supabase
            .from("pulse_message_template_translations")
            .update(translation)
            .eq("template_id", template.id)
            .eq("language_code", translation.language_code)

          if (error) throw error
        }

        console.log("[v0] Template actualizado exitosamente")
      } else {
        // CREATE: Operación atómica - Insertar en ambas tablas
        console.log("[v0] Creando nuevo template")

        // 1. Insertar template principal
        const { data: templateData, error: templateError } = await supabase
          .from("pulse_message_templates")
          .insert([
            {
              internal_code: data.internal_code,
              category: data.category,
              is_active: true,
            },
          ])
          .select()
          .single()

        if (templateError) throw templateError
        console.log("[v0] Template creado:", templateData)

        // 2. Insertar traducciones (una por cada idioma)
        const templateId = templateData.id
        const translations = [
          {
            template_id: templateId,
            language_code: "es",
            display_name: data.display_name_es,
            subject: data.subject_es,
            body_content: data.body_content_es,
          },
          {
            template_id: templateId,
            language_code: "en",
            display_name: data.display_name_en,
            subject: data.subject_en,
            body_content: data.body_content_en,
          },
          {
            template_id: templateId,
            language_code: "pt",
            display_name: data.display_name_pt,
            subject: data.subject_pt,
            body_content: data.body_content_pt,
          },
        ]

        const { error: translationsError } = await supabase
          .from("pulse_message_template_translations")
          .insert(translations)

        if (translationsError) throw translationsError
        console.log("[v0] Traducciones insertadas exitosamente")
      }

      console.log("[v0] Guardado completado, llamando onSubmit")
      onSubmit()
    } catch (err) {
      console.error("[v0] Error saving pulse template:", err)
      alert(`Error al guardar: ${err instanceof Error ? err.message : "Error desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
        {/* Internal Code y Category */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="internal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("pulse.internal_code", "Código Interno")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder="WELCOME_TECH_OPP"
                    {...field}
                    disabled={!!template}
                    className="font-mono text-sm"
                  />
                </FormControl>
                <FormDescription>Ej: WELCOME_TECH_OPP (único, no editable después)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("pulse.category", "Categoría")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Multi-Language Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="es">Español (ES)</TabsTrigger>
            <TabsTrigger value="en">English (EN)</TabsTrigger>
            <TabsTrigger value="pt">Português (PT)</TabsTrigger>
          </TabsList>

          {/* Español */}
          <TabsContent value="es" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="display_name_es"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Mostrable</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Bienvenida Oportunidad Tech" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject_es"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asunto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Nueva Oportunidad {{opportunity_name}}" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body_content_es"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenido</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contenido del mensaje..."
                      {...field}
                      disabled={loading}
                      rows={6}
                      className="font-mono text-sm resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* English */}
          <TabsContent value="en" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="display_name_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g.: Welcome Tech Opportunity" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g.: New Opportunity {{opportunity_name}}" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body_content_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Message content..."
                      {...field}
                      disabled={loading}
                      rows={6}
                      className="font-mono text-sm resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Português */}
          <TabsContent value="pt" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="display_name_pt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Exibição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Bem-vindo Oportunidade Tech" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject_pt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assunto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Nova Oportunidade {{opportunity_name}}" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body_content_pt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Conteúdo da mensagem..."
                      {...field}
                      disabled={loading}
                      rows={6}
                      className="font-mono text-sm resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

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
