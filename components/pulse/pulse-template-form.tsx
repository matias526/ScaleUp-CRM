"use client"

import { useState, useEffect } from "react"
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
import { DICT_LANG_PULSE } from "@/lib/constants/dict-lang-pulse"
import { getActiveTechCompaniesClient } from "@/lib/services/tech-company-service-client"

// Validación más flexible: solo requiere español, el resto puede estar vacío inicialmente
const pulseTemplateSchema = z.object({
  internal_code: z
    .string()
    .min(1, "El código interno es requerido")
    .min(3, "Mínimo 3 caracteres")
    .regex(/^[A-Z0-9_]+$/, "Solo mayúsculas, números y guiones bajos"),
  category: z.string().min(1, "La categoría es requerida"),
  tech_company_id: z.string().optional().nullable(),
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
  { value: "metodologia", label: "Metodologia" },
  { value: "posteos_redes", label: "Posteos en Redes" },
  { value: "campanas", label: "Campañas" },
  { value: "noticias", label: "Noticias" },
]

interface PulseTemplateFormProps {
  template?: {
    id: string
    internal_code: string
    category: string
    tech_company_id: string | null
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
  const { t, currentLanguage } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState("es")
  const [translating, setTranslating] = useState(false)
  const [techCompanies, setTechCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)

  // Helper para traducción local usando diccionario
  const tPulse = (key: string, defaultValue: string = ""): string => {
    const dict = DICT_LANG_PULSE[key as keyof typeof DICT_LANG_PULSE]
    if (dict) {
      return dict[currentLanguage as keyof typeof dict] || dict.es || defaultValue
    }
    return defaultValue
  }

  const defaultValues = {
    internal_code: template?.internal_code || "",
    category: template?.category || "metodologia",
    tech_company_id: template?.tech_company_id || null,
    display_name_es: brToNewlines(template?.translations.find((tr) => tr.language_code === "es")?.display_name || ""),
    subject_es: brToNewlines(template?.translations.find((tr) => tr.language_code === "es")?.subject || ""),
    body_content_es: brToNewlines(template?.translations.find((tr) => tr.language_code === "es")?.body_content || ""),
    display_name_en: brToNewlines(template?.translations.find((tr) => tr.language_code === "en")?.display_name || ""),
    subject_en: brToNewlines(template?.translations.find((tr) => tr.language_code === "en")?.subject || ""),
    body_content_en: brToNewlines(template?.translations.find((tr) => tr.language_code === "en")?.body_content || ""),
    display_name_pt: brToNewlines(template?.translations.find((tr) => tr.language_code === "pt")?.display_name || ""),
    subject_pt: brToNewlines(template?.translations.find((tr) => tr.language_code === "pt")?.subject || ""),
    body_content_pt: brToNewlines(template?.translations.find((tr) => tr.language_code === "pt")?.body_content || ""),
  }

  const form = useForm<PulseTemplateFormData>({
    resolver: zodResolver(pulseTemplateSchema),
    defaultValues,
    mode: "onChange",
  })

  // Cargar tech_companies activas al montar el componente
  useEffect(() => {
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

    fetchTechCompanies()
  }, [])

  // Función mejorada para proteger variables y formato
  const protectContent = (text: string) => {
    const map = new Map<string, string>()
    let counter = 0

    // Proteger saltos de línea [BR]
    let protected_text = text.replace(/\[BR\]/g, (match) => {
      const placeholder = `__PULSEBR_${counter}__`
      map.set(placeholder, match)
      counter++
      return placeholder
    })

    // Proteger variables {{variable_name}}
    protected_text = protected_text.replace(/\{\{[^}]+\}\}/g, (match) => {
      const placeholder = `__PULSEVAR_${counter}__`
      map.set(placeholder, match)
      counter++
      return placeholder
    })

    // Proteger tags de formato [B], [I], [U], [/B], [/I], [/U]
    protected_text = protected_text.replace(/\[[BIU]\]|\[\/[BIU]\]/g, (match) => {
      const placeholder = `__PULSEFMT_${counter}__`
      map.set(placeholder, match)
      counter++
      return placeholder
    })

    console.log("[v0] Contenido protegido:", { original: text, protected: protected_text, map: Array.from(map.entries()) })

    return { protected: protected_text, map }
  }

  const restoreContent = (text: string, map: Map<string, string>) => {
    let restored = text
    map.forEach((original, placeholder) => {
      restored = restored.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), original)
    })
    return restored
  }

  // Convertir [BR] a saltos de línea reales para edición
  const brToNewlines = (text: string): string => {
    return text.replaceAll("[BR]", "\n")
  }

  // Convertir saltos de línea reales a [BR] para almacenamiento
  const newlinesToBr = (text: string): string => {
    return text.replaceAll("\n", "[BR]")
  }

  // Auto-traducción usando Groq - traduce DESDE el idioma actual a los otros dos
  const handleAutoTranslate = async () => {
    try {
      setTranslating(true)

      // Determinar idioma fuente y idiomas destino
      const sourceLanguage = currentTab
      const targetLanguages = {
        es: [
          { code: "en", name: "English" },
          { code: "pt", name: "Portuguese (Brazil)" },
        ],
        en: [
          { code: "es", name: "Spanish" },
          { code: "pt", name: "Portuguese (Brazil)" },
        ],
        pt: [
          { code: "es", name: "Spanish" },
          { code: "en", name: "English" },
        ],
      }[sourceLanguage] || []

      console.log(`[v0] Traduciendo desde ${sourceLanguage} a:`, targetLanguages.map((t) => t.code))

      // Obtener textos del idioma fuente y convertir \n a [BR] antes de enviar
      const sourceTexts = {
        display_name: form.getValues(`display_name_${sourceLanguage}`).replace(/\n/g, "[BR]"),
        subject: form.getValues(`subject_${sourceLanguage}`).replace(/\n/g, "[BR]"),
        body_content: form.getValues(`body_content_${sourceLanguage}`).replace(/\n/g, "[BR]"),
      }

      console.log("[v0] Textos fuente:", sourceTexts)

      // Proteger contenido
      const protectedTexts = Object.entries(sourceTexts).reduce(
        (acc, [key, text]) => {
          acc[key] = protectContent(text)
          return acc
        },
        {} as Record<string, ReturnType<typeof protectContent>>,
      )

      // Traducir a cada idioma destino
      for (const targetLang of targetLanguages) {
        try {
          console.log(`[v0] Iniciando traducción a ${targetLang.code}...`)

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
              targetLanguage: targetLang.name,
            }),
          })

          if (!response.ok) throw new Error(`Error translating to ${targetLang.code}`)

          const { translations } = await response.json()
          console.log(`[v0] Traducción a ${targetLang.code} recibida:`, translations)

          // Restaurar contenido protegido
          const restoredTranslations = Object.entries(translations).reduce(
            (acc, [key, text]) => {
              const restored = restoreContent(text as string, protectedTexts[key].map)
              acc[`${key}_${targetLang.code}`] = restored
              console.log(`[v0] ${key}_${targetLang.code} restaurado:`, restored)
              return acc
            },
            {} as Record<string, string>,
          )

          // Actualizar campos del formulario - convertir [BR] a saltos de línea reales
          Object.entries(restoredTranslations).forEach(([fieldName, value]) => {
            // Convertir [BR] a \n para que se vea como saltos de línea en la interfaz
            const displayValue = brToNewlines(value as string)
            form.setValue(fieldName, displayValue)
          })

          console.log(`[v0] Traducción a ${targetLang.code} completada`)
        } catch (err) {
          console.error(`[v0] Error traduciendo a ${targetLang.code}:`, err)
          alert(`Error al traducir a ${targetLang.name}: ${err instanceof Error ? err.message : "Error desconocido"}`)
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
            display_name: newlinesToBr(data.display_name_es),
            subject: newlinesToBr(data.subject_es),
            body_content: newlinesToBr(data.body_content_es),
          },
          ...(hasEN
            ? [
                {
                  language_code: "en",
                  display_name: newlinesToBr(data.display_name_en),
                  subject: newlinesToBr(data.subject_en),
                  body_content: newlinesToBr(data.body_content_en),
                },
              ]
            : []),
          ...(hasPT
            ? [
                {
                  language_code: "pt",
                  display_name: newlinesToBr(data.display_name_pt),
                  subject: newlinesToBr(data.subject_pt),
                  body_content: newlinesToBr(data.body_content_pt),
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
              tech_company_id: data.tech_company_id || null,
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
            display_name: newlinesToBr(data.display_name_es),
            subject: newlinesToBr(data.subject_es),
            body_content: newlinesToBr(data.body_content_es),
          },
          ...(hasEN
            ? [
                {
                  template_id: templateId,
                  language_code: "en",
                  display_name: newlinesToBr(data.display_name_en),
                  subject: newlinesToBr(data.subject_en),
                  body_content: newlinesToBr(data.body_content_en),
                },
              ]
            : []),
          ...(hasPT
            ? [
                {
                  template_id: templateId,
                  language_code: "pt",
                  display_name: newlinesToBr(data.display_name_pt),
                  subject: newlinesToBr(data.subject_pt),
                  body_content: newlinesToBr(data.body_content_pt),
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
        {/* Internal Code, Category y Empresa Tecnológica */}
        <div className="grid grid-cols-3 gap-4">
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

          <FormField
            control={form.control}
            name="tech_company_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa Tecnológica (opcional)</FormLabel>
                <Select
                  value={field.value || "none"}
                  onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                  disabled={loading || loadingCompanies}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una empresa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sin empresa</SelectItem>
                    {techCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Aplica este template solo a una empresa específica</FormDescription>
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
              disabled={
                translating ||
                loading ||
                !form.getValues(`body_content_${currentTab}`) ||
                !form.getValues(`display_name_${currentTab}`) ||
                !form.getValues(`subject_${currentTab}`)
              }
              size="sm"
              variant="outline"
              className="gap-2"
            >
              {translating && <Loader2 className="h-4 w-4 animate-spin" />}
              Auto-Traducir desde{" "}
              {currentTab === "es" ? "Español" : currentTab === "en" ? "Inglés" : "Portugués"}
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
