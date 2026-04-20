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

// Convertir [BR] a saltos de línea reales para edición
const brToNewlines = (text: string): string => {
  return text.replaceAll("[BR]", "\n")
}

// Convertir saltos de línea reales a [BR] para almacenamiento
const newlinesToBr = (text: string): string => {
  return text.replaceAll("\n", "[BR]")
}


// Función para renderizar preview del contenido
// Soporta tanto \n como [BR], y procesa [B], [I], [U], [IMG], {{variables}}
const renderPreview = (content: string): React.ReactNode => {
  // Normalizar: convertir \n a [BR] si existen, luego split
  const normalized = content.replaceAll("\n", "[BR]")
  const lines = normalized.split("[BR]")

  const result: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Renderizar la línea con formato
    if (line || i === 0) {
      // Incluso líneas vacías pueden contener imágenes
      const formattedLine = renderFormattedLine(line, i)
      result.push(
        <div key={`line-${i}`} className="whitespace-pre-wrap break-words">
          {formattedLine}
        </div>
      )
    }

    // Agregar <br /> después de cada línea (excepto la última)
    if (i < lines.length - 1) {
      result.push(<br key={`br-${i}`} />)
    }
  }

  return result
}

// Renderizar una línea individual procesando etiquetas
// Orden de prioridad: 1) [BR] (ya hecho), 2) [IMG], 3) [B/I/U], 4) {{variables}}, 5) texto plano
const renderFormattedLine = (line: string, baseKey: number): React.ReactNode[] => {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let componentCounter = 0

  // Regex MEJORADO con grupos nombrados (en orden de prioridad)
  // Grupo 1: [IMG]url[/IMG]
  // Grupo 2: [B]text[/B]
  // Grupo 3: [I]text[/I]
  // Grupo 4: [U]text[/U]
  // Grupo 5: {{variable}}
  const regex = /\[IMG\](.*?)\[\/IMG\]|\[B\](.*?)\[\/B\]|\[I\](.*?)\[\/I\]|\[U\](.*?)\[\/U\]|\{\{([^}]*)\}\}/g
  let match

  while ((match = regex.exec(line)) !== null) {
    // Agregar texto plano ANTES del match (IMPORTANTE: no filtrar con trim)
    if (match.index > lastIndex) {
      const plainText = line.substring(lastIndex, match.index)
      if (plainText) {
        parts.push(plainText)
      }
    }

    const key = `line-${baseKey}-elem-${componentCounter++}`

    if (match[1] !== undefined) {
      // [IMG]url[/IMG]
      const imgUrl = match[1]
      parts.push(
        <img
          key={key}
          src={imgUrl}
          alt="Imagen del mensaje"
          className="max-w-full max-h-80 rounded my-2 block"
          onError={() => {
            console.warn("[v0] Error cargando imagen:", imgUrl)
          }}
        />
      )
    } else if (match[2] !== undefined) {
      // [B]text[/B]
      parts.push(
        <strong key={key} className="font-bold">
          {match[2]}
        </strong>
      )
    } else if (match[3] !== undefined) {
      // [I]text[/I]
      parts.push(
        <em key={key} className="italic">
          {match[3]}
        </em>
      )
    } else if (match[4] !== undefined) {
      // [U]text[/U]
      parts.push(
        <u key={key} className="underline">
          {match[4]}
        </u>
      )
    } else if (match[5] !== undefined) {
      // {{variable}} - SIEMPRE MOSTRAR CON RESALTADO
      const variableName = match[5]
      parts.push(
        <span
          key={key}
          className="bg-blue-100 text-blue-700 px-1 rounded font-mono text-sm whitespace-nowrap"
          title="Campo dinámico que se reemplazará al enviar"
        >
          {`{{${variableName}}}`}
        </span>
      )
    }

    lastIndex = regex.lastIndex
  }

  // Agregar texto RESTANTE (IMPORTANTE: preservar TODO)
  if (lastIndex < line.length) {
    const remaining = line.substring(lastIndex)
    if (remaining) {
      parts.push(remaining)
    }
  }

  // Si la línea estaba vacía, retornar espacio vacío para preservar altura
  return parts.length > 0 ? parts : [" "]
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

  // Adjuntos del template (documentos con selector de idioma)
  const [pendingAttachments, setPendingAttachments] = useState<Array<{
    id: string
    file: File
    name: string
    size: number
    language: "all" | "es" | "en" | "pt"
  }>>([])
  const [existingAttachments, setExistingAttachments] = useState<Array<{
    id: string
    file_name: string
    file_url: string
    file_type: string
    file_size: number
    language_code: "all" | "es" | "en" | "pt"
  }>>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [previewImage, setPreviewImage] = useState<{ id: string; url: string; name: string } | null>(null)
  const [loadingAttachments, setLoadingAttachments] = useState(false)

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

  // Cargar adjuntos existentes cuando se abre un template para editar
  useEffect(() => {
    if (!template?.id) return

    const fetchAttachments = async () => {
      try {
        setLoadingAttachments(true)
        console.log("[v0] Cargando adjuntos para template:", template.id)

        // Obtener adjuntos relacionados con este template
        const { data, error } = await supabase
          .from("pulse_template_attachments_join")
          .select("attachment_id, language_code, pulse_message_attachments(*)")
          .eq("template_id", template.id)

        if (error) throw error

        console.log("[v0] Adjuntos encontrados:", data)

        // Mapear los datos a nuestro formato
        const attachments = data?.map((row: any) => ({
          id: row.pulse_message_attachments.id,
          file_name: row.pulse_message_attachments.file_name,
          file_url: row.pulse_message_attachments.file_url,
          file_type: row.pulse_message_attachments.file_type,
          file_size: row.pulse_message_attachments.file_size,
          language_code: row.language_code,
        })) || []

        setExistingAttachments(attachments)
      } catch (error) {
        console.error("[v0] Error al cargar adjuntos:", error)
      } finally {
        setLoadingAttachments(false)
      }
    }

    fetchAttachments()
  }, [template?.id])

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
        const fileUrl = data.publicUrl

        // Obtener tipo de archivo del MIME type
        const fileType = attachment.file.type || "application/octet-stream"

        // Crear registro en pulse_message_attachments (sin language_code aquí)
        const { data: attachmentData, error: attachmentError } = await supabase
          .from("pulse_message_attachments")
          .insert([
            {
              file_name: attachment.name,
              file_url: fileUrl,
              file_type: fileType,
              file_size: attachment.size,
            },
          ])
          .select()
          .single()

        if (attachmentError) throw attachmentError

        // Crear relación en pulse_template_attachments_join (con language_code)
        const languageCode = attachment.language === "global" ? "all" : attachment.language

        const { error: joinError } = await supabase
          .from("pulse_template_attachments_join")
          .insert([
            {
              template_id: templateId,
              attachment_id: attachmentData.id,
              language_code: languageCode,
            },
          ])

        if (joinError) throw joinError

        console.log(`[v0] Adjunto registrado en BD: ${attachment.name} (language: ${languageCode})`)
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
      <form onSubmit={form.handleSubmit(handleSave)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA IZQUIERDA - FORMULARIO (2 columnas) */}
        <div className="lg:col-span-2 space-y-6">
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

        {/* Attachments Management */}
        <div className="border-t pt-4 space-y-4">
          <h3 className="font-semibold">Gestión de Adjuntos</h3>
          <FormDescription>Carga documentos (PDF, DOC, etc.) que se enviarán con el mensaje. Especifica el idioma para cada adjunto.</FormDescription>

          <div className="space-y-3">
            {/* Adjuntos Existentes */}
            {loadingAttachments ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando adjuntos...
              </div>
            ) : existingAttachments.length > 0 ? (
              <div className="space-y-2 mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">Adjuntos Existentes</p>
                {existingAttachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between bg-white p-2 rounded border border-blue-100">
                    <div className="flex-1 min-w-0">
                      <a
                        href={attachment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline truncate"
                      >
                        {attachment.file_name}
                      </a>
                      <p className="text-xs text-gray-600">{(attachment.file_size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-700">
                        {attachment.language_code === "all" ? "Global" : attachment.language_code.toUpperCase()}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setExistingAttachments((prev) => prev.filter((att) => att.id !== attachment.id))
                          // Registrar eliminación para procesar al guardar
                        }}
                        className="ml-2"
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Adjuntos Pendientes */}
            {pendingAttachments.length > 0 && (
              <div className="space-y-2 mb-4 p-3 bg-green-50 rounded border border-green-200">
                <p className="text-sm font-medium text-green-900 mb-2">Nuevos Adjuntos</p>
                {pendingAttachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between bg-white p-2 rounded border border-green-100">
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
                        <SelectItem value="all">Global</SelectItem>
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
                        setPendingAttachments((prev) => [...prev, { ...processed, language: "all" }])
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

        {/* COLUMNA DERECHA - PREVIEW (1 columna, sticky) */}
        <div className="hidden lg:block sticky top-4 h-fit">
          <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg border border-gray-200 shadow-lg overflow-hidden">
            {/* Email Preview Container */}
            <div className="bg-white">
              {/* Email Header */}
              <div className="bg-gray-900 text-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide">Preview del Mensaje</p>
                <p className="text-sm text-gray-300">{DICT_LANG_PULSE[currentTab as keyof typeof DICT_LANG_PULSE]}</p>
              </div>

              {/* Email Content */}
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {/* Display Name */}
                <div className="border-b pb-2">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Nombre a mostrar:</p>
                  <p className="text-sm font-semibold text-gray-900">{form.getValues(`display_name_${currentTab}`) || "—"}</p>
                </div>

                {/* Subject */}
                <div className="border-b pb-2">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Asunto:</p>
                  <p className="text-sm text-gray-700 font-medium">{form.getValues(`subject_${currentTab}`) || "—"}</p>
                </div>

                {/* Body Content */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Cuerpo del Mensaje:</p>
                  <div className="bg-white border rounded p-3 text-sm whitespace-pre-wrap break-words leading-relaxed text-gray-800">
                    {form.getValues(`body_content_${currentTab}`) 
                      ? renderPreview(form.getValues(`body_content_${currentTab}`))
                      : "—"}
                  </div>
                </div>

                {/* Attachments Info */}
                {(existingAttachments.length > 0 || pendingAttachments.length > 0) && (
                  <div className="border-t pt-2 mt-2">
                    <p className="text-xs font-semibold text-gray-600 mb-1">
                      📎 {existingAttachments.length + pendingAttachments.length} Adjuntos
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-4 py-2 border-t text-center text-xs text-gray-600">
                Así verá el usuario este mensaje
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Actions */}
        <div className="lg:col-span-2 flex gap-2 justify-end pt-4 border-t">
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
