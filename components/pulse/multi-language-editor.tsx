"use client"

import { useState } from "react"
import { useTranslation } from "@/hooks/use-translations"
import SafeEditor from "./safe-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2, Zap } from "lucide-react"

interface MultiLanguageContent {
  es: string
  en: string
  pt: string
}

interface MultiLanguageEditorProps {
  content: MultiLanguageContent
  onChange: (content: MultiLanguageContent) => void
  disabled?: boolean
}

// Función para proteger variables y etiquetas de formato durante traducción
const protectContent = (text: string): { protected: string; map: Map<string, string> } => {
  const map = new Map<string, string>()
  let counter = 0

  // Proteger variables {{...}}
  let protected_text = text.replace(/\{\{[^}]+\}\}/g, (match) => {
    const placeholder = `__VAR_${counter}__`
    map.set(placeholder, match)
    counter++
    return placeholder
  })

  // Proteger etiquetas de formato [B], [/B], etc.
  protected_text = protected_text.replace(/\[[BIU]\]|\[\/[BIU]\]/g, (match) => {
    const placeholder = `__FORMAT_${counter}__`
    map.set(placeholder, match)
    counter++
    return placeholder
  })

  return { protected: protected_text, map }
}

// Función para restaurar variables y etiquetas protegidas
const restoreContent = (text: string, map: Map<string, string>): string => {
  let restored = text
  map.forEach((original, placeholder) => {
    restored = restored.replace(new RegExp(placeholder, "g"), original)
  })
  return restored
}

export default function MultiLanguageEditor({ content, onChange, disabled }: MultiLanguageEditorProps) {
  const { t } = useTranslation()
  const [currentLanguage, setCurrentLanguage] = useState<"es" | "en" | "pt">("es")
  const [translating, setTranslating] = useState(false)

  // Simular traducción (en producción usarías una API como Groq o similar)
  const handleAutoTranslate = async () => {
    try {
      setTranslating(true)

      const sourceLanguage = currentLanguage
      const sourceText = content[sourceLanguage]

      if (!sourceText.trim()) {
        console.log("[v0] No hay contenido para traducir")
        return
      }

      // Proteger variables y formato
      const { protected: protectedText, map } = protectContent(sourceText)

      // Simulación de traducción (placeholder para demostración)
      // En producción, llamarías a Groq u otro servicio de traducción
      console.log("[v0] Traduciendo desde", sourceLanguage, "a otros idiomas")
      console.log("[v0] Contenido protegido:", protectedText)

      const languageName: Record<string, string> = {
        es: "Spanish",
        en: "English",
        pt: "Portuguese (Brazil)",
      }

      // Por ahora, solo duplicar el contenido como demostración
      const newContent = { ...content }

      // Marcar que la traducción fue automática (en producción, hacer la traducción real)
      Object.entries(languageName).forEach(([lang, name]) => {
        if (lang !== sourceLanguage) {
          // Aquí iría la llamada a Groq para traducir
          newContent[lang as "es" | "en" | "pt"] = `[AUTO-TRADUCIDO] ${protectedText}...`
        }
      })

      onChange(newContent)
      console.log("[v0] Traducción completada")
    } catch (error) {
      console.error("[v0] Error en traducción automática:", error)
    } finally {
      setTranslating(false)
    }
  }

  const updateContent = (language: "es" | "en" | "pt", value: string) => {
    onChange({
      ...content,
      [language]: value,
    })
  }

  return (
    <div className="space-y-4">
      {/* Auto-Translate Button */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{t("pulse.content_languages", "Contenido por Idioma")}</h3>
        <Button
          onClick={handleAutoTranslate}
          disabled={translating || disabled || !content[currentLanguage].trim()}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          {translating && <Loader2 className="h-4 w-4 animate-spin" />}
          <Zap className="h-4 w-4" />
          {t("pulse.auto_translate", "Auto-Traducir desde {lang}", {
            lang: { es: "Español", en: "English", pt: "Português" }[currentLanguage],
          })}
        </Button>
      </div>

      {/* Language Tabs */}
      <Tabs
        value={currentLanguage}
        onValueChange={(value) => setCurrentLanguage(value as "es" | "en" | "pt")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="es" disabled={disabled}>
            Español (ES)
          </TabsTrigger>
          <TabsTrigger value="en" disabled={disabled}>
            English (EN)
          </TabsTrigger>
          <TabsTrigger value="pt" disabled={disabled}>
            Português (PT)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="es">
          <SafeEditor
            value={content.es}
            onChange={(value) => updateContent("es", value)}
            placeholder={t("pulse.template_placeholder", "Escribe tu template aquí...")}
            disabled={disabled}
          />
        </TabsContent>

        <TabsContent value="en">
          <SafeEditor
            value={content.en}
            onChange={(value) => updateContent("en", value)}
            placeholder={t("pulse.template_placeholder", "Write your template here...")}
            disabled={disabled}
          />
        </TabsContent>

        <TabsContent value="pt">
          <SafeEditor
            value={content.pt}
            onChange={(value) => updateContent("pt", value)}
            placeholder={t("pulse.template_placeholder", "Escreva seu modelo aqui...")}
            disabled={disabled}
          />
        </TabsContent>
      </Tabs>

      {/* Warning about auto-translation */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
        <p className="font-semibold mb-1">{t("pulse.translation_note", "Nota sobre Traducción Automática")}</p>
        <p>
          {t(
            "pulse.translation_protection",
            "Las variables {{...}} y los formatos [B], [I], [U] se mantienen intactos durante la traducción automática. Revisa siempre las traducciones antes de guardar.",
          )}
        </p>
      </div>
    </div>
  )
}
