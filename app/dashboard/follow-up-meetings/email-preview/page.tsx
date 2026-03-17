"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { MeetingEmailTemplate } from "@/components/follow-up-meetings/meeting-email-template"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Send, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/hooks/use-translation"

export default function EmailPreviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const meetingId = searchParams.get("id")
  const [meeting, setMeeting] = useState<any>(null)
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState("es")
  const [isSending, setIsSending] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const { t } = useTranslation()

  useEffect(() => {
    if (!meetingId) {
      router.push("/dashboard/follow-up-meetings")
      return
    }

    const loadMeetingData = async () => {
      setLoading(true)
      try {
        // Cargar datos de la reunión
        const { data: meetingData, error: meetingError } = await supabase
          .from("follow_up_meetings")
          .select(`
            *,
            creator:users(id, first_name, last_name, email)
          `)
          .eq("id", meetingId)
          .single()

        if (meetingError) throw meetingError
        setMeeting(meetingData)

        // Cargar oportunidades relacionadas
        const { data: opportunitiesData, error: opportunitiesError } = await supabase
          .from("meeting_opportunities")
          .select(`
            opportunity_id
          `)
          .eq("meeting_id", meetingId)

        if (opportunitiesError) throw opportunitiesError

        if (opportunitiesData && opportunitiesData.length > 0) {
          const opportunityIds = opportunitiesData.map((item) => item.opportunity_id)

          const { data: fullOpportunitiesData, error: fullOpportunitiesError } = await supabase
            .from("opportunities")
            .select(`
              *,
              partner:partners(*),
              tech_company:tech_companies(*),
              end_customer:end_customers(*)
            `)
            .in("id", opportunityIds)

          if (fullOpportunitiesError) throw fullOpportunitiesError
          setOpportunities(fullOpportunitiesData || [])
        }

        // Cargar notas relacionadas
        const { data: notesData, error: notesError } = await supabase
          .from("meeting_notes")
          .select(`
            *,
            user:users(id, first_name, last_name, email, avatar_url)
          `)
          .eq("meeting_id", meetingId)
          .order("created_at", { ascending: false })

        if (notesError) throw notesError
        setNotes(notesData || [])

        // Cargar tareas relacionadas
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select(`
            *,
            assigned_user:users(id, first_name, last_name, email)
          `)
          .eq("meeting_id", meetingId)

        if (tasksError) throw tasksError
        setTasks(tasksData || [])
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast({
          title: t("error.title", "Error"),
          description: t("error.load_data", "No se pudieron cargar los datos de la reunión"),
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadMeetingData()
  }, [meetingId, router, supabase, toast, t])

  const handleSendEmail = async () => {
    setIsSending(true)
    try {
      // Aquí iría la lógica para enviar el email
      // Por ahora, simulamos un retraso
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: t("email.sent_title", "Email enviado"),
        description: t("email.sent_description", "El reporte ha sido enviado correctamente"),
      })
    } catch (error) {
      toast({
        title: t("error.title", "Error"),
        description: t("error.send_email", "No se pudo enviar el email"),
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      // Aquí iría la lógica para descargar como PDF
      // Por ahora, simulamos un retraso
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: t("pdf.download_title", "PDF generado"),
        description: t("pdf.download_description", "El reporte se ha descargado correctamente"),
      })
    } catch (error) {
      toast({
        title: t("error.title", "Error"),
        description: t("error.download_pdf", "No se pudo descargar el PDF"),
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back", "Volver")}
        </Button>

        <div className="flex items-center space-x-4">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("language.select", "Seleccionar idioma")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">{t("language.spanish", "Español")}</SelectItem>
              <SelectItem value="en">{t("language.english", "Inglés")}</SelectItem>
              <SelectItem value="pt">{t("language.portuguese", "Portugués")}</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            {t("pdf.download", "Descargar PDF")}
          </Button>

          <Button onClick={handleSendEmail} disabled={isSending}>
            <Send className="mr-2 h-4 w-4" />
            {isSending ? t("email.sending", "Enviando...") : t("email.send", "Enviar Email")}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <MeetingEmailTemplate
              meeting={meeting}
              opportunities={opportunities}
              notes={notes}
              tasks={tasks}
              language={language}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
