"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { PULSE_VARIABLES } from "@/lib/pulse/pulse-variables"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Bold, Italic, Underline, Variable, Image as ImageIcon } from "lucide-react"

interface SafeEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  onAddImage?: (imageUrl: string) => void
}

export default function SafeEditor({ value, onChange, placeholder, disabled, onAddImage }: SafeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectionStart, setSelectionStart] = useState(0)
  const [selectionEnd, setSelectionEnd] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Actualizar la selección cuando el usuario hace clic o usa el teclado
  const handleSelection = () => {
    if (textareaRef.current) {
      setSelectionStart(textareaRef.current.selectionStart)
      setSelectionEnd(textareaRef.current.selectionEnd)
    }
  }

  // Insertar variable en la posición del cursor
  const insertVariable = (tag: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    const newValue = value.substring(0, start) + tag + value.substring(end)
    onChange(newValue)

    // Posicionar el cursor después de la variable insertada
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + tag.length, start + tag.length)
    }, 0)
  }

  // Envolver el texto seleccionado con etiquetas de formato
  const wrapText = (openTag: string, closeTag: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    let newValue: string

    if (start === end) {
      // Si no hay selección, insertar tags vacíos y posicionar el cursor en medio
      newValue = value.substring(0, start) + openTag + closeTag + value.substring(end)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + openTag.length, start + openTag.length)
      }, 0)
    } else {
      // Si hay selección, envolver el texto
      const selectedText = value.substring(start, end)
      newValue = value.substring(0, start) + openTag + selectedText + closeTag + value.substring(end)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + openTag.length, start + openTag.length + selectedText.length)
      }, 0)
    }

    onChange(newValue)
  }

  // Manejar carga de imagen
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onAddImage) return

    try {
      if (!file.type.startsWith("image/")) {
        alert("Solo se permiten archivos de imagen")
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen no debe superar 5MB")
        return
      }

      // Optimizar imagen a máximo 1000px
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = async () => {
        const canvas = document.createElement("canvas")
        const maxDim = 1000
        let { width, height } = img
        
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convertir a blob y simular subida
          canvas.toBlob((blob) => {
            if (blob) {
              const optimizedUrl = URL.createObjectURL(blob)
              onAddImage(optimizedUrl)
            }
            URL.revokeObjectURL(url)
          }, "image/jpeg", 0.85)
        }
      }
      
      img.src = url
    } catch (error) {
      console.error("[v0] Error procesando imagen:", error)
    }
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex gap-2 p-2 bg-gray-50 rounded border border-gray-200 flex-wrap">
        {/* Formatting Buttons */}
        <div className="flex gap-1 border-r pr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => wrapText("[B]", "[/B]")}
            disabled={disabled}
            title="Bold"
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => wrapText("[I]", "[/I]")}
            disabled={disabled}
            title="Italic"
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => wrapText("[U]", "[/U]")}
            disabled={disabled}
            title="Underline"
            className="h-8 w-8 p-0"
          >
            <Underline className="h-4 w-4" />
          </Button>
          {onAddImage && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                title="Insertar Imagen"
                className="h-8 w-8 p-0"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </>
          )}
        </div>

        {/* Variables Dropdown */}
        <div className="flex gap-1">
          {Object.entries(PULSE_VARIABLES).map(([categoryKey, variables]) => (
            <DropdownMenu key={categoryKey}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={disabled} className="h-8 text-xs gap-1">
                  <Variable className="h-4 w-4" />
                  {categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="font-semibold">
                  {categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {variables.map((variable) => (
                  <DropdownMenuItem
                    key={variable.tag}
                    onClick={() => insertVariable(variable.tag)}
                    className="flex justify-between"
                  >
                    <span>{variable.label}</span>
                    <span className="text-xs text-gray-500 ml-2 font-mono">{variable.tag}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>
      </div>

      {/* Text Editor */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelection}
        onClick={handleSelection}
        onKeyUp={handleSelection}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
      />

      {/* Info text */}
      <p className="text-xs text-gray-500">
        Usa <span className="font-mono text-gray-600">[B]...[/B]</span>, <span className="font-mono text-gray-600">[I]...[/I]</span> y{" "}
        <span className="font-mono text-gray-600">[U]...[/U]</span> para formato. Las variables están protegidas durante la traducción automática.
      </p>
    </div>
  )
}
