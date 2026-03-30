"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, ImageIcon } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

interface ImageUploadProps {
  onChange: (file: File | string | null) => void
  value?: File | string | null
  className?: string
  label?: string
  accept?: string
  maxSizeMB?: number
  autoUpload?: boolean
}

export function ImageUpload({
  onChange,
  value,
  className = "",
  label = "Imagen",
  accept = "image/jpeg, image/png, image/gif, image/webp",
  maxSizeMB = 5,
  autoUpload = true,
}: ImageUploadProps) {
  const { toast } = useToast()
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (value && typeof value === "string") {
      setPreview(value)
    }
  }, [value])

  const uploadToSupabase = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true)
      console.log("[v0] Uploading image via API endpoint...")

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/users/upload-profile-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload image")
      }

      const { url } = await response.json()
      console.log("[v0] Image uploaded successfully:", url)

      return url
    } catch (error) {
      console.error("[v0] Error uploading image:", error)
      toast({
        title: "Error",
        description: "No se pudo subir la imagen. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null

    if (file) {
      // Validar tamaño
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`El archivo es demasiado grande. El tamaño máximo es ${maxSizeMB}MB.`)
        return
      }

      // Validar tipo
      if (!accept.includes(file.type)) {
        setError(`Tipo de archivo no permitido. Formatos aceptados: ${accept}`)
        return
      }

      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      setError(null)

      // Si autoUpload está deshabilitado, solo pasar el File
      if (!autoUpload) {
        onChange(file)
        toast({
          title: "Imagen seleccionada",
          description: "La imagen se subirá al guardar.",
        })
        return
      }

      // Si autoUpload está habilitado, subir directamente
      const publicUrl = await uploadToSupabase(file)

      if (publicUrl) {
        setPreview(publicUrl)
        onChange(publicUrl)
        toast({
          title: "Imagen subida",
          description: "La imagen se ha subido correctamente.",
        })
      } else {
        setPreview(null)
        onChange(null)
      }
    }
  }

  const handleRemove = () => {
    if (inputRef.current) {
      inputRef.current.value = ""
    }
    setPreview(null)
    setError(null)
    onChange(null)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>

      {preview ? (
        <div className="relative w-full h-40 border rounded-md overflow-hidden">
          <Image src={preview || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-md border-gray-300 dark:border-gray-700 hover:border-primary/50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <ImageIcon className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF o WEBP (Máx. {maxSizeMB}MB)</p>
          </div>
          <Input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      )}

      {!preview && (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="w-full"
          disabled={isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Subiendo..." : "Seleccionar imagen"}
        </Button>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
