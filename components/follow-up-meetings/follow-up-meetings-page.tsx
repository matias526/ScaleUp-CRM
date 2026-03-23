"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useTranslations } from "@/hooks/use-translations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import MeetingDashboard from "./meeting-dashboard"
import OpportunityCarousel from "./opportunity-carousel"
import EmailRecipientsSelector from "./email-recipients-selector"
import { useAuth } from "@/components/auth/auth-provider"
import {
  getOpportunitiesForMeeting,
  getTechCompanies,
  getPartners,
  getPartnersForTechCompany,
  getResponsibleBDD,
  getUsersByPartner,
  getTechCompaniesForPartner,
} from "@/lib/services/follow-up-meeting-service"
import { sendMeetingSummary } from "@/lib/services/meeting-summary-service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CalendarClock,
  Play,
  FileText,
  Send,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  BarChart3,
} from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DebugLogger } from "@/lib/debug-logger"
import { Progress } from "@/components/ui/progress"

export default function FollowUpMeetingsPage() {
  const { t } = useTranslations()
  const { userInfo } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("preparation")
  const [selectedTechCompany, setSelectedTechCompany] = useState<string>("")
  const [selectedPartner, setSelectedPartner] = useState<string>("")
  const [techCompanies, setTechCompanies] = useState<any[]>([])
  const [partnerTechCompanies, setPartnerTechCompanies] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [availablePartners, setAvailablePartners] = useState<any[]>([])
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [meetingStarted, setMeetingStarted] = useState(false)
  const [reviewedOpportunities, setReviewedOpportunities] = useState<string[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [meetingStartTime, setMeetingStartTime] = useState<Date | null>(null)
  const [emailRecipients, setEmailRecipients] = useState<string[]>([])
  const [partnerUsers, setPartnerUsers] = useState<any[]>([])
  const [bddUsers, setBddUsers] = useState<any[]>([])
  const [sendingEmail, setSendingEmail] = useState(false)

  // Logos
  const [partnerLogo, setPartnerLogo] = useState<string | null>(null)
  const [techCompanyLogo, setTechCompanyLogo] = useState<string | null>(null)

  const isAdmin = userInfo?.isAdmin || false
  const isBDD = userInfo?.roleCode?.toLowerCase() === "bdd" || false
  const isPartner = userInfo?.roleCode?.toLowerCase().includes("partner") || false

  // Memoizar la función onRecipientsChange para evitar loops infinitos en EmailRecipientsSelector
  const handleRecipientsChange = useCallback((recipients: string[]) => {
    console.log("Recipients changed:", recipients)
    setEmailRecipients(recipients)
  }, [])

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        console.log("Loading initial data...")
        DebugLogger.log("FollowUpMeetingsPage", {
          message: "Loading initial data",
          userInfo,
          isAdmin,
          isBDD,
          isPartner,
          roleCode: userInfo?.roleCode,
        })

        // Si el usuario es un partner, cargamos las tech companies relacionadas con su partner
        if (isPartner && userInfo?.partnerId) {
          console.log("User is partner, loading related tech companies")

          // Preseleccionamos su partner
          setSelectedPartner(userInfo.partnerId)

          // Cargar tech companies relacionadas con el partner
          const techCompaniesForPartner = await getTechCompaniesForPartner(userInfo.partnerId)
          console.log("Tech companies for partner loaded:", techCompaniesForPartner.length)
          setPartnerTechCompanies(techCompaniesForPartner)

          // Si solo hay una tech company, la seleccionamos automáticamente
          if (techCompaniesForPartner.length === 1) {
            console.log("Partner has only one tech company, auto-selecting:", techCompaniesForPartner[0].id)
            setSelectedTechCompany(techCompaniesForPartner[0].id)

            // Actualizar logo de tech company
            if (techCompaniesForPartner[0].logo_url) {
              setTechCompanyLogo(techCompaniesForPartner[0].logo_url)
            }
          }

          // Buscar el logo del partner
          // Cargar partners para obtener el logo
          const partnersData = await getPartners()
          setPartners(partnersData)
          const partnerData = partnersData.find((p) => p.id === userInfo.partnerId)
          if (partnerData?.logo_url) {
            setPartnerLogo(partnerData.logo_url)
          }
        } else {
          // Para admin y BDD, cargamos todas las tech companies y partners
          const techCompaniesData = await getTechCompanies()
          console.log("Tech companies loaded:", techCompaniesData.length)
          setTechCompanies(techCompaniesData)

          const partnersData = await getPartners()
          console.log("Partners loaded:", partnersData.length)
          setPartners(partnersData)
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error loading initial data:", error)
        setIsLoading(false)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos iniciales",
          variant: "destructive",
        })
      }
    }

    loadInitialData()
  }, [isPartner, userInfo, toast, isAdmin, isBDD])

  // Actualizar partners disponibles cuando cambia la tech company seleccionada
  useEffect(() => {
    const loadPartnersForTechCompany = async () => {
      if (!selectedTechCompany) {
        setAvailablePartners([])
        return
      }

      try {
        setIsLoading(true)
        console.log("Loading partners for tech company:", selectedTechCompany)
        console.log("Current user info:", userInfo)
        console.log("Is BDD:", isBDD)
        console.log("Is Partner:", isPartner)
        console.log("User ID:", userInfo?.id)

        DebugLogger.log("FollowUpMeetingsPage", {
          message: "Loading partners for tech company",
          techCompanyId: selectedTechCompany,
          userId: userInfo?.id,
          isBDD,
          isAdmin,
          isPartner,
          roleCode: userInfo?.roleCode,
        })

        // Si el usuario es partner, solo mostramos su partner
        if (isPartner && userInfo?.partnerId) {
          console.log("User is partner, filtering to show only their partner")
          const partnerData = partners.find((p) => p.id === userInfo.partnerId)
          setAvailablePartners(partnerData ? [partnerData] : [])
        } else {
          // Para admin y BDD, mostramos los partners correspondientes
          console.log("User is admin/BDD, showing partners for tech company")

          // Si es BDD, pasamos su ID para filtrar por scaleup_manager_id
          // Si es admin, no pasamos ID para obtener todos los partners
          const userId = isBDD && userInfo?.id ? userInfo.id : undefined
          console.log("Passing userId to getPartnersForTechCompany:", userId)

          const partnersForTechCompany = await getPartnersForTechCompany(selectedTechCompany, userId)

          console.log("Partners for tech company loaded:", partnersForTechCompany.length)
          setAvailablePartners(partnersForTechCompany)
        }

        // Actualizar logo de tech company
        if (isPartner) {
          const techCompanyData = partnerTechCompanies.find((tc) => tc.id === selectedTechCompany)
          if (techCompanyData?.logo_url) {
            setTechCompanyLogo(techCompanyData.logo_url)
          }
        } else {
          const techCompanyData = techCompanies.find((tc) => tc.id === selectedTechCompany)
          if (techCompanyData?.logo_url) {
            setTechCompanyLogo(techCompanyData.logo_url)
          }
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error loading partners for tech company:", error)
        setIsLoading(false)
        toast({
          title: "Error",
          description: "No se pudieron cargar los partners para esta empresa tecnológica",
          variant: "destructive",
        })
      }
    }

    loadPartnersForTechCompany()
  }, [selectedTechCompany, isPartner, isBDD, userInfo, partners, techCompanies, partnerTechCompanies, toast, isAdmin])

  // Cargar oportunidades cuando se seleccionan tech company y partner o cuando se actualiza algo
  useEffect(() => {
    const loadOpportunities = async () => {
      if (!selectedTechCompany || !selectedPartner) {
        setOpportunities([])
        return
      }

      try {
        setIsLoading(true)
        console.log("Loading opportunities for tech company:", selectedTechCompany, "and partner:", selectedPartner)

        const opportunitiesData = await getOpportunitiesForMeeting(selectedTechCompany, selectedPartner)
        console.log("Opportunities loaded:", opportunitiesData.length)
        console.log("First opportunity partner_responsible:", opportunitiesData[0]?.partner_responsible)
        setOpportunities(opportunitiesData)

        // Actualizar logo del partner
        const partnerData = partners.find((p) => p.id === selectedPartner)
        if (partnerData?.logo_url) {
          setPartnerLogo(partnerData.logo_url)
        }

        // Cargar usuarios del partner para el selector de emails
        const partnerUsersData = await getUsersByPartner(selectedPartner)
        setPartnerUsers(partnerUsersData)

        // Cargar BDDs responsables para el selector de emails
        const bddUsersData = await getResponsibleBDD(selectedTechCompany, selectedPartner)
        setBddUsers(bddUsersData)

        setIsLoading(false)
      } catch (error) {
        console.error("Error loading opportunities:", error)
        setIsLoading(false)
        toast({
          title: "Error",
          description: "No se pudieron cargar las oportunidades",
          variant: "destructive",
        })
      }
    }

    loadOpportunities()
  }, [selectedTechCompany, selectedPartner, partners, toast, refreshTrigger])

  // Iniciar reunión
  const handleStartMeeting = () => {
    setMeetingStarted(true)
    setMeetingStartTime(new Date())
    setActiveTab("meeting")
  }

  // Finalizar reunión - Versión simplificada y más robusta
  const handleEndMeeting = () => {
    try {
      console.log("Finalizando reunión...")

      // Cambios de estado en una sola operación para evitar re-renders múltiples
      setMeetingStarted(false)
      setActiveTab("summary")

      console.log("Reunión finalizada correctamente")
    } catch (error) {
      console.error("Error al finalizar la reunión:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al finalizar la reunión. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      })
    }
  }

  // Marcar oportunidad como revisada
  const markAsReviewed = (opportunityId: string) => {
    if (!reviewedOpportunities.includes(opportunityId)) {
      setReviewedOpportunities([...reviewedOpportunities, opportunityId])
    }
  }
  
  // Función para refrescar los datos
  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  // Formatear fecha
  const formatDate = (date: Date | null) => {
    if (!date) return ""
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: es })
  }

  // Obtener el nombre del partner y tech company seleccionados
  const getPartnerName = () => {
    const partner = partners.find((p) => p.id === selectedPartner)
    return partner ? partner.name : ""
  }

  const getTechCompanyName = () => {
    if (isPartner) {
      const techCompany = partnerTechCompanies.find((tc) => tc.id === selectedTechCompany)
      return techCompany ? techCompany.name : ""
    } else {
      const techCompany = techCompanies.find((tc) => tc.id === selectedTechCompany)
      return techCompany ? techCompany.name : ""
    }
  }

  // Obtener el nombre del usuario actual
  const getCurrentUserName = () => {
    if (!userInfo) return "Usuario desconocido"

    const firstName = userInfo.firstName || userInfo.first_name || ""
    const lastName = userInfo.lastName || userInfo.last_name || ""

    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim()
    }

    return userInfo.email || "Usuario desconocido"
  }

  // Reemplazar getTasksCreatedDuringMeeting con versión memoizada
  const tasksCreatedDuringMeeting = useMemo(() => {
    if (!meetingStartTime) return []

    const tasksCreated: any[] = []
    opportunities.forEach((opp) => {
      if (opp.tasks && opp.tasks.length > 0) {
        opp.tasks.forEach((task: any) => {
          if (new Date(task.created_at) >= meetingStartTime!) {
            tasksCreated.push({
              ...task,
              opportunity: opp,
            })
          }
        })
      }
    })

    return tasksCreated
  }, [opportunities, meetingStartTime])

  // Reemplazar getUpcomingTasks con versión memoizada
  const upcomingTasksByOpportunity = useMemo(() => {
    const result: Record<string, any[]> = {}

    opportunities.forEach((opp) => {
      if (!opp.tasks || opp.tasks.length === 0) {
        result[opp.id] = []
        return
      }

      const now = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)

      result[opp.id] = opp.tasks.filter((task: any) => {
        const dueDate = new Date(task.due_date)
        return dueDate >= now && dueDate <= nextWeek
      })
    })

    return result
  }, [opportunities])

  // Obtener nombre del responsable de una tarea
  const getTaskResponsibleName = (task: any) => {
    if (!task.assigned_to_user) return "No asignado"

    const firstName = task.assigned_to_user.first_name || ""
    const lastName = task.assigned_to_user.last_name || ""

    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim()
    }

    return task.assigned_to_user.email || "No asignado"
  }

  // Función para obtener el nombre del responsable del partner
  const getPartnerResponsibleName = (opportunity: any) => {
    console.log("Getting partner responsible for opportunity:", opportunity.id)
    console.log("Partner responsible data:", opportunity.partner_responsible)

    if (!opportunity.partner_responsible) {
      console.log("No partner_responsible found")
      return "No asignado"
    }

    const responsible = opportunity.partner_responsible
    const firstName = responsible.first_name || ""
    const lastName = responsible.last_name || ""

    if (firstName || lastName) {
      const fullName = `${firstName} ${lastName}`.trim()
      console.log("Partner responsible name:", fullName)
      return fullName
    }

    if (responsible.email) {
      console.log("Partner responsible email:", responsible.email)
      return responsible.email
    }

    console.log("No name or email found for partner responsible")
    return "No asignado"
  }

  // Enviar resumen por email
  const handleSendSummary = async () => {
    if (!emailRecipients || emailRecipients.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un destinatario",
        variant: "destructive",
      })
      return
    }

    setSendingEmail(true)
    try {
      console.log("Preparando envío de resumen...")
      console.log("Destinatarios:", emailRecipients)
      console.log("Partner:", getPartnerName())
      console.log("Tech Company:", getTechCompanyName())
      console.log("Oportunidades revisadas:", reviewedOpportunities.length)

      // Verificar que meetingStartTime sea una fecha válida
      const startTime = meetingStartTime instanceof Date ? meetingStartTime : new Date()

      // Enviar el resumen usando el nuevo servicio
      const result = await sendMeetingSummary({
        to: emailRecipients,
        partnerName: getPartnerName() || "N/A",
        techCompanyName: getTechCompanyName() || "N/A",
        opportunities: Array.isArray(opportunities) ? opportunities : [],
        reviewedOpportunityIds: Array.isArray(reviewedOpportunities) ? reviewedOpportunities : [],
        meetingStartTime: startTime,
        userEmail: userInfo?.email,
        userName: getCurrentUserName(), // Añadir el nombre del usuario
      })

      console.log("Resultado del envío:", result)

      if (result.success) {
        toast({
          title: "Éxito",
          description: `Resumen enviado a ${emailRecipients.length} destinatarios`,
        })
      } else {
        throw new Error(result.message || "Error al enviar el email")
      }
    } catch (error: any) {
      console.error("Error sending summary:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el resumen",
        variant: "destructive",
      })
    } finally {
      setSendingEmail(false)
    }
  }

  // Renderizar los filtros según el tipo de usuario
  const renderFilters = () => {
    if (isPartner) {
      // Para usuarios Partner
      return (
        <div className="space-y-4">
          {/* Mostrar información del Partner preseleccionado */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 h-12 w-12 relative">
              {partnerLogo ? (
                <Image src={partnerLogo || "/placeholder.svg"} alt={getPartnerName()} fill className="object-contain" />
              ) : (
                <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {getPartnerName().charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium">{getPartnerName()}</h3>
              <p className="text-sm text-gray-500">{t("follow_up_meeting.partner", "Partner")}</p>
            </div>
          </div>

          {/* Selector de Tech Company solo si hay más de una */}
          {partnerTechCompanies.length > 1 ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("follow_up_meeting.tech_company", "Empresa Tecnológica")}
              </label>
              <Select value={selectedTechCompany} onValueChange={setSelectedTechCompany} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("follow_up_meeting.select_tech_company", "Seleccionar Empresa Tecnológica")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {partnerTechCompanies.map((tc) => (
                    <SelectItem key={tc.id} value={tc.id}>
                      <div className="flex items-center gap-2">
                        {tc.logo_url && (
                          <div className="w-6 h-6 relative">
                            <Image
                              src={tc.logo_url || "/placeholder.svg"}
                              alt={tc.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        <span>{tc.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : partnerTechCompanies.length === 1 ? (
            // Si solo hay una Tech Company, mostrar información
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 h-12 w-12 relative">
                {techCompanyLogo ? (
                  <Image
                    src={techCompanyLogo || "/placeholder.svg"}
                    alt={getTechCompanyName()}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                    {getTechCompanyName().charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium">{getTechCompanyName()}</h3>
                <p className="text-sm text-gray-500">{t("follow_up_meeting.tech_company", "Empresa Tecnológica")}</p>
              </div>
            </div>
          ) : (
            // Si no hay Tech Companies
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
              {t("follow_up_meeting.no_tech_companies", "No hay empresas tecnológicas asociadas a este partner")}
            </div>
          )}
        </div>
      )
    } else {
      // Para usuarios Admin y BDD
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Selector de Tech Company */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("follow_up_meeting.tech_company", "Empresa Tecnológica")}</label>
            <Select
              value={selectedTechCompany}
              onValueChange={(value) => {
                setSelectedTechCompany(value)
                setSelectedPartner("") // Resetear partner al cambiar tech company
              }}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("follow_up_meeting.select_tech_company", "Seleccionar Empresa Tecnológica")}
                />
              </SelectTrigger>
              <SelectContent>
                {techCompanies.map((tc) => (
                  <SelectItem key={tc.id} value={tc.id}>
                    <div className="flex items-center gap-2">
                      {tc.logo_url && (
                        <div className="w-6 h-6 relative">
                          <Image
                            src={tc.logo_url || "/placeholder.svg"}
                            alt={tc.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                      <span>{tc.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de Partner */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("follow_up_meeting.partner", "Partner")}</label>
            <Select
              value={selectedPartner}
              onValueChange={setSelectedPartner}
              disabled={!selectedTechCompany || availablePartners.length === 0 || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("follow_up_meeting.select_partner", "Seleccionar Partner")} />
              </SelectTrigger>
              <SelectContent>
                {availablePartners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      {p.logo_url && (
                        <div className="w-6 h-6 relative">
                          <Image src={p.logo_url || "/placeholder.svg"} alt={p.name} fill className="object-contain" />
                        </div>
                      )}
                      <span>{p.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
  <div className="flex items-center gap-2">
  <h1 className="text-2xl font-bold">{t("follow_up_meeting.title", "Reunión de Seguimiento")}</h1>
  </div>

        {/* Logos de Partner y Tech Company */}
        <div className="flex items-center space-x-4">
          {partnerLogo && (
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">Partner</span>
              <div className="h-12 w-24 relative">
                <Image src={partnerLogo || "/placeholder.svg"} alt="Partner Logo" fill className="object-contain" />
              </div>
            </div>
          )}

          {techCompanyLogo && (
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">Tech Company</span>
              <div className="h-12 w-24 relative">
                <Image
                  src={techCompanyLogo || "/placeholder.svg"}
                  alt="Tech Company Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preparation" disabled={meetingStarted} className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            {t("follow_up_meeting.preparation", "Preparación")}
          </TabsTrigger>
          <TabsTrigger
            value="meeting"
            disabled={!selectedTechCompany || !selectedPartner || opportunities.length === 0 || isLoading}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {t("follow_up_meeting.meeting", "Reunión")}
          </TabsTrigger>
          <TabsTrigger
            value="summary"
            disabled={!meetingStarted && reviewedOpportunities.length === 0}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {t("follow_up_meeting.summary", "Resumen")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preparation" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("follow_up_meeting.filters", "Filtros")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Renderizar filtros según el tipo de usuario */}
              {renderFilters()}

              <Button
                onClick={handleStartMeeting}
                disabled={!selectedTechCompany || !selectedPartner || opportunities.length === 0 || isLoading}
                className="w-full md:w-auto mt-4"
              >
                {isLoading ? "Cargando..." : t("follow_up_meeting.start_meeting", "Iniciar Reunión")}
              </Button>
            </CardContent>
          </Card>

          {/* Dashboard */}
          {selectedTechCompany && selectedPartner && (
            <MeetingDashboard opportunities={opportunities} isLoading={isLoading} />
          )}
        </TabsContent>

        <TabsContent value="meeting" className="space-y-4 mt-4">
          {selectedTechCompany && selectedPartner && opportunities.length > 0 ? (
            <div className="space-y-4">
              <OpportunityCarousel
                opportunities={opportunities}
                onReview={markAsReviewed}
                reviewedOpportunities={reviewedOpportunities}
                partnerLogo={partnerLogo}
                techCompanyLogo={techCompanyLogo}
                onDataChange={refreshData}
              />

              <div className="flex justify-end">
                <Button onClick={handleEndMeeting} variant="default">
                  {t("follow_up_meeting.end_meeting", "Finalizar Reunión")}
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-lg text-gray-500 mb-4">
                  {t("follow_up_meeting.no_opportunities", "No hay oportunidades disponibles")}
                </p>
                <Button onClick={() => setActiveTab("preparation")}>
                  {t("follow_up_meeting.go_to_preparation", "Ir a Preparación")}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="summary" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Resumen de Reunión de Seguimiento - {getPartnerName()} / {getTechCompanyName()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fecha de la reunión y usuario */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha: {formatDate(new Date())}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span>
                    Facilitador: <span className="font-medium">{getCurrentUserName()}</span>
                  </span>
                </div>
              </div>

              {/* Logos de Partner y Tech Company */}
              <div className="flex justify-center gap-8 mb-6">
                {partnerLogo && (
                  <div className="text-center">
                    <Image
                      src={partnerLogo || "/placeholder.svg"}
                      alt="Partner Logo"
                      width={120}
                      height={60}
                      className="object-contain mb-2"
                    />
                    <p className="text-sm font-medium">{getPartnerName()}</p>
                  </div>
                )}

                {techCompanyLogo && (
                  <div className="text-center">
                    <Image
                      src={techCompanyLogo || "/placeholder.svg"}
                      alt="Tech Company Logo"
                      width={120}
                      height={60}
                      className="object-contain mb-2"
                    />
                    <p className="text-sm font-medium">{getTechCompanyName()}</p>
                  </div>
                )}
              </div>

              {/* Status General */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                  Status General
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-indigo-500" />
                            <span className="font-medium text-gray-700">Oportunidades Revisadas</span>
                          </div>
                          <span className="text-xs font-medium bg-indigo-100 text-indigo-800 py-1 px-2 rounded-full">
                            {opportunities.length > 0
                              ? Math.round((reviewedOpportunities.length / opportunities.length) * 100)
                              : 0}
                            %
                          </span>
                        </div>
                        <p className="text-3xl font-bold text-indigo-600">
                          {reviewedOpportunities.length}
                          <span className="text-sm font-normal text-gray-500 ml-1">de {opportunities.length}</span>
                        </p>
                        <Progress
                          value={
                            opportunities.length > 0
                              ? Math.round((reviewedOpportunities.length / opportunities.length) * 100)
                              : 0
                          }
                          className="h-2 mt-2 bg-gray-100"
                          indicatorClassName="bg-indigo-500"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-500" />
                            <span className="font-medium text-gray-700">Tareas Programadas</span>
                          </div>
                        </div>
                        <p className="text-3xl font-bold text-blue-600">
                          {opportunities.reduce((acc, opp) => acc + (opp.tasks?.length || 0), 0)}
                        </p>
                        <div className="h-2 mt-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${Math.min(100, opportunities.reduce((acc, opp) => acc + (opp.tasks?.length || 0), 0) * 5)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-green-500" />
                            <span className="font-medium text-gray-700">Tareas Nuevas</span>
                          </div>
                        </div>
                        <p className="text-3xl font-bold text-green-600">{tasksCreatedDuringMeeting.length}</p>
                        <div className="h-2 mt-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{
                              width: `${Math.min(100, tasksCreatedDuringMeeting.length * 10)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Oportunidades Revisadas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Oportunidades Revisadas</h3>
                {reviewedOpportunities.length > 0 ? (
                  <div className="space-y-4">
                    {opportunities
                      .filter((opp) => reviewedOpportunities.includes(opp.id))
                      .map((opp) => {
                        const upcomingTasks = upcomingTasksByOpportunity[opp.id] || []
                        const newTasks =
                          opp.tasks?.filter(
                            (task: any) => meetingStartTime && new Date(task.created_at) >= meetingStartTime,
                          ) || []

                        return (
                          <Card key={opp.id} className="overflow-hidden">
                            <CardHeader className="bg-gray-50 py-3">
                              <CardTitle className="text-base">
                                {opp.title}
                                {opp.end_customer && ` - ${opp.end_customer.name || opp.end_customer_name || ""}`}
                                <div className="text-sm font-normal text-gray-600 mt-1">
                                  Responsable: {getPartnerResponsibleName(opp)}
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                              {/* Próximas Acciones */}
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold mb-2">Próximas Acciones:</h4>
                                {upcomingTasks.length > 0 ? (
                                  <ul className="list-disc pl-5 space-y-1">
                                    {upcomingTasks.map((task: any) => (
                                      <li key={task.id} className="text-sm">
                                        {task.title} - Vence: {format(new Date(task.due_date), "dd/MM/yyyy")}{" "}
                                        (Responsable: {getTaskResponsibleName(task)})
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-gray-500">
                                    No hay acciones programadas para los próximos 7 días
                                  </p>
                                )}
                              </div>

                              {/* Acciones Nuevas */}
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Acciones Nuevas:</h4>
                                {newTasks.length > 0 ? (
                                  <ul className="list-disc pl-5 space-y-1">
                                    {newTasks.map((task: any) => (
                                      <li key={task.id} className="text-sm">
                                        {task.title} - Vence: {format(new Date(task.due_date), "dd/MM/yyyy")}{" "}
                                        (Responsable: {getTaskResponsibleName(task)})
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-gray-500">
                                    No se crearon nuevas acciones durante la reunión
                                  </p>
                                )}
                              </div>

                              {/* Notas Nuevas */}
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Notas Nuevas:</h4>
                                {(() => {
                                  const newNotes =
                                    opp.notes?.filter(
                                      (note: any) => meetingStartTime && new Date(note.created_at) >= meetingStartTime,
                                    ) || []

                                  return newNotes.length > 0 ? (
                                    <ul className="list-disc pl-5 space-y-1">
                                      {newNotes.map((note: any) => (
                                        <li key={note.id} className="text-sm">
                                          <div className="flex items-start gap-2">
                                            <div className="flex-1">
                                              <div className="font-medium text-xs text-gray-600">
                                                {note.user
                                                  ? `${note.user.first_name || ""} ${note.user.last_name || ""}`.trim() ||
                                                    note.user.email
                                                  : "Usuario desconocido"}
                                              </div>
                                              <div className="mt-1">{note.content}</div>
                                            </div>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-sm text-gray-500">
                                      No se agregaron nuevas notas durante la reunión
                                    </p>
                                  )
                                })()}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No se revisaron oportunidades</p>
                )}
              </div>

              {/* Oportunidades No Revisadas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Oportunidades No Revisadas</h3>
                {opportunities.filter((opp) => !reviewedOpportunities.includes(opp.id)).length > 0 ? (
                  <div className="space-y-4">
                    {opportunities
                      .filter((opp) => !reviewedOpportunities.includes(opp.id))
                      .map((opp) => {
                        const upcomingTasks = upcomingTasksByOpportunity[opp.id] || []

                        return (
                          <Card key={opp.id} className="overflow-hidden">
                            <CardHeader className="bg-gray-50 py-3">
                              <CardTitle className="text-base">
                                {opp.title}
                                {opp.end_customer && ` - ${opp.end_customer.name || opp.end_customer_name || ""}`}
                                <div className="text-sm font-normal text-gray-600 mt-1">
                                  Responsable: {getPartnerResponsibleName(opp)}
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                              {/* Próximas Acciones */}
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Próximas Acciones:</h4>
                                {upcomingTasks.length > 0 ? (
                                  <ul className="list-disc pl-5 space-y-1">
                                    {upcomingTasks.map((task: any) => (
                                      <li key={task.id} className="text-sm">
                                        {task.title} - Vence: {format(new Date(task.due_date), "dd/MM/yyyy")}{" "}
                                        (Responsable: {getTaskResponsibleName(task)})
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-gray-500">
                                    No hay acciones programadas para los próximos 7 días
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Todas las oportunidades fueron revisadas</p>
                )}
              </div>

              {/* Selector de destinatarios y botón de enviar */}
              <div className="space-y-4 border-t pt-4">
                <EmailRecipientsSelector
                  partnerUsers={partnerUsers}
                  bddUsers={bddUsers}
                  onRecipientsChange={handleRecipientsChange}
                />

                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleSendSummary}
                    disabled={emailRecipients.length === 0 || sendingEmail}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {sendingEmail ? "Enviando..." : "Enviar Resumen"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
