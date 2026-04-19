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
import { ChevronLeft, ChevronRight, Users, Play, Pause, Maximize, Minimize, Loader2, AlertTriangle } from "lucide-react"
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
  duration: number
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
  const params = useParams()
  const searchParams = useSearchParams()
  // Arreglo clave: Priorizamos el ID de la URL (Next 15) sobre el query param
  const meetingId = (params?.id as string) || searchParams.get("id")
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

  // MANTENEMOS TUS QUERIES ORIGINALES A LA API
  useEffect(() => {
    const loadMeetingData = async () => {
      if (!meetingId) return

      try {
        setLoading(true)
        // Usamos tu ruta original de API
        const meetingResponse = await fetch(`/api/internal-meetings/${meetingId}`)
        if (meetingResponse.ok) {
          const meetingResult = await meetingResponse.json()
          if (meetingResult.success) {
            setMeeting(meetingResult.meeting)
            setNewsItems(meetingResult.news || [])
            console.log("Loaded meeting:", meetingResult.meeting.id)
          }
        }

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
        setTimeRemaining((time) => (time <= 1 ? 0 : time - 1))
      }, 1000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [isTimerRunning, timeRemaining])

  useEffect(() => {
    const stage = MEETING_STAGES.find((s) => s.id === currentStage)
    if (stage) {
      setTimeRemaining(stage.duration * 60)
      setIsTimerRunning([2, 3, 4, 5].includes(currentStage))
    }
  }, [currentStage])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleParticipantToggle = async (participantId: string) => {
    const pathParts = window.location.pathname.split('/')
    const meetingId = pathParts[pathParts.length - 1]
    const isCurrentlyPresent = presentParticipants.includes(participantId)
    const newAttendedStatus = !isCurrentlyPresent

    setPresentParticipants((prev) =>
      newAttendedStatus ? [...prev, participantId] : prev.filter((id) => id !== participantId),
    )

    try {
      await fetch(`/api/internal-meetings/${meetingId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: participantId, attended: newAttendedStatus }),
      })
    } catch (error) {
      console.error("Error updating participant attendance:", error)
    }
  }

  const handleNextStage = () => {
    if (currentStage < MEETING_STAGES.length) {
      setCurrentStage(currentStage + 1)
      if (currentStage === 2) setCurrentNewsIndex(0)
    }
  }

  const handlePrevStage = () => { if (currentStage > 1) setCurrentStage(currentStage - 1) }
  const handleNextNews = () => { if (newsItems && currentNewsIndex < newsItems.length - 1) setCurrentNewsIndex(currentNewsIndex + 1) }
  const handlePrevNews = () => { if (currentNewsIndex > 0) setCurrentNewsIndex(currentNewsIndex - 1) }
  const toggleTimer = () => setIsTimerRunning(!isTimerRunning)
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen)

  const handleFinishMeeting = async () => {
    if (!meetingId || !meeting) return
    setIsFinishing(true)
    try {
      const response = await fetch(`/api/internal-meetings/${meetingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...meeting, status: "completed" }),
      })
      if (response.ok) window.location.href = "/dashboard/internal-meetings"
    } catch (error) {
      console.error("Error finishing meeting:", error)
    } finally {
      setIsFinishing(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
      <p className="text-gray-500">Cargando reunión...</p>
    </div>
  )

  if (!meeting) return (
    <div className="flex flex-col items-center justify-center h-screen bg-white text-center px-4">
      <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
      <h2 className="text-xl font-bold">Reunión no encontrada</h2>
      <p className="text-gray-500 mb-6">No pudimos cargar la reunión con el ID: {meetingId}</p>
      <Button onClick={() => window.location.reload()}>Reintentar</Button>
    </div>
  )

  const currentStageData = MEETING_STAGES.find((s) => s.id === currentStage)
  const currentNews = newsItems && newsItems.length > 0 ? newsItems[currentNewsIndex] : null

  return (
    <div className={`bg-gray-50 ${isFullscreen ? "fixed inset-0 z-50 flex flex-col" : "min-h-screen flex flex-col"}`}>
      {/* HEADER */}
      <div className="bg-white shadow-sm border-b px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-blue-600">{formatTime(timeRemaining)}</div>
              <Button variant="outline" size="sm" onClick={toggleTimer} className="flex items-center gap-2">
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

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR AGENDA (Solo Etapa 1) */}
        {currentStage === 1 && (
          <div className="w-80 bg-white border-r p-6 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Agenda de Hoy</h2>
            <div className="space-y-2">
              {MEETING_STAGES.map((stage) => (
                <div key={stage.id} className={`flex items-center gap-3 p-3 rounded-lg ${currentStage === stage.id ? "bg-blue-100 border-blue-200 border" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStage >= stage.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
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

        {/* AREA CENTRAL */}
        <div className="flex-1 p-6 overflow-y-auto">
          {currentStage === 2 && (
            <Card className="h-full">
              <CardContent className="p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Noticias Generales</h2>
                  {newsItems.length > 0 && <Badge variant="outline">{currentNewsIndex + 1} de {newsItems.length}</Badge>}
                </div>
                {currentNews ? (
                  <div className="flex-1 flex flex-col">
                    <div className="bg-blue-50 rounded-lg p-6 mb-6 flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">{currentNews.title}</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{currentNews.description}</p>
                      {currentNews.image_url && <img src={currentNews.image_url} alt="" className="mt-4 max-w-full h-auto rounded-lg" />}
                    </div>
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={handlePrevNews} disabled={currentNewsIndex === 0}><ChevronLeft className="mr-2 h-4 w-4" />Anterior</Button>
                      <Button variant="outline" onClick={handleNextNews} disabled={currentNewsIndex === newsItems.length - 1}>Siguiente<ChevronRight className="ml-2 h-4 w-4" /></Button>
                    </div>
                  </div>
                ) : <p className="text-center text-gray-500 mt-20">No hay noticias cargadas.</p>}
              </CardContent>
            </Card>
          )}

          {currentStage === 3 && <TechCompanyDashboard meetingId={meetingId || undefined} />}
          {currentStage === 4 && <UserStatusDashboard meetingId={meetingId || undefined} />}

          {currentStage === 5 && (
            <Card className="h-full flex flex-col items-center justify-center text-center p-8">
              <h2 className="text-5xl font-bold text-gray-900 mb-4 uppercase">{meeting.weekly_topic}</h2>
              <p className="text-lg text-gray-600">Tema central de la semana</p>
            </Card>
          )}

          {currentStage === 6 && (
            <InternalMeetingSummary meetingId={meetingId || ""} meetingDate={meeting.meeting_date} weeklyTopic={meeting.weekly_topic} />
          )}
        </div>

        {/* SIDEBAR PARTICIPANTES (Solo Etapa 1) */}
        {currentStage === 1 && (
          <div className="w-80 bg-white border-l p-6 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users className="h-5 w-5" /> Participantes</h2>
            <div className="space-y-3">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <Checkbox checked={presentParticipants.includes(participant.id)} onCheckedChange={() => handleParticipantToggle(participant.id)} />
                  <span className="text-sm font-medium flex-1">{participant.first_name} {participant.last_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="bg-white border-t px-6 py-4 flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-gray-400">ETAPA {currentStage}</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className={`h-1.5 w-6 rounded-full ${currentStage >= i ? "bg-blue-600" : "bg-gray-200"}`} />)}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handlePrevStage} disabled={currentStage === 1}>Anterior</Button>
          <Button onClick={currentStage === 6 ? handleFinishMeeting : handleNextStage} disabled={isFinishing}>
            {currentStage === 6 ? (isFinishing ? "Finalizando..." : "Finalizar") : "Siguiente"}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}