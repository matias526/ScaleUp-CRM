"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Trash2, Save, ArrowLeft, GripVertical } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
//import { es, en, pt } from "date-fns/locale"
import { es } from "date-fns/locale/es"
import { enUS as en } from "date-fns/locale/en-US"
import { pt } from "date-fns/locale/pt"
import Link from "next/link"
import { toast } from "sonner"

interface InternalMeeting {
  id: string
  meeting_date: string
  weekly_topic: string
  status: "scheduled" | "in_progress" | "completed"
  created_by: string
  created_at: string
  updated_at: string
  closing_notes?: string
}

interface NewsItem {
  id?: string
  title: string
  description: string
  image_url?: string
  order_index: number
}

const translations = {
  es: {
    title: "Preparar Reunión Interna",
    edit_title: "Editar Reunión Interna",
    back: "Volver",
    meeting_details: "Detalles de la Reunión",
    date: "Fecha",
    topic: "Tema Semanal",
    status: "Estado",
    news_section: "Noticias Generales",
    news_description: "Agrega las noticias que se compartirán en la reunión",
    add_news: "Agregar Noticia",
    news_title: "Título de la Noticia",
    news_description_field: "Descripción",
    news_image: "Imagen (Opcional)",
    save: "Guardar Reunión",
    cancel: "Cancelar",
    loading: "Cargando...",
    saving: "Guardando...",
    success: "Reunión guardada exitosamente",
    error: "Error al guardar la reunión",
    delete_news: "Eliminar noticia",
    no_news: "No hay noticias agregadas",
    status_options: {
      scheduled: "Programada",
      in_progress: "En Progreso",
      completed: "Completada",
    },
  },
  en: {
    title: "Prepare Internal Meeting",
    edit_title: "Edit Internal Meeting",
    back: "Back",
    meeting_details: "Meeting Details",
    date: "Date",
    topic: "Weekly Topic",
    status: "Status",
    news_section: "General News",
    news_description: "Add news to be shared in the meeting",
    add_news: "Add News",
    news_title: "News Title",
    news_description_field: "Description",
    news_image: "Image (Optional)",
    save: "Save Meeting",
    cancel: "Cancel",
    loading: "Loading...",
    saving: "Saving...",
    success: "Meeting saved successfully",
    error: "Error saving meeting",
    delete_news: "Delete news",
    no_news: "No news added",
    status_options: {
      scheduled: "Scheduled",
      in_progress: "In Progress",
      completed: "Completed",
    },
  },
  pt: {
    title: "Preparar Reunião Interna",
    edit_title: "Editar Reunião Interna",
    back: "Voltar",
    meeting_details: "Detalhes da Reunião",
    date: "Data",
    topic: "Tópico Semanal",
    status: "Status",
    news_section: "Notícias Gerais",
    news_description: "Adicione notícias para compartilhar na reunião",
    add_news: "Adicionar Notícia",
    news_title: "Título da Notícia",
    news_description_field: "Descrição",
    news_image: "Imagem (Opcional)",
    save: "Salvar Reunião",
    cancel: "Cancelar",
    loading: "Carregando...",
    saving: "Salvando...",
    success: "Reunião salva com sucesso",
    error: "Erro ao salvar reunião",
    delete_news: "Excluir notícia",
    no_news: "Nenhuma notícia adicionada",
    status_options: {
      scheduled: "Agendada",
      in_progress: "Em Progresso",
      completed: "Concluída",
    },
  },
}

export default function InternalMeetingPreparation() {
  const { userInfo } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const meetingId = searchParams.get("id")

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [meeting, setMeeting] = useState<InternalMeeting | null>(null)

  // Form data
  const [meetingDate, setMeetingDate] = useState("")
  const [weeklyTopic, setWeeklyTopic] = useState("")
  const [status, setStatus] = useState<"scheduled" | "in_progress" | "completed">("scheduled")
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])

  const userLanguage = userInfo?.language || "es"
  const t = translations[userLanguage as keyof typeof translations] || translations.es

  const getDateLocale = () => {
    switch (userLanguage) {
      case "es":
        return es
      case "pt":
        return pt
      default:
        return en
    }
  }

  // Load existing meeting if editing
  useEffect(() => {
    if (meetingId) {
      loadMeeting(meetingId)
    }
  }, [meetingId])

  const loadMeeting = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/internal-meetings/${id}`)
      if (!response.ok) throw new Error("Failed to load meeting")

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || "Failed to load meeting")
      }

      setMeeting(data.meeting)
      setMeetingDate(data.meeting.meeting_date)
      setWeeklyTopic(data.meeting.weekly_topic || "")
      setStatus(data.meeting.status)
      setNewsItems(data.news || [])
    } catch (error) {
      console.error("Error loading meeting:", error)
      toast.error(t.error)
    } finally {
      setLoading(false)
    }
  }

  const addNewsItem = () => {
    const newItem: NewsItem = {
      title: "",
      description: "",
      image_url: "",
      order_index: newsItems.length,
    }
    setNewsItems([...newsItems, newItem])
  }

  const updateNewsItem = (index: number, field: keyof NewsItem, value: string | number) => {
    const updated = [...newsItems]
    updated[index] = { ...updated[index], [field]: value }
    setNewsItems(updated)
  }

  const removeNewsItem = (index: number) => {
    const updated = newsItems.filter((_, i) => i !== index)
    // Reorder indices
    updated.forEach((item, i) => {
      item.order_index = i
    })
    setNewsItems(updated)
  }

  const handleImageUpload = async (index: number, file: File | null) => {
    if (file) {
      try {
        console.log("[v0] Uploading image via API endpoint...")
        console.log("[v0] File details:", { name: file.name, type: file.type, size: file.size })

        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload/news-image", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to upload image")
        }

        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || "Failed to upload image")
        }

        console.log("[v0] Image uploaded successfully:", result.filename)
        // Store only the filename in the database
        updateNewsItem(index, "image_url", result.filename)
        toast.success("Imagen subida exitosamente")
      } catch (error) {
        console.error("Error uploading image:", error)
        toast.error(`Error al subir la imagen: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    } else {
      updateNewsItem(index, "image_url", "")
    }
  }

  const saveMeeting = async () => {
    if (!meetingDate || !weeklyTopic.trim()) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    setSaving(true)
    try {
      console.log("[v0] All news items before filtering:", newsItems)

      const filteredNewsItems = newsItems.filter((item) => item.title.trim())
      console.log("[v0] Filtered news items:", filteredNewsItems)

      const meetingData = {
        meeting_date: meetingDate,
        weekly_topic: weeklyTopic,
        status,
        news_items: filteredNewsItems,
      }

      const url = meetingId ? `/api/internal-meetings/${meetingId}` : "/api/internal-meetings"
      const method = meetingId ? "PUT" : "POST"

      console.log("[v0] Saving meeting with data:", meetingData)

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meetingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save meeting")
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to save meeting")
      }

      console.log("[v0] Meeting saved successfully:", result)
      toast.success(t.success)
      router.push("/dashboard/internal-meetings")
    } catch (error) {
      console.error("Error saving meeting:", error)
      toast.error(t.error)
    } finally {
      setSaving(false)
    }
  }

  if (!userInfo?.isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Esta funcionalidad está disponible solo para administradores</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 animate-pulse rounded w-64"></div>
        <div className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
        <div className="h-48 bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/internal-meetings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.back}
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{meetingId ? t.edit_title : t.title}</h1>
        </div>
      </div>

      {/* Meeting Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t.meeting_details}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="meeting-date">{t.date}</Label>
              <Input
                id="meeting-date"
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{t.status}</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "scheduled" | "in_progress" | "completed")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="scheduled">{t.status_options.scheduled}</option>
                <option value="in_progress">{t.status_options.in_progress}</option>
                <option value="completed">{t.status_options.completed}</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weekly-topic">{t.topic}</Label>
            <Input
              id="weekly-topic"
              value={weeklyTopic}
              onChange={(e) => setWeeklyTopic(e.target.value)}
              placeholder="Ej: Revisión de objetivos Q1 2024"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* News Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t.news_section}</CardTitle>
              <CardDescription>{t.news_description}</CardDescription>
            </div>
            <Button onClick={addNewsItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t.add_news}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {newsItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t.no_news}</div>
          ) : (
            <div className="space-y-6">
              {newsItems.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">Noticia {index + 1}</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeNewsItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t.news_title}</Label>
                      <Input
                        value={item.title}
                        onChange={(e) => updateNewsItem(index, "title", e.target.value)}
                        placeholder="Título de la noticia"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.news_image}</Label>
                      <div className="space-y-2">
                        {item.image_url && (
                          <div className="relative w-full h-32 border rounded-md overflow-hidden">
                            <img
                              src={item.image_url || "/placeholder.svg"}
                              alt="Preview"
                              className="w-full h-full object-contain"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() => updateNewsItem(index, "image_url", "")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        <Input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleImageUpload(index, file)
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t.news_description_field}</Label>
                    <Textarea
                      value={item.description}
                      onChange={(e) => updateNewsItem(index, "description", e.target.value)}
                      placeholder="Descripción detallada de la noticia"
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/internal-meetings">{t.cancel}</Link>
        </Button>
        <Button onClick={saveMeeting} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? t.saving : t.save}
        </Button>
      </div>
    </div>
  )
}
