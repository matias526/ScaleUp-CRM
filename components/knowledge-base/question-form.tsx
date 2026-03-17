"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/file-upload"
import { X, Upload, FileText, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QuestionFormProps {
  questionId?: string
  initialData?: any
}

export function QuestionForm({ questionId, initialData }: QuestionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [techCompanies, setTechCompanies] = useState<any[]>([])
  const [labels, setLabels] = useState<any[]>([])
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [attachments, setAttachments] = useState<any[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)

  const [formData, setFormData] = useState({
    question: initialData?.question || "",
    answer: initialData?.answer || "",
    tech_company_id: initialData?.tech_company_id || "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Cargar tech companies
      const techRes = await fetch("/api/tech-companies")
      const techData = await techRes.json()
      setTechCompanies(techData)

      // Cargar labels
      const labelsRes = await fetch("/api/knowledge-base/labels")
      const labelsData = await labelsRes.json()
      setLabels(labelsData)

      // Si estamos editando, cargar labels y attachments de la pregunta
      if (questionId) {
        const questionRes = await fetch(`/api/knowledge-base/questions/${questionId}`)
        const questionData = await questionRes.json()

        setSelectedLabels(questionData.labels?.map((l: any) => l.id) || [])
        setAttachments(questionData.attachments || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive",
      })
    }
  }

  const handlePendingFileAdd = (file: File) => {
    setPendingFiles([...pendingFiles, file])
  }

  const handlePendingFileRemove = (index: number) => {
    setPendingFiles(pendingFiles.filter((_, i) => i !== index))
  }

  const handleFileUpload = async (file: File) => {
    if (!questionId) {
      handlePendingFileAdd(file)
      return
    }

    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("questionId", questionId)

      const response = await fetch("/api/knowledge-base/attachments", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Error al subir archivo")

      const attachment = await response.json()
      setAttachments([...attachments, attachment])

      toast({
        title: "Archivo adjuntado",
        description: "El archivo se ha adjuntado correctamente",
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error",
        description: "Error al subir el archivo",
        variant: "destructive",
      })
    } finally {
      setUploadingFile(false)
    }
  }

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      const response = await fetch(`/api/knowledge-base/attachments/${attachmentId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Error al eliminar archivo")

      setAttachments(attachments.filter((a) => a.id !== attachmentId))

      toast({
        title: "Archivo eliminado",
        description: "El archivo se ha eliminado correctamente",
      })
    } catch (error) {
      console.error("Error deleting attachment:", error)
      toast({
        title: "Error",
        description: "Error al eliminar el archivo",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = questionId ? `/api/knowledge-base/questions/${questionId}` : "/api/knowledge-base/questions"

      const method = questionId ? "PUT" : "POST"

      const requestBody = {
        ...formData,
        label_ids: selectedLabels,
      }

      console.log("[v0 CLIENT] Enviando request a:", url)
      console.log("[v0 CLIENT] Method:", method)
      console.log("[v0 CLIENT] Body:", JSON.stringify(requestBody, null, 2))

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      console.log("[v0 CLIENT] Response status:", response.status)
      console.log("[v0 CLIENT] Response ok:", response.ok)

      const responseData = await response.json()
      console.log("[v0 CLIENT] Response data:", JSON.stringify(responseData, null, 2))

      if (!response.ok) {
        const errorMessage = `
ERROR AL GUARDAR:
Status: ${response.status}
Message: ${responseData.error || "Unknown error"}
Details: ${responseData.details || "N/A"}
Hint: ${responseData.hint || "N/A"}
Code: ${responseData.code || "N/A"}
        `
        console.error("[v0 CLIENT] ERROR COMPLETO:", errorMessage)
        alert(errorMessage)
        throw new Error(responseData.error || "Error al guardar la pregunta")
      }

      const savedQuestion = responseData

      // Subir archivos pendientes si hay y se ha guardado la pregunta con éxito
      if (pendingFiles.length > 0 && savedQuestion.id) {
        for (const file of pendingFiles) {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("questionId", savedQuestion.id)

          await fetch("/api/knowledge-base/attachments", {
            method: "POST",
            body: formData,
          })
        }
      }

      toast({
        title: questionId ? "Pregunta actualizada" : "Pregunta creada",
        description: questionId
          ? "La pregunta ha sido actualizada correctamente"
          : "La pregunta ha sido creada correctamente",
      })

      router.push(`/dashboard/knowledge-base/${savedQuestion.id}`)
    } catch (error) {
      console.error("[v0 CLIENT] Error saving question:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar la pregunta",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) => (prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{questionId ? "Editar Pregunta Frecuente" : "Nueva Pregunta Frecuente"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="tech_company_id">Tecnología *</Label>
            <Select
              value={formData.tech_company_id}
              onValueChange={(value) => setFormData({ ...formData, tech_company_id: value })}
              required
            >
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

          <div>
            <Label htmlFor="question">Pregunta *</Label>
            <Input
              id="question"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="¿Cuál es tu pregunta?"
              required
            />
          </div>

          <div>
            <Label htmlFor="answer">Respuesta *</Label>
            <Textarea
              id="answer"
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              placeholder="Escribe la respuesta aquí..."
              rows={8}
              required
            />
          </div>

          <div>
            <Label>Labels</Label>
            {labels.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-2">No hay labels disponibles</p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {labels.map((label) => (
                  <Badge
                    key={label.id}
                    variant={selectedLabels.includes(label.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleLabel(label.id)}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Archivos Adjuntos</Label>
            <div className="space-y-2 mt-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm">{attachment.file_name}</span>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveAttachment(attachment.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {pendingFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-yellow-50">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-yellow-600" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">(pendiente)</span>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handlePendingFileRemove(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <FileUpload onUpload={handleFileUpload} maxSizeMB={10}>
                <div className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50">
                  {uploadingFile ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 mx-auto mb-2" />
                      <span className="text-sm">Adjuntar archivo (máx. 10MB)</span>
                    </>
                  )}
                </div>
              </FileUpload>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {questionId ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  )
}
