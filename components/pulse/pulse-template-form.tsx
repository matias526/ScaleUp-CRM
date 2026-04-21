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
import { Loader2, Upload, X, Mail, MessageCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SafeEditor from "./safe-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DICT_LANG_PULSE } from "@/lib/constants/dict-lang-pulse"
import { getActiveTechCompaniesClient } from "@/lib/services/tech-company-service-client"
import { cn } from "@/lib/utils"

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
      // {{variable}} - SIEMPRE MOSTRAR CON RESALTADO - SIN BACKTICKS
      const variableName = match[5]
      parts.push(
        <span
          key={key}
          className="bg-blue-100 text-blue-700 px-1 rounded font-mono text-sm whitespace-nowrap"
          title="Campo dinámico que se reemplazará al enviar"
        >
          {"{{" + variableName + "}}"}
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
  const [previewMode, setPreviewMode] = useState<"email" | "whatsapp">("email")
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

    // Proteger tags de imagen [IMG]url[/IMG]
    let protected_text = text.replace(/\[IMG\](.*?)\[\/IMG\]/g, (match) => {
      const placeholder = `__PULSEIMG_${counter}__`
      map.set(placeholder, match)
      counter++
      return placeholder
    })

    // Proteger saltos de línea [BR]
    protected_text = protected_text.replace(/\[BR\]/g, (match) => {
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
      <form onSubmit={form.handleSubmit(handleSave)} className="max-w-[1600px] mx-auto space-y-8 pb-32">

        {/* SECCIÓN 1: CONFIGURACIÓN GLOBAL (Ancho completo) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FormField control={form.control} name="internal_code" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest">Código Interno</FormLabel>
                <FormControl><Input {...field} disabled={!!template} className="font-mono bg-slate-50" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest">Categoría</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="metodologia">Metodología</SelectItem>
                    <SelectItem value="posteos_redes">Posteos en Redes</SelectItem>
                    <SelectItem value="campanas">Campañas</SelectItem>
                    <SelectItem value="noticias">Noticias</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="tech_company_id" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest">Empresa Tecnológica</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                  <FormControl><SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sin empresa (Global)</SelectItem>
                    {techCompanies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
          </div>
        </div>

        {/* SECCIÓN 2: EDITOR + PREVIEW (Grid de dos columnas) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* COLUMNA EDITOR (7/12) */}
          <div className="lg:col-span-7 space-y-6">
            {/* IMPORTANTE: El componente Tabs debe envolver TODO (botones y contenido) */}
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  {/* Aquí solo dejamos la lista de botones */}
                  <TabsList className="bg-slate-100 p-1">
                    <TabsTrigger value="es" className="font-bold">ES</TabsTrigger>
                    <TabsTrigger value="en" className="font-bold">EN</TabsTrigger>
                    <TabsTrigger value="pt" className="font-bold">PT</TabsTrigger>
                  </TabsList>

                  <Button type="button" variant="outline" size="sm" onClick={handleAutoTranslate} disabled={translating} className="text-[10px] font-bold uppercase tracking-tighter">
                    {translating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                    Traducir desde {currentTab.toUpperCase()}
                  </Button>
                </div>

                {/* Los contenidos están ahora DENTRO del componente Tabs */}
                {["es", "en", "pt"].map((lang) => (
                  <TabsContent key={lang} value={lang} className="space-y-6 mt-0">
                    <FormField control={form.control} name={`display_name_${lang}` as any} render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest">Nombre del Template</FormLabel>
                        <FormControl><Input {...field} placeholder="Ej: Bienvenida" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`subject_${lang}` as any} render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest">Asunto / Título</FormLabel>
                        <FormControl><Input {...field} className="font-medium" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`body_content_${lang}` as any} render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest">Cuerpo del Mensaje</FormLabel>
                        <FormControl>
                          <SafeEditor
                            value={field.value}
                            onChange={field.onChange}
                            onAddImage={(url) => field.onChange(field.value + `\n[IMG]${url}[/IMG]`)}
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                  </TabsContent>
                ))}
              </div>

            </Tabs> {/* <--- EL CIERRE DE TABS VA AQUÍ, al final de la tarjeta */}
          </div>

          {/* COLUMNA PREVIEW (5/12 - STICKY) */}
          <div className="lg:col-span-5 sticky top-8">
            <div className="flex bg-slate-200/50 p-1 rounded-xl mb-4 border border-slate-300 w-fit mx-auto">
              <Button type="button" variant={previewMode === "email" ? "secondary" : "ghost"} size="sm" onClick={() => setPreviewMode("email")} className="rounded-lg px-6 font-bold text-xs">EMAIL</Button>
              <Button type="button" variant={previewMode === "whatsapp" ? "secondary" : "ghost"} size="sm" onClick={() => setPreviewMode("whatsapp")} className="rounded-lg px-6 font-bold text-xs">WHATSAPP</Button>
            </div>

            <div className={cn(
              "mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-500",
              previewMode === "email" ? "w-full min-h-[600px]" : "w-[320px] h-[650px] border-[10px] border-slate-900 rounded-[45px] bg-[#e5ddd5]"
            )}>
              {/* Browser/Phone Header */}
              <div className="bg-slate-100 border-b p-3 flex gap-1.5 items-center">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </div>

              <div className="p-6 overflow-y-auto max-h-[580px]">
                {previewMode === "email" ? (
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Asunto: </span>
                      <span className="text-sm font-semibold">{form.watch(`subject_${currentTab}`)}</span>
                    </div>
                    <div className="text-sm leading-relaxed text-slate-700">
                      {renderPreview(form.watch(`body_content_${currentTab}`) || "")}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-end h-full">
                    <div className="bg-white p-3 rounded-xl rounded-tr-none shadow-sm ml-auto max-w-[90%] text-[13px] border border-slate-200">
                      {renderPreview(form.watch(`body_content_${currentTab}`) || "")}
                      <div className="text-[9px] text-slate-400 text-right mt-1">12:00 PM ✓✓</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: ADJUNTOS (Ancho completo) */}
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm mt-8">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <Upload className="h-5 w-5 text-blue-600" />
            <h3 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest">Gestión de Archivos Adjuntos</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. ARCHIVOS YA EXISTENTES EN EL TEMPLATE */}
            {existingAttachments.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg group hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-white p-2 rounded border shadow-sm text-blue-500">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold truncate pr-2 text-slate-700">{file.file_name}</span>
                    <span className="text-[9px] text-slate-400 uppercase">Archivo guardado</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(file.id, true)}
                  className="h-8 w-8 p-0 text-slate-300 hover:text-red-500 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* 2. ARCHIVOS NUEVOS (PENDIENTES DE SUBIR) */}
            {pendingAttachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-blue-600 p-2 rounded text-white shadow-md">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold truncate pr-2 text-blue-700">{file.name}</span>
                    <span className="text-[9px] text-blue-400 uppercase font-bold tracking-tighter">Pendiente de guardado</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(index, false)}
                  className="h-8 w-8 p-0 text-blue-300 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* 3. BOTÓN DE CARGA (DROPZONE MOCK) */}
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-blue-300 transition-all group min-h-[80px]">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-full group-hover:bg-blue-100 transition-colors">
                  <Upload className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-600 group-hover:text-blue-600">Añadir adjunto</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-tighter">PDF, PNG, JPG, DOCX</p>
                </div>
              </div>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploadingFile}
              />
            </label>
          </div>

          {uploadingFile && (
            <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest">Subiendo archivos...</span>
            </div>
          )}
        </div>

        {/* PIE DE PÁGINA FIXO PARA ACCIONES */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="max-w-[1600px] mx-auto flex justify-end gap-3 px-8">
            <Button type="button" variant="ghost" onClick={onCancel} className="font-bold text-slate-500">Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-10 font-bold shadow-lg shadow-blue-500/20">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {template ? "Guardar Cambios" : "Crear Template"}
            </Button>
          </div>
        </div>

      </form>
    </Form>
  )
}