"use client"

import { useState } from "react"
import { useTranslation } from "@/hooks/use-translations"
import { supabase } from "@/lib/supabase/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SafeEditor from "./safe-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Validación más flexible: solo requiere español, el resto puede estar vacío inicialmente
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
  display_name_en: z.string().default(""),
  subject_en: z.string().default(""),
  body_content_en: z.string().default(""),
  display_name_pt: z.string().default(""),
  subject_pt: z.string().default(""),
  body_content_pt: z.string().default(""),
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
  const [translating, setTranslating] = useState(false)

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
    mode: "onChange",
  })

  // Función para traducir contenido protegiendo variables y formato
  const protectContent = (text: string) => {
    const map = new Map<string, string>()
    let counter = 0

    let protected_text = text.replace(/\{\{[^}]+\}\}/g, (match) => {
      const placeholder = `__VAR_${counter}__`
      map.set(placeholder, match)
      counter++
      return placeholder
    })

    protected_text = protected_text.replace(/\[[BIU]\]|\[\/[BIU]\]/g, (match) => {
      const placeholder = `__FORMAT_${counter}__`
      map.set(placeholder, match)
      counter++
      return placeholder
    })

    return { protected: protected_text, map }
  }

  const restoreContent = (text: string, map: Map<string, string>) => {
    let restored = text
    map.forEach((original, placeholder) => {
      restored = restored.replace(new RegExp(placeholder, "g"), original)
    })
    return restored
  }

  // Auto-traducción usando Groq
  const handleAutoTranslate = async () => {
    try {
      setTranslating(true)
      console.log("[v0] Iniciando auto-traducción desde español...")

      const sourceTexts = {
        display_name: form.getValues("display_name_es"),
        subject: form.getValues("subject_es"),
        body_content: form.getValues("body_content_es"),
      }

      // Proteger contenido
      const protectedTexts = Object.entries(sourceTexts).reduce(
        (acc, [key, text]) => {
          acc[key] = protectContent(text)
          return acc
        },
        {} as Record<string, ReturnType<typeof protectContent>>,
      )

      console.log("[v0] Contenido protegido:", Object.keys(protectedTexts))

      // Llamar a Groq para traducir cada idioma
      const languagePairs = [
        { target: "en", targetName: "English" },
        { target: "pt", targetName: "Portuguese (Brazil)" },
      ]

      for (const pair of languagePairs) {
        try {
          const response = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              texts: Object.entries(protectedTexts).reduce(
                (acc, [key, { protected: text }]) => {
                  acc[key] = text
                  return acc
                },
                {} as Record<string, string>,
              ),
              targetLanguage: pair.targetName,
            }),
          })

          if (!response.ok) throw new Error(`Error translating to ${pair.target}`)

          const { translations } = await response.json()
          console.log(`[v0] Traducción a ${pair.target}:`, translations)

          // Restaurar contenido protegido
          const restoredTranslations = Object.entries(translations).reduce(
            (acc, [key, text]) => {
              acc[`${key}_${pair.target}`] = restoreContent(text as string, protectedTexts[key].map)
              return acc
            },
            {} as Record<string, string>,
          )

          // Actualizar los campos del formulario
          form.setValue(`display_name_${pair.target}`, restoredTranslations[`display_name_${pair.target}`])
          form.setValue(`subject_${pair.target}`, restoredTranslations[`subject_${pair.target}`])
          form.setValue(`body_content_${pair.target}`, restoredTranslations[`body_content_${pair.target}`])
        } catch (err) {
          console.error(`[v0] Error traduciendo a ${pair.target}:`, err)
        }
      }

      console.log("[v0] Auto-traducción completada")
    } catch (error) {
      console.error("[v0] Error en auto-traducción:", error)
      alert("Error en la auto-traducción. Revisa la consola.")
    } finally {
      setTranslating(false)
    }
  }

  const handleSave = async (data: PulseTemplateFormData) => {
    try {
      setLoading(true)
      console.log("[v0] Valores enviados:", data)

      // Validar que al menos EN o PT tengan contenido
      const hasEN = data.display_name_en && data.subject_en && data.body_content_en
      const hasPT = data.display_name_pt && data.subject_pt && data.body_content_pt

      if (!hasEN && !hasPT) {
        alert("Debes traducir a al menos Inglés o Portugués")
        return
      }

      if (template?.id) {
        // UPDATE
        console.log("[v0] Actualizando template:", template.id)

        const translations = [
          {
            language_code: "es",
            display_name: data.display_name_es,
            subject: data.subject_es,
            body_content: data.body_content_es,
          },
          ...(hasEN
            ? [
                {
                  language_code: "en",
                  display_name: data.display_name_en,
                  subject: data.subject_en,
                  body_content: data.body_content_en,
                },
              ]
            : []),
          ...(hasPT
            ? [
                {
                  language_code: "pt",
                  display_name: data.display_name_pt,
                  subject: data.subject_pt,
                  body_content: data.body_content_pt,
                },
              ]
            : []),
        ]

        for (const translation of translations) {
          const { error } = await supabase
            .from("pulse_message_template_translations")
            .update(translation)
            .eq("template_id", template.id)
            .eq("language_code", translation.language_code)

          if (error) throw error
        }

        console.log("[v0] Template actualizado")
      } else {
        // CREATE
        console.log("[v0] Creando nuevo template")

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

        const templateId = templateData.id
        const translations = [
          {
            template_id: templateId,
            language_code: "es",
            display_name: data.display_name_es,
            subject: data.subject_es,
            body_content: data.body_content_es,
          },
          ...(hasEN
            ? [
                {
                  template_id: templateId,
                  language_code: "en",
                  display_name: data.display_name_en,
                  subject: data.subject_en,
                  body_content: data.body_content_en,
                },
              ]
            : []),
          ...(hasPT
            ? [
                {
                  template_id: templateId,
                  language_code: "pt",
                  display_name: data.display_name_pt,
                  subject: data.subject_pt,
                  body_content: data.body_content_pt,
                },
              ]
            : []),
        ]

        const { error: translationsError } = await supabase
          .from("pulse_message_template_translations")
          .insert(translations)

        if (translationsError) throw translationsError
        console.log("[v0] Traducciones insertadas")
      }

      console.log("[v0] Guardado exitoso, llamando onSubmit")
      onSubmit()
    } catch (err) {
      console.error("[v0] Error saving pulse template:", err)
      alert(`Error: ${err instanceof Error ? err.message : "Error desconocido"}`)
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
                <FormLabel>Código Interno</FormLabel>
                <FormControl>
                  <Input
                    placeholder="WELCOME_TECH_OPP"
                    {...field}
                    disabled={!!template || loading}
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
                <FormLabel>Categoría</FormLabel>
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

        {/* Multi-Language Editor Tabs */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Contenido por Idioma</h3>
            <Button
              type="button"
              onClick={handleAutoTranslate}
              disabled={translating || loading || !form.getValues("body_content_es")}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              {translating && <Loader2 className="h-4 w-4 animate-spin" />}
              Auto-Traducir desde Español
            </Button>
          </div>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="es" disabled={loading}>
                Español (ES)
              </TabsTrigger>
              <TabsTrigger value="en" disabled={loading}>
                English (EN)
              </TabsTrigger>
              <TabsTrigger value="pt" disabled={loading}>
                Português (PT)
              </TabsTrigger>
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
                      <SafeEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Contenido del mensaje en español..."
                        disabled={loading}
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
                    <FormDescription>Se auto-rellena con la traducción desde Español</FormDescription>
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
                      <SafeEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Message content in English..."
                        disabled={loading}
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
                    <FormDescription>Se auto-rellena con la traducción desde Español</FormDescription>
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
                      <SafeEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Conteúdo da mensagem em português..."
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {template ? "Guardar Cambios" : "Crear Template"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
