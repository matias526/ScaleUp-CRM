"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Upload,
  FileText,
  Trash2,
  AlertCircle,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { upload } from "@vercel/blob/client"

interface Document {
  id: string
  filename: string
  file_size: number
  status: string
  tech_companies?: { name: string } | null
  users?: { first_name: string; last_name: string } | null
  created_at: string
  total_chunks?: number
  error_message?: string
}

interface TechCompany {
  id: string
  name: string
}

interface DocumentUploadProps {
  techCompanies: TechCompany[]
  documents: Document[]
}

export function DocumentUpload({ techCompanies, documents: initialDocuments }: DocumentUploadProps) {
  const [selectedTech, setSelectedTech] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [urlInput, setUrlInput] = useState<string>("")
  const [isScrapingUrl, setIsScrapingUrl] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [processingDocId, setProcessingDocId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (!Array.isArray(documents)) {
      console.error("[v0] documents is not an array:", documents)
      return
    }

    const processingDocs = documents.filter((doc) => doc.status === "processing")

    if (processingDocs.length > 0) {
      console.log("[v0] Polling for", processingDocs.length, "processing documents")

      const interval = setInterval(async () => {
        try {
          const response = await fetch("/api/ai-knowledge-base/documents")

          if (!response.ok) {
            console.error("[v0] Polling failed:", response.status)
            return
          }

          const data = await response.json()

          if (!Array.isArray(data)) {
            console.error("[v0] Expected array, got:", typeof data)
            return
          }

          setDocuments(data)

          const stillProcessing = data.filter((doc: Document) => doc.status === "processing")

          if (stillProcessing.length < processingDocs.length) {
            toast({
              title: "Procesamiento completado",
              description: "El documento ha sido procesado exitosamente",
            })
          }
        } catch (error) {
          console.error("[v0] Polling error:", error)
        }
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [documents, toast])

  useEffect(() => {
    setDocuments(initialDocuments)
  }, [initialDocuments])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) setSelectedFile(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const ext = file.name.toLowerCase()
      if (!ext.endsWith(".txt") && !ext.endsWith(".pdf") && !ext.endsWith(".docx") && !ext.endsWith(".xlsx")) {
        toast({
          title: "Formato no soportado",
          description: "Solo se aceptan archivos .txt, .pdf, .docx y .xlsx",
          variant: "destructive",
        })
        return
      }
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedTech) {
      toast({
        title: "Error",
        description: "Selecciona una tecnología y un archivo",
        variant: "destructive",
      })
      return
    }

    const ext = selectedFile.name.toLowerCase()
    if (!ext.endsWith(".txt") && !ext.endsWith(".pdf") && !ext.endsWith(".docx") && !ext.endsWith(".xlsx")) {
      toast({
        title: "Formato no soportado",
        description: "Solo se aceptan archivos .txt, .pdf, .docx y .xlsx",
        variant: "destructive",
      })
      return
    }

    const maxSize = 50 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      toast({
        title: "Archivo demasiado grande",
        description: "El archivo no puede superar los 50MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      console.log("[v0] Uploading file:", selectedFile.name)

      const blob = await upload(selectedFile.name, selectedFile, {
        access: "public",
        handleUploadUrl: "/api/ai-knowledge-base/documents/upload-url",
      })

      console.log("[v0] File uploaded to Blob:", blob.url)

      const completeResponse = await fetch("/api/ai-knowledge-base/documents/upload-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl: blob.url,
          filename: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
          techCompanyId: selectedTech,
        }),
      })

      if (!completeResponse.ok) {
        const error = await completeResponse.json()
        throw new Error(error.error || "Error al completar el upload")
      }

      const data = await completeResponse.json()
      console.log("[v0] Upload completed:", data)

      toast({
        title: "Documento subido",
        description: ext.endsWith(".pdf")
          ? "El PDF se procesará en el servidor. Haz clic en el botón de procesar para extraer el texto."
          : ext.endsWith(".docx")
            ? "El documento Word se está procesando..."
            : ext.endsWith(".xlsx")
              ? "El archivo Excel se está procesando..."
              : "El documento se está procesando en segundo plano...",
      })

      setSelectedFile(null)
      setSelectedTech("")
      setDocuments((prev) => [data, ...prev])
    } catch (error: any) {
      console.error("[v0] Upload error:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo subir el documento",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleScrapeUrl = async () => {
    if (!urlInput || !selectedTech) {
      toast({
        title: "Error",
        description: "Ingresa una URL y selecciona una tecnología",
        variant: "destructive",
      })
      return
    }

    // Validate URL
    try {
      new URL(urlInput)
    } catch {
      toast({
        title: "URL inválida",
        description: "Por favor ingresa una URL válida (ej: https://ejemplo.com)",
        variant: "destructive",
      })
      return
    }

    setIsScrapingUrl(true)
    try {
      console.log("[v0] Scraping URL:", urlInput)

      const response = await fetch("/api/ai-knowledge-base/documents/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: urlInput,
          techCompanyId: selectedTech,
        }),
      })

      const data = await response.json()
      console.log("[v0] Scrape response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar la URL")
      }

      toast({
        title: "URL procesada",
        description: `Se extrajeron ${data.chunksProcessed} fragmentos de contenido`,
      })

      setUrlInput("")
      setSelectedTech("")
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Scrape error:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar la URL",
        variant: "destructive",
      })
    } finally {
      setIsScrapingUrl(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este documento?")) return

    try {
      const response = await fetch(`/api/ai-knowledge-base/documents/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar el documento")
      }

      toast({
        title: "Documento eliminado",
        description: "El documento ha sido eliminado correctamente",
      })

      setDocuments((prev) => prev.filter((doc) => doc.id !== id))
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento",
        variant: "destructive",
      })
    }
  }

  const handleProcess = async (id: string) => {
    setProcessingDocId(id)
    try {
      console.log("[v0] Processing document:", id)

      const response = await fetch(`/api/ai-knowledge-base/documents/${id}/process`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al procesar el documento")
      }

      const result = await response.json()
      console.log("[v0] Process result:", result)

      toast({
        title: "Procesamiento iniciado",
        description: "El documento se está procesando. Esto puede tomar varios minutos...",
      })

      setDocuments((prev) => prev.map((doc) => (doc.id === id ? { ...doc, status: "processing" } : doc)))
    } catch (error: any) {
      console.error("[v0] Process error:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar el documento",
        variant: "destructive",
      })
    } finally {
      setProcessingDocId(null)
    }
  }

  const checkDetailedStatus = async (docId: string) => {
    try {
      const response = await fetch(`/api/ai-knowledge-base/documents/${docId}/status`)
      if (response.ok) {
        const status = await response.json()
        console.log("[v0] Detailed status:", status)

        if (status.error_message) {
          toast({
            title: "Error en procesamiento",
            description: status.error_message,
            variant: "destructive",
          })
        } else if (status.status === "completed") {
          toast({
            title: "Procesamiento completado",
            description: `${status.total_chunks} fragmentos generados exitosamente`,
          })
        } else if (status.status === "processing") {
          toast({
            title: "Procesando...",
            description: `${status.chunks_in_db} de ${status.total_chunks || "?"} fragmentos procesados`,
          })
        } else if (status.status === "pending") {
          toast({
            title: "Pendiente de procesamiento",
            description: "Haz clic en el botón de refresh para iniciar el procesamiento",
          })
        }
      }
    } catch (error) {
      console.error("[v0] Error checking status:", error)
      toast({
        title: "Error",
        description: "No se pudo verificar el estado del documento",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            <CheckCircle2 className="h-3 w-3" />
            Completado
          </span>
        )
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
            <Loader2 className="h-3 w-3 animate-spin" />
            Procesando...
          </span>
        )
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            <XCircle className="h-3 w-3" />
            Error
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
            <Clock className="h-3 w-3" />
            Pendiente
          </span>
        )
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const groupedDocuments = documents.reduce(
    (acc, doc) => {
      const techName = doc.tech_companies?.name || "Sin asignar"
      if (!acc[techName]) {
        acc[techName] = []
      }
      acc[techName].push(doc)
      return acc
    },
    {} as Record<string, Document[]>,
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subir Documento</CardTitle>
          <CardDescription>
            Sube documentos para entrenar a Mika Techie, o ingresa una URL para extraer contenido automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Nota:</strong> Los archivos PDF, Word (.docx) y Excel (.xlsx) se procesarán en el servidor. Las
              URLs se procesan automáticamente.
            </AlertDescription>
          </Alert>

          <div>
            <label className="text-sm font-medium mb-2 block">Tecnología</label>
            <Select value={selectedTech} onValueChange={setSelectedTech}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una tecnología" />
              </SelectTrigger>
              <SelectContent>
                {techCompanies.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium block">URL de página web</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://ejemplo.com/documentacion"
                className="flex-1 px-3 py-2 border rounded-md text-sm"
                disabled={isScrapingUrl}
              />
              <Button onClick={handleScrapeUrl} disabled={!urlInput || !selectedTech || isScrapingUrl}>
                {isScrapingUrl ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Extraer contenido"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresa la URL de una página web para extraer su contenido automáticamente
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O sube un archivo</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Archivo</label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-gray-300"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-blue-500" />
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  <Button variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
                    Cambiar archivo
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="text-sm text-muted-foreground">
                    Arrastra un archivo .txt, .pdf, .docx o .xlsx aquí o haz clic para seleccionar
                  </p>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".txt,.pdf,.docx,.xlsx"
                    className="hidden"
                    id="file-upload"
                  />
                  <Button variant="outline" size="sm" onClick={() => document.getElementById("file-upload")?.click()}>
                    Seleccionar archivo
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Button onClick={handleUpload} disabled={!selectedFile || !selectedTech || isUploading} className="w-full">
            {isUploading ? "Subiendo..." : "Subir Documento"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentos Subidos</CardTitle>
          <CardDescription>{Array.isArray(documents) ? documents.length : 0} documentos en total</CardDescription>
        </CardHeader>
        <CardContent>
          {!Array.isArray(documents) || documents.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No hay documentos subidos aún</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedDocuments)
                .sort(([a], [b]) => {
                  if (a === "Sin asignar") return 1
                  if (b === "Sin asignar") return -1
                  return a.localeCompare(b)
                })
                .map(([techName, docs]) => (
                  <div key={techName} className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <h3 className="font-semibold text-sm">{techName}</h3>
                      <span className="text-xs text-muted-foreground">({docs.length})</span>
                    </div>
                    <div className="space-y-2 pl-4">
                      {docs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{doc.filename}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(doc.file_size)}
                                {doc.users && (
                                  <>
                                    {" "}
                                    • {doc.users.first_name} {doc.users.last_name}
                                  </>
                                )}
                              </p>
                              {doc.status === "processing" && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Esto puede tomar varios minutos dependiendo del tamaño del archivo...
                                </p>
                              )}
                              {doc.status === "completed" && (
                                <p
                                  className={`text-xs mt-1 font-medium ${
                                    doc.total_chunks && doc.total_chunks > 0
                                      ? "text-green-600"
                                      : "text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded inline-block"
                                  }`}
                                >
                                  {doc.total_chunks && doc.total_chunks > 0
                                    ? `${doc.total_chunks} fragmentos indexados`
                                    : "⚠️ Sin fragmentos - Procesar nuevamente"}
                                </p>
                              )}
                              {doc.status === "failed" && doc.error_message && (
                                <p className="text-xs text-red-600 mt-1">Error: {doc.error_message}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(doc.status)}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => checkDetailedStatus(doc.id)}
                              title="Ver estado detallado"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                            {(doc.status === "pending" ||
                              doc.status === "failed" ||
                              (doc.status === "completed" && (!doc.total_chunks || doc.total_chunks === 0))) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleProcess(doc.id)}
                                disabled={processingDocId === doc.id}
                                title={
                                  doc.status === "failed"
                                    ? "Reintentar procesamiento"
                                    : doc.total_chunks === 0
                                      ? "Procesar documento sin fragmentos"
                                      : "Procesar documento"
                                }
                              >
                                <RefreshCw
                                  className={`h-4 w-4 text-blue-500 ${processingDocId === doc.id ? "animate-spin" : ""}`}
                                />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(doc.id)}
                              title="Eliminar documento"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
