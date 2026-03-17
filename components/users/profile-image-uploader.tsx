"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, X, Camera } from "lucide-react"
//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from "uuid"

interface ProfileImageUploaderProps {
  initialImage?: string | null
  userId: string
  onImageUpdate: (url: string | null) => void
  size?: "sm" | "md" | "lg" | "xl"
}

export function ProfileImageUploader({ initialImage, userId, onImageUpdate, size = "lg" }: ProfileImageUploaderProps) {
  const [image, setImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  //const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Inicializar la imagen cuando cambia initialImage
  useEffect(() => {
    console.log("[v0] ProfileImageUploader - Initial image:", initialImage)
    setImage(initialImage || null)
  }, [initialImage])

  // Tamaños para diferentes opciones
  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
    xl: "h-40 w-40",
  }

  // Obtener las iniciales del usuario actual
  const getInitials = () => {
    return "U"
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[v0] ProfileImageUploader - File selected")
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Tipo de archivo no válido",
        description: "Por favor, selecciona una imagen (JPG, PNG, GIF)",
        variant: "destructive",
      })
      return
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "La imagen no debe superar los 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Generar un nombre único para el archivo
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}-${uuidv4()}.${fileExt}`
      const filePath = `${fileName}`

      console.log("[v0] ProfileImageUploader - Uploading file:", filePath)

      // Subir el archivo a Supabase Storage
      const { data, error } = await supabase.storage.from("profile-images").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (error) {
        console.error("[v0] ProfileImageUploader - Upload error:", error)
        throw error
      }

      console.log("[v0] ProfileImageUploader - File uploaded successfully:", data)

      // Obtener la URL pública del archivo
      const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(filePath)

      console.log("[v0] ProfileImageUploader - Public URL obtained:", urlData.publicUrl)

      // Actualizar el estado y notificar al componente padre
      setImage(urlData.publicUrl)
      onImageUpdate(urlData.publicUrl)

      toast({
        title: "Imagen actualizada",
        description: "Tu foto de perfil ha sido actualizada. Haz clic en 'Guardar cambios' para confirmar.",
      })
    } catch (error: any) {
      console.error("[v0] ProfileImageUploader - Error uploading image:", error)
      toast({
        title: "Error al subir imagen",
        description: error.message || "No se pudo subir la imagen",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    console.log("[v0] ProfileImageUploader - Removing image")
    if (!image) return

    setIsUploading(true)

    try {
      // Extraer el nombre del archivo de la URL
      const fileName = image.split("/").pop()

      if (fileName) {
        console.log("[v0] ProfileImageUploader - Deleting file:", fileName)

        // Eliminar el archivo de Supabase Storage
        const { error } = await supabase.storage.from("profile-images").remove([fileName])

        if (error) {
          console.error("[v0] ProfileImageUploader - Delete error:", error)
          throw error
        }

        console.log("[v0] ProfileImageUploader - File deleted successfully")
      }

      // Actualizar el estado y notificar al componente padre
      setImage(null)
      onImageUpdate(null)

      toast({
        title: "Imagen eliminada",
        description: "Tu foto de perfil ha sido eliminada. Haz clic en 'Guardar cambios' para confirmar.",
      })
    } catch (error: any) {
      console.error("[v0] ProfileImageUploader - Error deleting image:", error)
      toast({
        title: "Error al eliminar imagen",
        description: error.message || "No se pudo eliminar la imagen",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
        <Avatar className={`${sizeClasses[size]} cursor-pointer border-2 border-primary/20`}>
          {image ? (
            <AvatarImage
              src={image || "/placeholder.svg"}
              alt="Foto de perfil"
              onError={() => {
                console.error("[v0] ProfileImageUploader - Error loading image:", image)
                setImage(null)
              }}
            />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary">
            {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : getInitials()}
          </AvatarFallback>
        </Avatar>

        {/* Overlay con opciones */}
        {isHovering && !isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <div className="flex gap-2">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full bg-white/20 text-white hover:bg-white/30"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
              {image && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full bg-white/20 text-white hover:bg-white/30"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>

      {/* Botón visible solo si no hay imagen */}
      {!image && !isUploading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs bg-transparent"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-3 w-3" />
          Subir foto
        </Button>
      )}

      {/* Estado de carga */}
      {isUploading && <div className="text-sm text-muted-foreground">Procesando imagen...</div>}
    </div>
  )
}
