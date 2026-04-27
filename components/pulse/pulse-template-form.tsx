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

const renderSubjectPreview = (text: string) => {
  const parts: React.ReactNode[] = [];
  const regex = /\{\{([^}]*)\}\}/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <span key={match.index} className="bg-blue-50 text-blue-600 px-1 rounded border border-blue-100 font-mono text-[10px] font-bold mx-0.5">
        {"{{" + match[1] + "}}"}
      </span>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.substring(lastIndex));
  return parts.length > 0 ? parts : text;
};

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
    const elementKey = `line-${baseKey}-elem-${componentCounter++}`
    if (match[1] !== undefined) {
      // [IMG]url[/IMG]
      const imgUrl = match[1]

      // Creamos una key única y segura
      const imgKey = `img-${baseKey}-${componentCounter++}`

      parts.push(
        <img
          key={imgKey}
          src={imgUrl}
          alt="Contenido"
          className="max-w-full max-h-80 rounded my-2 block shadow-sm border border-slate-100"
          // El secreto para que no scrollee el error infinito en consola:
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // Evitamos re-entrada: si ya pusimos el placeholder, no hacemos nada más
            if (target.dataset.errorHandled) return;

            target.dataset.errorHandled = "true";
            target.src = "https://placehold.co/400x200?text=Imagen+Expirada";
            target.className = "max-w-full h-20 rounded my-2 block opacity-40 grayscale";
            console.warn("[v0] Imagen blob expirada omitida:", imgUrl);
          }}
        />
      )
    } else if (match[2] !== undefined) {
      // [B]text[/B]
      parts.push(
        <strong key={elementKey} className="font-bold">
          {match[2]}
        </strong>
      )
    } else if (match[3] !== undefined) {
      // [I]text[/I]
      parts.push(
        <em key={elementKey} className="italic">
          {match[3]}
        </em>
      )
    } else if (match[4] !== undefined) {
      // [U]text[/U]
      parts.push(
        <u key={elementKey} className="underline">
          {match[4]}
        </u>
      )
    } else if (match[5] !== undefined) {
      // {{variable}} - SIEMPRE MOSTRAR CON RESALTADO - SIN BACKTICKS
      const variableName = match[5]
      parts.push(
        <span
          key={elementKey}
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
  const { t, language: currentLanguage } = useTranslation()
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

  // --- FUNCIONES DE ADJUNTOS (PEGAR AQUÍ) ---
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    // Convertimos los archivos en el objeto que la función de subida espera
    const newFiles = Array.from(e.target.files).map(file => ({
      id: crypto.randomUUID(),
      file: file, // Objeto File real para el storage
      name: file.name,
      size: file.size,
      language: "all" as "es" | "all" | "en" | "pt"
    }));

    setPendingAttachments((prev) => [...prev, ...newFiles]);
  };

  const removeAttachment = async (id: string, isExisting: boolean) => {
    if (isExisting) {
      // 1. Borramos la relación en la tabla join de Supabase
      const { data, error } = await (supabase as any)
        .from("pulse_template_attachments_join")
        .delete()
        .eq("attachment_id", id);

      if (error) {
        console.error("Error al borrar adjunto:", error);
        alert("No se pudo borrar el archivo de la base de datos");
        return;
      }

      // 2. Actualizamos el estado local
      setExistingAttachments(prev => prev.filter(a => a.id !== id));
    } else {
      // Si es un archivo pendiente (no guardado aún), solo limpiamos el estado local
      setPendingAttachments(prev => prev.filter(a => a.id !== id));
    }
  };

  const form = useForm<PulseTemplateFormData>({
    resolver: zodResolver(pulseTemplateSchema) as any,
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
        const { data, error } = await (supabase as any)
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

      const sourceLanguage = currentTab
      const targetLanguages = {
        es: [{ code: "en", name: "English" }, { code: "pt", name: "Portuguese (Brazil)" }],
        en: [{ code: "es", name: "Spanish" }, { code: "pt", name: "Portuguese (Brazil)" }],
        pt: [{ code: "es", name: "Spanish" }, { code: "en", name: "English" }],
      }[sourceLanguage] || []

      const sourceTexts = {
        display_name: (form.getValues(`display_name_${sourceLanguage}` as any) || "").replace(/\n/g, "[BR]"),
        subject: (form.getValues(`subject_${sourceLanguage}` as any) || "").replace(/\n/g, "[BR]"),
        body_content: (form.getValues(`body_content_${sourceLanguage}` as any) || "").replace(/\n/g, "[BR]"),
      }

      // 1. Protegemos el contenido (incluyendo tus nuevos [B])
      const protectedTexts = Object.entries(sourceTexts).reduce(
        (acc, [key, text]) => {
          acc[key] = protectContent(text)
          return acc
        },
        {} as Record<string, ReturnType<typeof protectContent>>,
      )

      for (const targetLang of targetLanguages) {
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
              targetLanguage: targetLang.name,
            }),
          })

          if (!response.ok) throw new Error(`Error translating to ${targetLang.code}`)

          const { translations } = await response.json()

          const restoredTranslations = Object.entries(translations).reduce(
            (acc, [key, text]) => {
              // --- EL FIX CRÍTICO AQUÍ ---
              // Si 'text' es el objeto {label, tag} que causa el error #31, extraemos solo el label.
              // Si es un string, lo usamos directo.
              const cleanText = (text && typeof text === 'object' && (text as any).label)
                ? (text as any).label
                : (typeof text === 'string' ? text : "");

              const restored = restoreContent(cleanText, protectedTexts[key].map)
              acc[`${key}_${targetLang.code}`] = restored
              return acc
            },
            {} as Record<string, string>,
          )

          Object.entries(restoredTranslations).forEach(([fieldName, value]) => {
            const displayValue = brToNewlines(value)
            // Aseguramos que siempre sea string para el input
            form.setValue(fieldName as any, String(displayValue))
          })

        } catch (err) {
          console.error(`[v0] Error traduciendo a ${targetLang.code}:`, err)
        }
      }
    } catch (error) {
      console.error("[v0] Error en auto-traducción:", error)
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
        // Usamos attachment.file que es donde guardamos el archivo real en onFileChange
        const file = attachment.file;
        const fileExt = file.name.split(".").pop()
        const fileName = `${templateId}/${attachment.id}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("pulse-assets")
          .upload(`attachments/${fileName}`, file)

        if (uploadError) {
          throw new Error(`Error subiendo archivo ${attachment.name}: ${uploadError.message}`)
        }

        console.log(`[v0] Archivo subido: attachments/${fileName}`)

        // Obtener URL pública
        const { data } = supabase.storage.from("pulse-assets").getPublicUrl(`attachments/${fileName}`)
        const fileUrl = data.publicUrl

        // Obtener tipo de archivo del MIME type directamente del file
        const fileType = file.type || "application/octet-stream"

        // Crear registro en pulse_message_attachments
        const { data: attachmentData, error: attachmentError } = await (supabase as any)
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

        // Crear relación en pulse_template_attachments_join
        // Ajuste de "global" a "all" según tu lógica
        const languageCode = attachment.language === "all" ? "all" : attachment.language;

        const { error: joinError } = await (supabase as any)
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

      // Validar traducciones
      const hasEN = data.display_name_en && data.subject_en && data.body_content_en
      const hasPT = data.display_name_pt && data.subject_pt && data.body_content_pt

      if (!hasEN && !hasPT) {
        alert("Debes traducir a al menos Inglés o Portugués")
        return
      }

      // --- 1. DECLARAMOS EL ID FUERA ---
      let finalId = template?.id;

      if (template?.id) {
        // UPDATE
        console.log("[v0] Actualizando template:", template.id)

        // IMPORTANTE: Agregamos el await que faltaba aquí
        const { error: mainUpdateError } = await (supabase as any)
          .from("pulse_message_templates")
          .update({
            category: data.category,
            tech_company_id: data.tech_company_id === "none" ? null : data.tech_company_id,
            internal_code: data.internal_code, // Opcional según tu lógica
          })
          .eq("id", template.id)

        if (mainUpdateError) throw mainUpdateError

        const translations = [
          {
            language_code: "es",
            display_name: newlinesToBr(data.display_name_es),
            subject: newlinesToBr(data.subject_es),
            body_content: newlinesToBr(data.body_content_es),
          },
          ...(hasEN ? [{
            language_code: "en",
            display_name: newlinesToBr(data.display_name_en),
            subject: newlinesToBr(data.subject_en),
            body_content: newlinesToBr(data.body_content_en),
          }] : []),
          ...(hasPT ? [{
            language_code: "pt",
            display_name: newlinesToBr(data.display_name_pt),
            subject: newlinesToBr(data.subject_pt),
            body_content: newlinesToBr(data.body_content_pt),
          }] : []),
        ]

        for (const translation of translations) {
          const { error } = await (supabase as any)
            .from("pulse_message_template_translations")
            .update(translation)
            .eq("template_id", template.id)
            .eq("language_code", translation.language_code)

          if (error) throw error
        }
      } else {
        // CREATE
        console.log("[v0] Creando nuevo template")

        const { data: templateData, error: templateError } = await (supabase as any)
          .from("pulse_message_templates")
          .insert([
            {
              internal_code: data.internal_code,
              category: data.category,
              tech_company_id: data.tech_company_id === "none" ? null : data.tech_company_id,
              is_active: true,
            },
          ])
          .select()
          .single()

        if (templateError) throw templateError

        // --- 2. ASIGNAMOS EL ID NUEVO A LA VARIABLE EXTERNA ---
        finalId = templateData.id;

        const translations = [
          {
            template_id: finalId,
            language_code: "es",
            display_name: newlinesToBr(data.display_name_es),
            subject: newlinesToBr(data.subject_es),
            body_content: newlinesToBr(data.body_content_es),
          },
          ...(hasEN ? [{
            template_id: finalId,
            language_code: "en",
            display_name: newlinesToBr(data.display_name_en),
            subject: newlinesToBr(data.subject_en),
            body_content: newlinesToBr(data.body_content_en),
          }] : []),
          ...(hasPT ? [{
            template_id: finalId,
            language_code: "pt",
            display_name: newlinesToBr(data.display_name_pt),
            subject: newlinesToBr(data.subject_pt),
            body_content: newlinesToBr(data.body_content_pt),
          }] : []),
        ]

        const { error: translationsError } = await (supabase as any)
          .from("pulse_message_template_translations")
          .insert(translations)

        if (translationsError) throw translationsError
      }

      // --- 3. USAMOS finalId (YA NO USAMOS templateData?.id AQUÍ) ---
      if (finalId && pendingAttachments.length > 0) {
        console.log("[v0] Iniciando subida de adjuntos...")
        await uploadPendingAttachments(finalId)
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
      <form onSubmit={form.handleSubmit(handleSave)} className="w-full">
        {/* ENCABEZADO CON FONDO CELESTE */}
        <div className="bg-[#f0f7ff] px-8 py-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">
            {template ? "Editar Template" : "Crear Nuevo Template"}
          </h1>
        </div>

        <div className="space-y-6 p-6">
          {/* SECCIÓN 1: DATOS GENERALES - TARJETA BLANCA */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-slate-400" /> Datos Generales
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <FormField control={form.control} name="internal_code" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Código Interno</FormLabel>
                  <FormControl><Input {...field} disabled={!!template} className="h-10 border-slate-300 rounded-md mt-2" placeholder="WELCOME_OPP" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Categoría</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="h-10 border-slate-300 rounded-md mt-2"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="metodologia">Metodología</SelectItem>
                      <SelectItem value="posteos_redes">Posteos</SelectItem>
                      <SelectItem value="campanas">Campañas</SelectItem>
                      <SelectItem value="noticias">Noticias</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="tech_company_id" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Empresa Tecnológica</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                    <FormControl><SelectTrigger className="h-10 border-slate-300 rounded-md mt-2"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin empresa (Global)</SelectItem>
                      {techCompanies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {/* SECCIÓN 2: CONTENIDO POR IDIOMAS - TARJETA BLANCA CON GRID 2 COLUMNAS */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-slate-400" /> Contenido por Idioma
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAutoTranslate} disabled={translating} className="text-xs font-semibold uppercase text-slate-700 border-slate-300 h-9 rounded-md">
                {translating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                Auto-Traducir
              </Button>
            </div>

            {/* Tabs Underline */}
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full mb-6">
              <TabsList className="bg-transparent border-b border-slate-200 p-0 w-full gap-8 h-auto rounded-none">
                <TabsTrigger value="es" className="text-xs font-semibold uppercase tracking-wide text-slate-600 px-0 py-3 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-slate-900 rounded-none bg-transparent">ES</TabsTrigger>
                <TabsTrigger value="en" className="text-xs font-semibold uppercase tracking-wide text-slate-600 px-0 py-3 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-slate-900 rounded-none bg-transparent">EN</TabsTrigger>
                <TabsTrigger value="pt" className="text-xs font-semibold uppercase tracking-wide text-slate-600 px-0 py-3 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-slate-900 rounded-none bg-transparent">PT</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* GRID 2 COLUMNAS: EDICIÓN (IZQ) + PREVIEW (DER) */}
            <div className="grid grid-cols-12 gap-8">
              {/* COLUMNA IZQUIERDA: EDICIÓN (8 columnas) */}
              <div className="col-span-8">
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                  {["es", "en", "pt"].map((lang) => (
                    <TabsContent key={lang} value={lang} className="space-y-6 mt-0">
                      <FormField control={form.control} name={`display_name_${lang}` as any} render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nombre Público</FormLabel>
                          <FormControl><Input {...field} placeholder="Ej: Bienvenida Especial" className="h-10 border-slate-300 rounded-md mt-2" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name={`subject_${lang}` as any} render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-end mb-2">
                            <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Asunto del Email</FormLabel>
                            <div className="flex gap-2 flex-wrap">
                              {['name', 'first_name', 'company'].map((v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const currentVal = field.value || "";
                                    field.onChange(`${currentVal}{{${v}}}`);
                                  }}
                                  className="text-xs font-medium bg-slate-100 hover:bg-slate-150 text-slate-600 px-2.5 py-1.5 rounded border border-slate-200 transition-all hover:border-slate-300"
                                >
                                  {"{{" + v + "}}"}
                                </button>
                              ))}
                            </div>
                          </div>
                          <FormControl>
                            <Input
                              {...field}
                              onMouseUp={(e) => e.stopPropagation()}
                              onSelect={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.preventDefault();
                                e.stopPropagation();
                              }}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Ej: Hola {{name}}, tenemos una propuesta..."
                              className="h-10 border-slate-300 rounded-md mt-2 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                            />
                          </FormControl>
                        </FormItem>
                      )} />

                      <FormField control={form.control} name={`body_content_${lang}` as any} render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Contenido</FormLabel>
                          <FormControl>
                            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                              <SafeEditor
                                value={field.value}
                                onChange={field.onChange}
                                onAddImage={(url) => field.onChange(field.value + `\n[IMG]${url}[/IMG]`)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="space-y-3">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Adjuntos</h4>
                        <div className="grid gap-2">
                          {existingAttachments.map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded group hover:border-slate-300 text-sm">
                              <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-blue-600 truncate flex-1 font-medium">{file.file_name}</a>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(file.id, true)} className="h-6 w-6 p-0 text-slate-400 hover:text-red-500">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          {pendingAttachments.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                              <span className="text-blue-900 font-medium truncate flex-1">{file.name}</span>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(file.id, false)} className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <label className="border-2 border-dashed border-slate-300 rounded p-3 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">+ Subir Archivo</span>
                            <input type="file" multiple className="hidden" onChange={onFileChange} />
                          </label>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {/* COLUMNA DERECHA: PREVIEW (4 columnas) - STICKY */}
              <div className="col-span-4 sticky top-0 h-fit">
                <div className="flex gap-2 mb-6 bg-white border border-slate-200 rounded p-1 w-full">
                  <Button
                    type="button"
                    variant={previewMode === "email" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setPreviewMode("email")}
                    className="text-xs font-semibold uppercase rounded flex-1 bg-white text-slate-700"
                  >
                    EMAIL
                  </Button>
                  <Button
                    type="button"
                    variant={previewMode === "whatsapp" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setPreviewMode("whatsapp")}
                    className="text-xs font-semibold uppercase rounded flex-1 bg-white text-slate-700"
                  >
                    WHATSAPP
                  </Button>
                </div>

                <div className={cn(
                  "overflow-hidden transition-all border border-slate-200 rounded",
                  previewMode === "email"
                    ? "w-full bg-white"
                    : "w-full h-96 bg-white rounded-2xl flex flex-col"
                )}>
                  {previewMode === "email" ? (
                    <div className="flex flex-col h-full bg-white">
                      <div className="bg-slate-100 border-b border-slate-200 p-3 space-y-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-400" />
                          <div className="w-2 h-2 rounded-full bg-amber-400" />
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        </div>
                        <p className="text-[8px] text-slate-500 font-semibold uppercase">Asunto:</p>
                        <div className="text-xs font-semibold text-slate-900">{renderSubjectPreview(form.watch(`subject_${currentTab}` as any) || '') as string}</div>
                      </div>
                      <div className="p-3 flex-1 overflow-y-auto">
                        <div className="text-xs text-slate-700 leading-relaxed">{renderPreview(form.watch(`body_content_${currentTab}` as any) || "")}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col bg-gradient-to-b from-slate-100 to-slate-50">
                      <div className="p-2 text-center border-b border-slate-200">
                        <p className="text-[9px] font-semibold text-slate-600">12:45 PM</p>
                      </div>
                      <div className="flex-1 p-3 overflow-y-auto flex justify-center">
                        <div className="bg-white rounded-2xl rounded-tl-sm p-3 max-w-[80%] shadow">
                          <div className="text-xs text-slate-700 leading-relaxed">{renderPreview(form.watch(`body_content_${currentTab}` as any) || "") as string}</div>
                          <p className="text-[8px] text-slate-400 text-right mt-1">12:45 PM</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PIE DE PÁGINA */}
          <div className="border-t border-slate-200 bg-white px-6 py-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="font-semibold text-slate-700 border-slate-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#2563eb] hover:bg-blue-700 px-8 font-semibold text-white"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {template ? "Guardar Cambios" : "Crear Template"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
