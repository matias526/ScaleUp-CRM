"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, MessageSquare } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FeedbackItem {
  id: string
  rating: number
  comment: string
  created_at: string
  kb_messages: {
    content: string
    kb_conversations: {
      tech_companies: {
        name: string
      }
    }
  }
  users: {
    first_name: string
    last_name: string
    email: string
  }
}

interface TechCompany {
  id: string
  name: string
}

interface FeedbackDashboardProps {
  techCompanies: TechCompany[]
}

export function FeedbackDashboard({ techCompanies }: FeedbackDashboardProps) {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [selectedTech, setSelectedTech] = useState<string>("all")
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadFeedback()
  }, [selectedTech, ratingFilter])

  const loadFeedback = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedTech !== "all") params.append("tech_company_id", selectedTech)
      if (ratingFilter !== "all") params.append("rating", ratingFilter)

      const response = await fetch(`/api/ai-knowledge-base/feedback?${params}`)
      if (!response.ok) throw new Error("Error al cargar feedback")

      const data = await response.json()
      setFeedback(data.data || [])
    } catch (error) {
      console.error("[v0] Error loading feedback:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const stats = {
    total: feedback.length,
    positive: feedback.filter((f) => f.rating === 1).length,
    negative: feedback.filter((f) => f.rating === -1).length,
    withComments: feedback.filter((f) => f.comment).length,
  }

  const positiveRate = stats.total > 0 ? ((stats.positive / stats.total) * 100).toFixed(1) : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Positivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-500" />
              <div className="text-2xl font-bold">{stats.positive}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Negativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ThumbsDown className="h-5 w-5 text-red-500" />
              <div className="text-2xl font-bold">{stats.negative}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Satisfacción</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {Number.parseFloat(positiveRate as string) >= 70 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <div className="text-2xl font-bold">{positiveRate}%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra el feedback por tecnología y calificación</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Tecnología</label>
            <Select value={selectedTech} onValueChange={setSelectedTech}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {techCompanies.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Calificación</label>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="1">Positivo</SelectItem>
                <SelectItem value="-1">Negativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback Reciente</CardTitle>
          <CardDescription>{feedback.length} registros</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Cargando...</p>
          ) : feedback.length === 0 ? (
            <Alert>
              <MessageSquare className="h-4 w-4" />
              <AlertDescription>No hay feedback disponible con los filtros seleccionados</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {feedback.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {item.rating === 1 ? (
                          <ThumbsUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <ThumbsDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium">
                          {item.users.first_name} {item.users.last_name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {item.kb_messages.kb_conversations.tech_companies.name}
                        </span>
                      </div>
                      <p className="text-sm bg-gray-50 p-3 rounded mb-2">{item.kb_messages.content}</p>
                      {item.comment && (
                        <p className="text-sm text-muted-foreground italic">Comentario: {item.comment}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
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
