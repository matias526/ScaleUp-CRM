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
import { Loader2, Upload, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SafeEditor from "./safe-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DICT_LANG_PULSE } from "@/lib/constants/dict-lang-pulse"
import { getActiveTechCompaniesClient } from "@/lib/services/tech-company-service-client"

  // Función para renderizar preview del contenido
  const renderPreview = (content: string): React.ReactNode[] => {
    const lines = content.split(/\[BR\]/)
    return lines.map((line, idx) => (
      <div key={idx} className="mb-2 last:mb-0">
        {renderLine(line)}
      </div>
    ))
  }

  // Renderizar una línea procesando tags
  const renderLine = (line: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    const regex = /\[B\](.*?)\[\/B\]|\[I\](.*?)\[\/I\]|\[U\](.*?)\[\/U\]|\[IMG\](.*?)\[\/IMG\]|\{\{[^}]+\}\}/g
    let match

    while ((match = regex.exec(line)) !== null) {
      // Agregar texto antes del match
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index))
      }

      if (match[1] !== undefined) {
        // [B]...[/B]
        parts.push(
          <strong key={`b-${match.index}`} className="font-bold">
            {match[1]}
          </strong>
        )
      } else if (match[2] !== undefined) {
        // [I]...[/I]
        parts.push(
          <em key={`i-${match.index}`} className="italic">
            {match[2]}
          </em>
        )
      } else if (match[3] !== undefined) {
        // [U]...[/U]
        parts.push(
          <u key={`u-${match.index}`} className="underline">
            {match[3]}
          </u>
        )
      } else if (match[4] !== undefined) {
        // [IMG]...[/IMG]
        parts.push(
          <img
            key={`img-${match.index}`}
            src={match[4]}
            alt="Imagen del template"
            className="max-w-full max-h-48 rounded my-2"
          />
        )
      } else if (match[0].startsWith("{{")) {
        // {{variable}}
        parts.push(
          <span key={`var-${match.index}`} className="bg-yellow-100 px-1 rounded font-mono text-sm">
            {match[0]}
          </span>
        )
      }

      lastIndex = regex.lastIndex
    }

    // Agregar texto restante
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex))
    }

    return parts.length > 0 ? parts : [line]
  }

// Convertir saltos de línea reales a [BR] para almacenamiento
const newlinesToBr = (text: string): string => {
  return text.replaceAll("\n", "[BR]")
}

// Función para procesar y validar archivos adjuntos (cualquier tipo)
const processAttachmentFile = async (file: File): Promise<{ 
  id: string
  file: File
  name: string
  size: number
} | null> => {
  try {
    // Validar tamaño máximo 50MB para documentos
    if (file.size > 50 * 1024 * 1024) {
      alert("El archivo no debe superar 50MB")
      return null
    }

    return {
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
    }
  } catch (error) {
    console.error("[v0] Error procesando archivo:", error)
    return null
  }
}

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
  const [previewMode, setPreviewMode] = useState(false)
  
  // Adjuntos del template (documentos con selector de idioma)
  const [pendingAttachments, setPendingAttachments] = useState<Array<{ 
    id: string
    file: File
    name: string
    size: number
    language: "global" | "es" | "en" | "pt"
  }>>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [previewImage, setPreviewImage] = useState<{ id: string; url: string; name: string } | null>(null)

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

  // Función para subir archivos adjuntos de forma transaccional
  const uploadPendingAttachments = async (templateId: string): Promise<void> => {
    if (pendingAttachments.length === 0) {
      console.log("[v0] No hay adjuntos pendientes")
      return
    }

    console.log(`[v0] Subiendo ${pendingAttachments.length} adjuntos para template ${templateId}`)

    try {
      for (const attachment of pendingAttachments) {
        // Subir archivo a Supabase Storage
        const fileExt = attachment.file.name.split(".").pop()
        const fileName = `${templateId}/${attachment.id}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from("pulse-assets")
          .upload(`attachments/${fileName}`, attachment.file)

        if (uploadError) {
          throw new Error(`Error subiendo archivo ${attachment.name}: ${uploadError.message}`)
        }

        console.log(`[v0] Archivo subido: attachments/${fileName}`)

        // Obtener URL pública
        const { data } = supabase.storage.from("pulse-assets").getPublicUrl(`attachments/${fileName}`)
        const publicUrl = data.publicUrl

        // Crear registro en pulse_message_attachments
        const { data: attachmentData, error: attachmentError } = await supabase
          .from("pulse_message_attachments")
          .insert([
            {
              file_name: attachment.name,
              file_path: `attachments/${fileName}`,
              file_size: attachment.size,
              public_url: publicUrl,
              language_code: attachment.language,
            },
          ])
          .select()
          .single()

        if (attachmentError) throw attachmentError

        // Crear relación en pulse_template_attachments_join
        const { error: joinError } = await supabase
          .from("pulse_template_attachments_join")
          .insert([
            {
              template_id: templateId,
              attachment_id: attachmentData.id,
            },
          ])

        if (joinError) throw joinError

        console.log(`[v0] Adjunto registrado en BD: ${attachment.name}`)
      }

      // Limpiar attachments pendientes después de subir exitosamente
      setPendingAttachments([])
      console.log("[v0] Todos los adjuntos subidos exitosamente")
    } catch (error) {
      console.error("[v0] Error subiendo adjuntos:", error)
      throw error
    }
  }

  // Función para reemplazar blob URLs con URLs reales en el contenido
  const replaceBlobUrlsInContent = (
    content: string,
    blobToUrlMap: Map<string, string>
  ): string => {
    let updatedContent = content
    blobToUrlMap.forEach((realUrl, blobUrl) => {
      updatedContent = updatedContent.replaceAll(blobUrl, realUrl)
    })
    return updatedContent
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

      // Subir adjuntos pendientes si existen
      const templateId = template?.id || templateData?.id
      if (templateId && pendingAttachments.length > 0) {
        console.log("[v0] Iniciando subida de adjuntos...")
        await uploadPendingAttachments(templateId)
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
                        onAddImage={(imageUrl) => {
                          const tag = `[IMG]${imageUrl}[/IMG]`
                          field.onChange(field.value + "\n" + tag)
                        }}
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
                        onAddImage={(imageUrl) => {
                          const tag = `[IMG]${imageUrl}[/IMG]`
                          field.onChange(field.value + "\n" + tag)
                        }}
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
                        onAddImage={(imageUrl) => {
                          const tag = `[IMG]${imageUrl}[/IMG]`
                          field.onChange(field.value + "\n" + tag)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Section */}
        <div className="border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="gap-2"
          >
            {previewMode ? "Ocultar" : "Ver"} Preview
          </Button>

          {previewMode && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold mb-2 text-sm">Preview - {currentTab === "es" ? "Español" : currentTab === "en" ? "Inglés" : "Portugués"}</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Display Name:</p>
                  <p className="bg-white p-2 rounded">{form.getValues(`display_name_${currentTab}`)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Subject:</p>
                  <p className="bg-white p-2 rounded">{form.getValues(`subject_${currentTab}`)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Body Content:</p>
                  <div className="bg-white p-2 rounded space-y-1">{renderPreview(form.getValues(`body_content_${currentTab}`))}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Attachments Management */}
        <div className="border-t pt-4 space-y-4">
          <h3 className="font-semibold">Gestión de Adjuntos</h3>
          <FormDescription>Carga documentos (PDF, DOC, etc.) que se enviarán con el mensaje. Especifica el idioma para cada adjunto.</FormDescription>

          <div className="space-y-3">
            {pendingAttachments.length > 0 && (
              <div className="space-y-2 mb-4">
                {pendingAttachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{attachment.name}</p>
                      <p className="text-xs text-gray-600">{(attachment.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Select
                      value={attachment.language}
                      onValueChange={(lang) => {
                        setPendingAttachments((prev) =>
                          prev.map((att) => (att.id === attachment.id ? { ...att, language: lang as any } : att))
                        )
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">Global</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">Inglés</SelectItem>
                        <SelectItem value="pt">Portugués</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingAttachments((prev) => prev.filter((att) => att.id !== attachment.id))}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <Upload className="h-4 w-4" />
              <span className="text-sm font-medium">Cargar Adjunto</span>
              <input
                type="file"
                multiple
                onChange={async (e) => {
                  if (e.target.files) {
                    setUploadingFile(true)
                    for (const file of e.target.files) {
                      const processed = await processAttachmentFile(file)
                      if (processed) {
                        setPendingAttachments((prev) => [...prev, { ...processed, language: "global" }])
                      }
                    }
                    setUploadingFile(false)
                  }
                }}
                disabled={uploadingFile || loading}
                className="hidden"
              />
            </label>
            {uploadingFile && <Loader2 className="h-4 w-4 animate-spin inline" />}
          </div>
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
