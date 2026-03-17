"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, X, FileText, AlertCircle } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { v4 as uuidv4 } from "uuid"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FileUploadProps {
  onChange?: (fileUrl: string) => void
  onUpload?: (file: File) => void
  value?: string
  opportunityId?: string
  fieldId?: string
  maxSizeMB?: number
  allowedFileTypes?: string[]
  accept?: string
  maxSize?: number
  children?: React.ReactNode
}

// Configuración predeterminada de seguridad
const DEFAULT_MAX_SIZE_MB = 5 // 5MB por defecto
const DEFAULT_ALLOWED_FILE_TYPES = [
  // Documentos
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  // Imágenes
  "jpg",
  "jpeg",
  "png",
  "gif",
  "svg",
  // Comprimidos
  "zip",
  "rar",
]

// Mapeo de extensiones a tipos MIME
const MIME_TYPES_MAP = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  csv: "text/csv",
  zip: "application/zip",
  rar: "application/x-rar-compressed",
}

// Función para formatear la lista de tipos de archivo de manera amigable
const formatAllowedFileTypes = (types: string[]): string => {
  // Agrupar por categorías
  const images = types.filter((t) => ["jpg", "jpeg", "png", "gif", "svg"].includes(t))
  const documents = types.filter((t) => ["pdf", "doc", "docx", "txt", "csv"].includes(t))
  const spreadsheets = types.filter((t) => ["xls", "xlsx"].includes(t))
  const presentations = types.filter((t) => ["ppt", "pptx"].includes(t))
  const compressed = types.filter((t) => ["zip", "rar"].includes(t))

  const categories = []
  if (images.length > 0) categories.push(`Imágenes (${images.join(", ")})`)
  if (documents.length > 0) categories.push(`Documentos (${documents.join(", ")})`)
  if (spreadsheets.length > 0) categories.push(`Hojas de cálculo (${spreadsheets.join(", ")})`)
  if (presentations.length > 0) categories.push(`Presentaciones (${presentations.join(", ")})`)
  if (compressed.length > 0) categories.push(`Archivos comprimidos (${compressed.join(", ")})`)

  return categories.join(", ")
}

// Función para validar el archivo
const validateFile = (
  file: File,
  maxSizeMB: number,
  allowedFileTypes: string[],
): { valid: boolean; error?: string } => {
  // Validar tamaño
  const fileSizeInMB = file.size / (1024 * 1024)
  if (fileSizeInMB > maxSizeMB) {
    return {
      valid: false,
      error: `El archivo excede el tamaño máximo permitido (${maxSizeMB}MB). Tamaño actual: ${fileSizeInMB.toFixed(2)}MB.`,
    }
  }

  // Validar extensión
  const fileExt = file.name.split(".").pop()?.toLowerCase() || ""
  console.log("Extensión del archivo:", fileExt)
  console.log("Tipos permitidos:", allowedFileTypes)

  // Si allowedFileTypes está vacío o contiene "*", permitir cualquier tipo
  if (allowedFileTypes.length === 0 || allowedFileTypes.includes("*")) {
    return { valid: true }
  }

  if (!allowedFileTypes.includes(fileExt)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Formatos aceptados: ${formatAllowedFileTypes(allowedFileTypes)}`,
    }
  }

  return { valid: true }
}

export function FileUpload({
  onChange,
  onUpload,
  value,
  opportunityId,
  fieldId,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  allowedFileTypes = DEFAULT_ALLOWED_FILE_TYPES,
  accept = "*",
  maxSize = 5,
  children,
}: FileUploadProps) {
  const [fileName, setFileName] = useState<string>(value ? value.split("/").pop() || "" : "")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bucketMissing, setBucketMissing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const supabase = createClientComponentClient()

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      handleFile(file)
    }
  }

  const handleFile = (file: File) => {
    // Validar el archivo
    const validation = validateFile(file, maxSizeMB, allowedFileTypes)
    if (!validation.valid) {
      setError(validation.error || "Archivo no válido")
      return
    }

    // Si tenemos onUpload, usamos esa función (para el componente OpportunityTechFields)
    if (onUpload) {
      onUpload(file)
      return
    }

    // Si no, procedemos con la carga normal
    handleFileUpload(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log("Archivo seleccionado:", file.name, file.type)
    console.log("Tipos permitidos:", allowedFileTypes)
    console.log("Accept attribute:", prepareAcceptAttribute())

    handleFile(file)
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setError(null)
    setBucketMissing(false)

    try {
      // Obtener extensión del archivo
      const fileExt = file.name.split(".").pop()?.toLowerCase() || ""
      // Crear nombre único para el archivo
      const uniqueFileName = `${opportunityId || "temp"}_${fieldId || "field"}_${uuidv4()}_${file.name}`
      const filePath = uniqueFileName

      console.log("Iniciando carga de archivo:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uniqueFileName,
      })

      // Intentar subir el archivo
      const { data, error: uploadError } = await supabase.storage.from("opportunity_files").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        console.error("Error al subir el archivo:", uploadError)

        // Verificar si el error es porque el bucket no existe
        if (uploadError.message.includes("bucket") || uploadError.code === "404") {
          setBucketMissing(true)
          throw new Error("El bucket de almacenamiento no existe. Contacte al administrador.")
        }

        throw new Error(`${uploadError.message}`)
      }

      console.log("Archivo subido correctamente:", data)

      // Obtener URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from("opportunity_files").getPublicUrl(filePath)

      console.log("URL pública obtenida:", publicUrl)

      setFileName(file.name)
      if (onChange) {
        onChange(filePath) // Cambiado de publicUrl a filePath para mantener consistencia
      }
    } catch (err) {
      console.error("Error completo al subir el archivo:", err)
      setError(err.message || "Error desconocido al subir el archivo")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    if (inputRef.current) {
      inputRef.current.value = ""
    }
    setFileName("")
    if (onChange) {
      onChange("")
    }
    setError(null)
  }

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click()
    }
  }

  // Preparar el atributo accept para el input de archivo
  const prepareAcceptAttribute = () => {
    // Si se proporciona accept directamente y no es "*", usarlo
    if (accept !== "*") return accept

    // Si allowedFileTypes está vacío o contiene "*", aceptar cualquier tipo
    if (allowedFileTypes.length === 0 || allowedFileTypes.includes("*")) {
      return "*/*"
    }

    // De lo contrario, construir a partir de allowedFileTypes
    return allowedFileTypes
      .map((ext) => {
        // Intentar obtener el tipo MIME correspondiente
        const mimeType = MIME_TYPES_MAP[ext]
        // Si existe un tipo MIME, usarlo; de lo contrario, usar la extensión
        return mimeType || `.${ext}`
      })
      .join(",")
  }

  // Si se proporciona children, renderizar un componente personalizable
  if (children) {
    return (
      <div
        className={`cursor-pointer ${isDragging ? "border-primary bg-primary/10" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept={prepareAcceptAttribute()}
        />
        {children}
      </div>
    )
  }

  // De lo contrario, renderizar el componente estándar
  return (
    <div className="space-y-2">
      {fileName ? (
        <div className="flex items-center justify-between p-2 border rounded-md">
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-2 text-blue-500" />
            <span className="text-sm truncate max-w-[200px]">{fileName}</span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleRemove} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div>
          <Input
            ref={inputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept={prepareAcceptAttribute()}
          />
          <div
            className={`border border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
              isDragging ? "border-primary bg-primary/10" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            {isUploading ? (
              <div className="flex flex-col items-center justify-center">
                <svg
                  className="animate-spin h-6 w-6 mb-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Subiendo archivo...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <Upload className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Haz clic o arrastra un archivo aquí</span>
                <span className="text-xs text-gray-500 mt-1">
                  Máx. {maxSizeMB}MB. {formatAllowedFileTypes(allowedFileTypes)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
          {bucketMissing && (
            <AlertDescription className="text-sm mt-1">
              <strong>Solución:</strong> El administrador debe ejecutar el script SQL para crear el bucket de
              almacenamiento.
            </AlertDescription>
          )}
        </Alert>
      )}
    </div>
  )
}
