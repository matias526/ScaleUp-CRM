"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Plus, Settings } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { format } from "date-fns"
import { es, en, pt } from "date-fns/locale"
import Link from "next/link"

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

const translations = {
  es: {
    title: "Reuniones Internas",
    description: "Gestiona las reuniones semanales del equipo",
    new_meeting: "Nueva Reunión",
    next_meeting: "Próxima Reunión",
    date: "Fecha",
    topic: "Tema",
    start_meeting: "Iniciar Reunión",
    no_scheduled: "No hay reuniones programadas",
    schedule_first: "Programar Primera Reunión",
    stats: "Estadísticas",
    total_meetings: "Total de Reuniones",
    completed: "Completadas",
    scheduled: "Programadas",
    recent: "Reuniones Recientes",
    recent_description: "Historial de las últimas reuniones del equipo",
    edit: "Editar",
    start: "Iniciar",
    no_meetings: "No hay reuniones registradas",
    admin_only: "Esta funcionalidad está disponible solo para administradores",
    status: {
      scheduled: "Programada",
      in_progress: "En Progreso",
      completed: "Completada",
    },
  },
  en: {
    title: "Internal Meetings",
    description: "Manage weekly team meetings",
    new_meeting: "New Meeting",
    next_meeting: "Next Meeting",
    date: "Date",
    topic: "Topic",
    start_meeting: "Start Meeting",
    no_scheduled: "No meetings scheduled",
    schedule_first: "Schedule First Meeting",
    stats: "Statistics",
    total_meetings: "Total Meetings",
    completed: "Completed",
    scheduled: "Scheduled",
    recent: "Recent Meetings",
    recent_description: "History of recent team meetings",
    edit: "Edit",
    start: "Start",
    no_meetings: "No meetings registered",
    admin_only: "This functionality is available only for administrators",
    status: {
      scheduled: "Scheduled",
      in_progress: "In Progress",
      completed: "Completed",
    },
  },
  pt: {
    title: "Reuniões Internas",
    description: "Gerencie reuniões semanais da equipe",
    new_meeting: "Nova Reunião",
    next_meeting: "Próxima Reunião",
    date: "Data",
    topic: "Tópico",
    start_meeting: "Iniciar Reunião",
    no_scheduled: "Nenhuma reunião agendada",
    schedule_first: "Agendar Primeira Reunião",
    stats: "Estatísticas",
    total_meetings: "Total de Reuniones",
    completed: "Concluídas",
    scheduled: "Agendadas",
    recent: "Reuniões Recentes",
    recent_description: "Histórico das reuniões recentes da equipe",
    edit: "Editar",
    start: "Iniciar",
    no_meetings: "Nenhuma reunião registrada",
    admin_only: "Esta funcionalidade está disponível apenas para administradores",
    status: {
      scheduled: "Agendada",
      in_progress: "Em Progresso",
      completed: "Concluída",
    },
  },
}

const getInternalMeetings = async () => {
  const response = await fetch("/api/internal-meetings")
  if (!response.ok) {
    throw new Error("Failed to fetch meetings")
  }
  const result = await response.json()
  console.log("[v0] API response:", result)
  return result.success && Array.isArray(result.meetings) ? result.meetings : []
}

export default function InternalMeetingsOverview() {
  const { userInfo } = useAuth()
  const [meetings, setMeetings] = useState<InternalMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [nextMeeting, setNextMeeting] = useState<InternalMeeting | null>(null)

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {t.status.scheduled}
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {t.status.in_progress}
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {t.status.completed}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const data = await getInternalMeetings()
        console.log("[v0] Fetched meetings data:", data)
        const meetingsArray = Array.isArray(data) ? data : []
        setMeetings(meetingsArray)

        const scheduledMeetings = meetingsArray.filter((m: InternalMeeting) => m.status === "scheduled")
        console.log("[v0] Scheduled meetings found:", scheduledMeetings)

        // Sort by meeting_date to get the next one
        const sortedScheduled = scheduledMeetings.sort(
          (a: InternalMeeting, b: InternalMeeting) =>
            new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime(),
        )

        setNextMeeting(sortedScheduled[0] || null)
        console.log("[v0] Next meeting set to:", sortedScheduled[0] || null)
      } catch (error) {
        console.error("Error fetching meetings:", error)
        setMeetings([])
      } finally {
        setLoading(false)
      }
    }

    if (userInfo?.isAdmin) {
      fetchMeetings()
    } else {
      setLoading(false)
    }
  }, [userInfo])

  if (!userInfo?.isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t.admin_only}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 animate-pulse rounded w-64"></div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-48 bg-gray-200 animate-pulse rounded-lg"></div>
          <div className="h-48 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
        <div className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">{t.description}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/internal-meetings/preparation">
            <Plus className="mr-2 h-4 w-4" />
            {t.new_meeting}
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Next Meeting Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t.next_meeting}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextMeeting ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t.date}</p>
                  <p className="font-medium">
                    {format(new Date(nextMeeting.meeting_date), "EEEE, d MMMM yyyy", {
                      locale: getDateLocale(),
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.topic}</p>
                  <p className="font-medium">{nextMeeting.weekly_topic}</p>
                </div>
                <div className="flex items-center justify-between">
                  {getStatusBadge(nextMeeting.status)}
                  <Button asChild size="sm">
                    <Link href={`/dashboard/internal-meetings/execute?id=${nextMeeting.id}`}>{t.start_meeting}</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t.no_scheduled}</p>
                <Button asChild className="mt-4" size="sm">
                  <Link href="/dashboard/internal-meetings/preparation">{t.schedule_first}</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t.stats}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.total_meetings}</span>
                <span className="font-medium">{meetings.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.completed}</span>
                <span className="font-medium">{meetings.filter((m) => m.status === "completed").length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.scheduled}</span>
                <span className="font-medium">{meetings.filter((m) => m.status === "scheduled").length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Meetings */}
      <Card>
        <CardHeader>
          <CardTitle>{t.recent}</CardTitle>
          <CardDescription>{t.recent_description}</CardDescription>
        </CardHeader>
        <CardContent>
          {meetings.length > 0 ? (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{meeting.weekly_topic}</p>
                      {getStatusBadge(meeting.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(meeting.meeting_date), "d MMM yyyy", {
                          locale: getDateLocale(),
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {meeting.status === "scheduled" && (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/internal-meetings/preparation?id=${meeting.id}`}>
                          <Settings className="h-4 w-4 mr-1" />
                          {t.edit}
                        </Link>
                      </Button>
                    )}
                    {meeting.status === "scheduled" && (
                      <Button asChild size="sm">
                        <Link href={`/dashboard/internal-meetings/execute?id=${meeting.id}`}>{t.start}</Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t.no_meetings}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
