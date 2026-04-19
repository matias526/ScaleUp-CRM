"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/components/auth/auth-provider"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Users, Play, Pause, Maximize, Minimize } from "lucide-react"
import TechCompanyDashboard from "./tech-company-dashboard"
import UserStatusDashboard from "./user-status-dashboard"
import InternalMeetingSummary from "./internal-meeting-summary"

interface InternalMeeting {
  id: string
  meeting_date: string
  weekly_topic: string
  status: "scheduled" | "in_progress" | "completed"
}

interface Participant {
  id: string
  first_name: string
  last_name: string
  email: string
  role_code: string
}

interface MeetingStage {
  id: number
  name: string
  duration: number // en minutos
  description: string
}

interface NewsItem {
  id: string
  title: string
  description: string
  image_url?: string
}

const MEETING_STAGES: MeetingStage[] = [
  { id: 1, name: "Small Talk", duration: 5, description: "Conversación informal para comenzar" },
  { id: 2, name: "Noticias Generales", duration: 5, description: "Revisión de noticias importantes" },
  { id: 3, name: "Status de Empresas Portfolio", duration: 20, description: "Estado de las empresas del portfolio" },
  { id: 4, name: "Status Individual", duration: 20, description: "Estado individual de cada miembro" },
  { id: 5, name: "Tema Semanal", duration: 5, description: "Tema específico de la semana" },
  { id: 6, name: "Cierre y Próximos Pasos", duration: 5, description: "Conclusiones y próximos pasos" },
]

export default function InternalMeetingExecution() {
  const params = useParams() // Agregamos esto
  const searchParams = useSearchParams()
  const meetingId = params?.id as string
  const { userInfo } = useAuth()

  const [meeting, setMeeting] = useState<InternalMeeting | null>(null)
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [presentParticipants, setPresentParticipants] = useState<string[]>([])
  const [currentStage, setCurrentStage] = useState(1)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)

  useEffect(() => {
    const loadMeetingData = async () => {
      if (!meetingId) return

      try {
        // Cargar datos de la reunión
        const meetingResponse = await fetch(`/api/internal-meetings/${meetingId}`)
        if (meetingResponse.ok) {
          const meetingResult = await meetingResponse.json()
          if (meetingResult.success) {
            setMeeting(meetingResult.meeting)
            setNewsItems(meetingResult.news || [])
            console.log("[v0] Loaded news items:", meetingResult.news?.length || 0)
          }
        }

        // Cargar participantes (usuarios con roles Admin y BDD)
        const participantsResponse = await fetch("/api/users?roles=Admin,BDD")
        if (participantsResponse.ok) {
          const participantsResult = await participantsResponse.json()
          if (participantsResult.success) {
            setParticipants(participantsResult.users)
          }
        }
      } catch (error) {
        console.error("Error loading meeting data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMeetingData()
  }, [meetingId])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((time) => {
          if (time <= 1) {
            setIsTimerRunning(false)
            return 0
          }
          return time - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, timeRemaining])

  useEffect(() => {
    const stage = MEETING_STAGES.find((s) => s.id === currentStage)
    if (stage) {
      setTimeRemaining(stage.duration * 60) // convertir minutos a segundos
      setIsTimerRunning(currentStage === 4 || currentStage === 2 || currentStage === 3 || currentStage === 5)
    }
  }, [currentStage])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleParticipantToggle = async (participantId: string) => {
    const isCurrentlyPresent = presentParticipants.includes(participantId)
    const newAttendedStatus = !isCurrentlyPresent

    setPresentParticipants((prev) =>
      newAttendedStatus ? [...prev, participantId] : prev.filter((id) => id !== participantId),
    )

    try {
      const response = await fetch(`/api/internal-meetings/${meetingId}/participants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: participantId,
          attended: newAttendedStatus,
        }),
      })

      if (!response.ok) {
        console.error("Failed to update participant attendance")
        setPresentParticipants((prev) =>
          isCurrentlyPresent ? [...prev, participantId] : prev.filter((id) => id !== participantId),
        )
      }
    } catch (error) {
      console.error("Error updating participant attendance:", error)
      setPresentParticipants((prev) =>
        isCurrentlyPresent ? [...prev, participantId] : prev.filter((id) => id !== participantId),
      )
    }
  }

  const handleNextStage = () => {
    if (currentStage < MEETING_STAGES.length) {
      setCurrentStage(currentStage + 1)
      if (currentStage === 2) {
        setCurrentNewsIndex(0) // Reset news index when entering news stage
      }
    }
  }

  const handlePrevStage = () => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1)
    }
  }

  const handleNextNews = () => {
    if (newsItems && currentNewsIndex < newsItems.length - 1) {
      setCurrentNewsIndex(currentNewsIndex + 1)
    }
  }

  const handlePrevNews = () => {
    if (currentNewsIndex > 0) {
      setCurrentNewsIndex(currentNewsIndex - 1)
    }
  }

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleFinishMeeting = async () => {
    if (!meetingId || !meeting) return

    setIsFinishing(true)
    try {
      const response = await fetch(`/api/internal-meetings/${meetingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meeting_date: meeting.meeting_date,
          weekly_topic: meeting.weekly_topic,
          status: "completed",
          news_items: [], // No need to update news
        }),
      })

      if (response.ok) {
        console.log("[v0] Meeting finished successfully")
        // Redirect to overview
        window.location.href = "/dashboard/internal-meetings"
      } else {
        console.error("[v0] Failed to finish meeting")
        alert("Error al finalizar la reunión")
      }
    } catch (error) {
      console.error("[v0] Error finishing meeting:", error)
      alert("Error al finalizar la reunión")
    } finally {
      setIsFinishing(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando reunión...</div>
  }

  if (!meeting) {
    return <div className="flex items-center justify-center h-64">Reunión no encontrada</div>
  }

  const currentStageData = MEETING_STAGES.find((s) => s.id === currentStage)
  const currentNews = newsItems && newsItems.length > 0 ? newsItems[currentNewsIndex] : null

  return (
    <div className={`bg-gray-50 ${isFullscreen ? "fixed inset-0 z-50 flex flex-col" : "min-h-screen flex flex-col"}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Timer and current step name on left */}
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-blue-600">{formatTime(timeRemaining)}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTimer}
                className="flex items-center gap-2 bg-transparent"
              >
                {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isTimerRunning ? "Pausar" : "Iniciar"}
              </Button>
            </div>
            <div className="text-sm text-gray-600 font-medium">{currentStageData?.name}</div>
          </div>

          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">Reunión de Equipo</h1>
            <p className="text-sm text-gray-500">
              {format(new Date(meeting.meeting_date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>

          <div className="flex items-center">
            <img src="/images/scaleup-logo-color.png" alt="ScaleUp" className="h-12" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-y-auto">
        {/* Left Sidebar - Agenda - Only show for step 1 */}
        {currentStage === 1 && (
          <div className="flex-1 bg-white border-r p-6">
            <h2 className="text-lg font-semibold mb-4">Agenda de Hoy</h2>
            <div className="space-y-2">
              {MEETING_STAGES.map((stage) => (
                <div
                  key={stage.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${currentStage === stage.id ? "bg-blue-100 border border-blue-200" : "hover:bg-gray-50"
                    }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStage === stage.id
                        ? "bg-blue-600 text-white"
                        : currentStage > stage.id
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    {stage.id}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{stage.name}</div>
                    <div className="text-xs text-gray-500">{stage.duration} min</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Center Content - Show for step 1 (empty) and step 2+ (with content) */}
        <div className={`${currentStage === 1 ? "hidden" : "flex-1"} p-6`}>
          {currentStage === 2 && (
            <Card className="h-full">
              <CardContent className="p-8 h-full">
                {newsItems && newsItems.length > 0 ? (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Noticias Generales</h2>
                      <Badge variant="outline">
                        {currentNewsIndex + 1} de {newsItems.length}
                      </Badge>
                    </div>

                    {currentNews && (
                      <div className="flex-1 flex flex-col">
                        <div className="bg-blue-50 rounded-lg p-6 mb-6 flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">{currentNews.title}</h3>
                          {currentNews.description && (
                            <div className="text-gray-700 whitespace-pre-wrap mb-4">{currentNews.description}</div>
                          )}
                          {currentNews.image_url && (
                            <div className="mt-4">
                              <img
                                src={currentNews.image_url || "/placeholder.svg"}
                                alt={currentNews.title}
                                className="max-w-full h-auto rounded-lg shadow-sm"
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            onClick={handlePrevNews}
                            disabled={currentNewsIndex === 0}
                            className="flex items-center gap-2 bg-transparent"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                          </Button>

                          <div className="flex gap-2">
                            {newsItems.map((_, index) => (
                              <div
                                key={index}
                                className={`w-2 h-2 rounded-full ${index === currentNewsIndex ? "bg-blue-600" : "bg-gray-300"
                                  }`}
                              />
                            ))}
                          </div>

                          <Button
                            variant="outline"
                            onClick={handleNextNews}
                            disabled={currentNewsIndex === newsItems.length - 1}
                            className="flex items-center gap-2 bg-transparent"
                          >
                            Siguiente
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Noticias Generales</h2>
                      <p className="text-gray-600">No hay noticias cargadas para esta reunión</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentStage === 3 && <TechCompanyDashboard meetingId={meetingId || undefined} />}

          {currentStage === 4 && <UserStatusDashboard meetingId={meetingId || undefined} />}

          {currentStage === 5 && (
            <Card className="h-full">
              <CardContent className="p-8 h-full flex flex-col items-center justify-center">
                <div className="text-center max-w-md">
                  <h2 className="text-5xl font-bold text-gray-900 mb-4">{currentStageData?.name}</h2>
                  <p className="text-lg text-gray-600 mb-8">{currentStageData?.description}</p>
                  <div className="text-6xl font-bold text-blue-600 mb-4">{formatTime(timeRemaining)}</div>
                  <p className="text-sm text-gray-500">{currentStageData?.duration} minutos para esta etapa</p>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStage === 6 && (
            <InternalMeetingSummary
              meetingId={meetingId || ""}
              meetingDate={meeting.meeting_date}
              weeklyTopic={meeting.weekly_topic}
            />
          )}
        </div>

        {/* Right Sidebar - Participants - Only show for step 1 */}
        {currentStage === 1 && (
          <div className="flex-1 bg-white border-l p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Participantes</h2>
              <Badge variant="outline" className="ml-auto">
                {presentParticipants.length} / {participants.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <Checkbox
                    checked={presentParticipants.includes(participant.id)}
                    onCheckedChange={() => handleParticipantToggle(participant.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {participant.first_name} {participant.last_name}
                    </div>
                  </div>
                  <Badge
                    variant={presentParticipants.includes(participant.id) ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {presentParticipants.includes(participant.id) ? "Presente" : "Ausente"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {MEETING_STAGES.map((stage, index) => (
              <div
                key={stage.id}
                className={`w-3 h-3 rounded-full ${currentStage === stage.id ? "bg-blue-600" : currentStage > stage.id ? "bg-green-500" : "bg-gray-300"
                  }`}
              />
            ))}
            <span className="text-sm text-gray-600 ml-2">
              Etapa {currentStage} de {MEETING_STAGES.length} • {currentStageData?.name} • {formatTime(timeRemaining)}{" "}
              restantes
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handlePrevStage} disabled={currentStage === 1}>
              Anterior
            </Button>
            {currentStage === MEETING_STAGES.length ? (
              <Button onClick={handleFinishMeeting} disabled={isFinishing}>
                {isFinishing ? "Finalizando..." : "Finalizar Reunión"}
              </Button>
            ) : (
              <Button onClick={handleNextStage}>
                Siguiente: {MEETING_STAGES.find((s) => s.id === currentStage + 1)?.name}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="p-2">
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
