"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { PULSE_VARIABLES } from "@/lib/pulse/pulse-variables"
import { Bold, Italic, Underline, Image as ImageIcon } from "lucide-react"

interface SafeEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  onAddImage?: (imageUrl: string) => void
}

export default function SafeEditor({ value, onChange, placeholder, disabled, onAddImage }: SafeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeCategory, setActiveCategory] = useState<"entidad" | "destinatario" | "emisor">("entidad")

  // 1. MANTENGO TU FUNCIÓN DE SELECCIÓN
  const handleSelection = () => {
    if (textareaRef.current) {
      // Si necesitas usar selectionStart/End para algo más, están aquí
    }
  }

  // 2. CORRIJO EL NOMBRE A INSERTTEXT (para que coincida con el onClick de abajo)
  const insertText = (tag: string) => {
    if (!textareaRef.current) return
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = value.substring(0, start) + tag + value.substring(end)
    onChange(newValue)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + tag.length, start + tag.length)
    }, 0)
  }

  // 3. MANTENGO TU LÓGICA DE WRAPTEXT
  const wrapText = (openTag: string, closeTag: string) => {
    if (!textareaRef.current) return
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    let newValue: string
    if (start === end) {
      newValue = value.substring(0, start) + openTag + closeTag + value.substring(end)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + openTag.length, start + openTag.length)
      }, 0)
    } else {
      const selectedText = value.substring(start, end)
      newValue = value.substring(0, start) + openTag + selectedText + closeTag + value.substring(end)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + openTag.length, start + openTag.length + selectedText.length)
      }, 0)
    }
    onChange(newValue)
  }

  // 4. MANTENGO TODA TU LÓGICA DE OPTIMIZACIÓN DE IMAGEN (CANVAS)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onAddImage) return
    try {
      if (!file.type.startsWith("image/")) return
      if (file.size > 5 * 1024 * 1024) return

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
      console.error("Error:", error)
    }
  }

  return (
    <div className="flex flex-col w-full border rounded-md overflow-hidden border-slate-300 shadow-none">
      {/* TOOLBAR */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 border-b border-slate-300">
        {/* Format buttons */}
        <div className="flex gap-1 border-r pr-3 border-slate-300">
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100" onClick={(e) => { e.preventDefault(); e.stopPropagation(); wrapText("[B]", "[/B]"); }}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100" onClick={(e) => { e.preventDefault(); e.stopPropagation(); wrapText("[I]", "[/I]"); }}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100" onClick={(e) => { e.preventDefault(); e.stopPropagation(); wrapText("[U]", "[/U]"); }}>
            <Underline className="h-4 w-4" />
          </Button>
          {onAddImage && (
            <>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100" onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }}>
                <ImageIcon className="h-4 w-4" />
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </>
          )}
        </div>

        {/* Category buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("entidad")}
            className={`text-xs font-semibold px-3 py-2 rounded transition-all ${
              activeCategory === "entidad"
                ? "bg-slate-700 text-white"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            }`}
          >
            ENTIDAD
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("destinatario")}
            className={`text-xs font-semibold px-3 py-2 rounded transition-all ${
              activeCategory === "destinatario"
                ? "bg-slate-700 text-white"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            }`}
          >
            DESTINATARIO
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("emisor")}
            className={`text-xs font-semibold px-3 py-2 rounded transition-all ${
              activeCategory === "emisor"
                ? "bg-slate-700 text-white"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            }`}
          >
            EMISOR
          </button>
        </div>
      </div>

      {/* VARIABLES - Dynamic based on activeCategory */}
      <div className="p-3 bg-slate-50 border-b border-slate-300">
        <div className="flex gap-2 flex-wrap">
          {activeCategory === "entidad" &&
            PULSE_VARIABLES.entidad.map((v) => (
              <button
                key={v.tag}
                type="button"
                onClick={() => { insertText(v.tag) }}
                className="text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 px-3 py-2 rounded border border-slate-300 transition-all"
                title={v.label}
              >
                {v.tag}
              </button>
            ))}
          {activeCategory === "destinatario" &&
            PULSE_VARIABLES.destinatario.map((v) => (
              <button
                key={v.tag}
                type="button"
                onClick={() => { insertText(v.tag) }}
                className="text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded border border-blue-300 transition-all"
                title={v.label}
              >
                {v.tag}
              </button>
            ))}
          {activeCategory === "emisor" &&
            PULSE_VARIABLES.emisor.map((v) => (
              <button
                key={v.tag}
                type="button"
                onClick={() => { insertText(v.tag) }}
                className="text-xs font-medium bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded border border-green-300 transition-all"
                title={v.label}
              >
                {v.tag}
              </button>
            ))}
        </div>
      </div>

      {/* TEXTAREA */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelection}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-64 p-4 font-mono text-sm resize-none focus:outline-none bg-white text-slate-700 placeholder:text-slate-400"
      />

      {/* FOOTER */}
      <div className="p-3 bg-slate-50 border-t border-slate-300 text-[10px] text-slate-500 font-medium">
        Soporta [B], [I], [U] y Variables.
      </div>
    </div>
  )
}
