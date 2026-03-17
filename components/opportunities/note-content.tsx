"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"

interface NoteContentProps {
  content: string
  onClick?: () => void
  isEditable?: boolean
}

export function NoteContent({ content, onClick, isEditable = false }: NoteContentProps) {
  const { t } = useTranslations()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLongContent, setIsLongContent] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // Evitar problemas de hidratación con ReactMarkdown
  useEffect(() => {
    setMounted(true)
  }, [])

  // Detectar si el contenido es largo (más de 4 líneas o 300 caracteres)
  useEffect(() => {
    if (contentRef.current) {
      try {
        const lineHeight = Number.parseInt(window.getComputedStyle(contentRef.current).lineHeight)
        const height = contentRef.current.scrollHeight
        const lines = Math.floor(height / (lineHeight || 20)) // 20px como fallback

        // Considerar contenido largo si tiene más de 4 líneas o más de 300 caracteres
        setIsLongContent(lines > 4 || content.length > 300)
      } catch (error) {
        console.error("Error al calcular altura del contenido:", error)
      }
    }
  }, [content, mounted])

  // Verificar si el contenido es válido
  if (!content) {
    console.error("Contenido de nota vacío o inválido")
    return <div className="text-red-500">Error: Contenido de nota inválido</div>
  }

  const handleContentClick = (e: React.MouseEvent) => {
    // Solo ejecutar onClick si se proporciona y la nota es editable
    if (onClick && isEditable) {
      onClick()
    }
  }

  return (
    <div>
      <div
        ref={contentRef}
        className={`overflow-hidden transition-all duration-300 ${
          isLongContent && !isExpanded ? "max-h-[100px] relative" : ""
        } ${isEditable ? "cursor-pointer hover:bg-gray-50 rounded p-1" : ""}`}
        onClick={handleContentClick}
      >
        {/* Usar un try-catch para manejar errores de renderizado */}
        <div className="markdown-content">
          {mounted ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <div
              dangerouslySetInnerHTML={{
                __html: content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>"),
              }}
            />
          )}
        </div>

        {/* Efecto de difuminado para contenido truncado */}
        {isLongContent && !isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent"></div>
        )}
      </div>

      {/* Botón "Mostrar más" para contenido largo */}
      {isLongContent && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation() // Evitar que el clic se propague al contenedor
            setIsExpanded(!isExpanded)
          }}
          className="mt-1 h-6 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          {isExpanded ? t("notes.showLess", "Mostrar menos") : t("notes.showMoreContent", "Mostrar más")}
        </Button>
      )}
    </div>
  )
}
