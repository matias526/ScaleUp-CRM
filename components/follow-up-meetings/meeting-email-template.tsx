"use client"

import React from "react"
import { format, differenceInDays } from "date-fns"
import { es, enUS, pt } from "date-fns/locale"
import Image from "next/image"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/hooks/use-translation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface MeetingEmailTemplateProps {
  meeting: any
  opportunities: any[]
  notes: any[]
  tasks: any[]
  language?: string
}

export function MeetingEmailTemplate({
  meeting,
  opportunities = [],
  notes = [],
  tasks = [],
  language = "es",
}: MeetingEmailTemplateProps) {
  const { t, changeLanguage } = useTranslation(language)

  // Color azul de ScaleUp
  const scaleupBlue = "#0055b8"

  // Cambiar el idioma cuando cambia la prop
  React.useEffect(() => {
    changeLanguage(language)
  }, [language, changeLanguage])

  // Seleccionar el locale adecuado según el idioma
  const getLocale = () => {
    switch (language) {
      case "en":
        return enUS
      case "pt":
        return pt
      case "es":
      default:
        return es
    }
  }

  const locale = getLocale()

  // Función para formatear fechas según el idioma
  const formatDate = (date: Date | string) => {
    if (!date) return ""
    const dateObj = typeof date === "string" ? new Date(date) : date
    return format(dateObj, "PPP", { locale })
  }

  // Función para calcular días transcurridos
  const getDaysSinceCreation = (createdAt: string) => {
    if (!createdAt) return 0
    const creationDate = new Date(createdAt)
    return differenceInDays(new Date(), creationDate)
  }

  // Función para calcular días hasta la fecha estimada de cierre
  const getDaysUntilEstimatedClose = (estimatedCloseDate: string) => {
    if (!estimatedCloseDate) return 0
    const closeDate = new Date(estimatedCloseDate)
    return differenceInDays(closeDate, new Date())
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
      {/* Encabezado con logo de ScaleUp en blanco en la esquina superior derecha */}
      <div style={{ backgroundColor: scaleupBlue }} className="text-white p-6 rounded-t-lg relative">
        <div className="absolute top-6 right-6">
          <Image
            src="/images/scaleup-logo-white.png"
            alt="ScaleUp Logo"
            width={120}
            height={40}
            className="h-8 w-auto"
          />
        </div>
        <h1 className="text-2xl font-bold">{t("meeting_report.title", "Reporte de Seguimiento")}</h1>
        <p className="mt-2 text-white/80">{t("meeting_report.subtitle", "Resumen de la reunión y próximos pasos")}</p>
      </div>

      {/* Información del meeting */}
      <div className="mt-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">{t("meeting_report.meeting_info", "Información de la Reunión")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">{t("meeting_report.date", "Fecha")}</p>
            <p className="font-medium">
              {meeting?.date ? formatDate(meeting.date) : t("meeting_report.not_specified", "No especificada")}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t("meeting_report.created_by", "Creado por")}</p>
            <p className="font-medium">
              {meeting?.creator
                ? `${meeting.creator.first_name} ${meeting.creator.last_name}`
                : t("meeting_report.unknown", "Desconocido")}
            </p>
          </div>
          {meeting?.description && (
            <div className="col-span-1 md:col-span-2">
              <p className="text-sm text-gray-500">{t("meeting_report.description", "Descripción")}</p>
              <p className="font-medium">{meeting.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Oportunidades */}
      {opportunities.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">{t("meeting_report.opportunities", "Oportunidades")}</h2>
          <div className="space-y-4">
            {opportunities.map((opportunity) => (
              <Card key={opportunity.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-medium">{opportunity.title || opportunity.name}</h3>
                    {opportunity.validation_status && (
                      <Badge
                        variant={
                          opportunity.validation_status === "validated"
                            ? "default"
                            : opportunity.validation_status === "rejected"
                              ? "destructive"
                              : "outline"
                        }
                        style={opportunity.validation_status === "validated" ? { backgroundColor: scaleupBlue } : {}}
                      >
                        {opportunity.validation_status === "validated"
                          ? t("meeting_report.validated", "Validada")
                          : opportunity.validation_status === "rejected"
                            ? t("meeting_report.rejected", "Rechazada")
                            : t("meeting_report.pending", "Pendiente")}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex flex-col space-y-4">
                    {/* Información adicional de la oportunidad */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {/* Días desde apertura */}
                      <div>
                        <span className="text-gray-600">
                          {t("meeting_report.opportunity_open_for", "Oportunidad abierta hace")}{" "}
                          {getDaysSinceCreation(opportunity.created_at)} {t("meeting_report.days", "días")}
                        </span>
                      </div>

                      {/* Responsable del Partner */}
                      <div>
                        <span className="text-gray-600">
                          {t("meeting_report.responsible", "Responsable")}:{" "}
                          {opportunity.partner_responsible
                            ? `${opportunity.partner_responsible.first_name || ""} ${opportunity.partner_responsible.last_name || ""}`
                            : t("meeting_report.not_assigned", "No asignado")}
                        </span>
                      </div>

                      {/* Fecha estimada de cierre */}
                      {opportunity.estimated_close_date && (
                        <div className="col-span-1 md:col-span-2">
                          <span className="text-gray-600">
                            {t("meeting_report.estimated_close_date", "Fecha estimada de cierre")}:{" "}
                            {formatDate(opportunity.estimated_close_date)} - {t("meeting_report.in_days", "En")}{" "}
                            {getDaysUntilEstimatedClose(opportunity.estimated_close_date)}{" "}
                            {t("meeting_report.days", "días")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Logos de partner y tech company */}
                    <div className="flex items-center space-x-6 mt-2">
                      {opportunity.partner && (
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8">
                            {opportunity.partner.logo_url && (
                              <AvatarImage
                                src={opportunity.partner.logo_url || "/placeholder.svg"}
                                alt={opportunity.partner.name}
                              />
                            )}
                            <AvatarFallback>{opportunity.partner.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="ml-2 text-sm font-medium">{opportunity.partner.name}</span>
                        </div>
                      )}

                      {opportunity.tech_company && (
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8">
                            {opportunity.tech_company.logo_url && (
                              <AvatarImage
                                src={opportunity.tech_company.logo_url || "/placeholder.svg"}
                                alt={opportunity.tech_company.name}
                              />
                            )}
                            <AvatarFallback>{opportunity.tech_company.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="ml-2 text-sm font-medium">{opportunity.tech_company.name}</span>
                        </div>
                      )}
                    </div>

                    {opportunity.description && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-700">{opportunity.description}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Notas */}
      {notes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">{t("meeting_report.notes", "Notas")}</h2>
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-4">
                <div className="flex items-start space-x-3 mb-2">
                  <Avatar className="h-8 w-8">
                    {note.user?.avatar_url && (
                      <AvatarImage
                        src={note.user.avatar_url || "/placeholder.svg"}
                        alt={`${note.user.first_name} ${note.user.last_name}`}
                      />
                    )}
                    <AvatarFallback>{note.user?.first_name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {note.user?.first_name} {note.user?.last_name}
                    </div>
                    <div className="text-xs text-muted-foreground">{formatDate(note.created_at)}</div>
                  </div>
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm">{note.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tareas */}
      {tasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">{t("meeting_report.tasks", "Tareas")}</h2>
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{task.title}</h3>
                      {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
                    </div>
                    <Badge
                      variant={task.status === "completed" ? "default" : "outline"}
                      style={task.status === "completed" ? { backgroundColor: scaleupBlue } : {}}
                    >
                      {task.status === "completed"
                        ? t("meeting_report.completed", "Completada")
                        : t("meeting_report.pending", "Pendiente")}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center text-sm text-gray-500">
                    <span className="mb-1 sm:mb-0 sm:mr-4">
                      {t("meeting_report.assigned_to", "Asignada a")}: {task.assigned_user?.first_name}{" "}
                      {task.assigned_user?.last_name}
                    </span>
                    {task.due_date && (
                      <span>
                        {t("meeting_report.due_date", "Fecha límite")}: {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pie de página */}
      <div className="mt-8 pt-4 border-t text-left" style={{ backgroundColor: "white", color: scaleupBlue }}>
        <p>
          {t("meeting_report.generated_by", "Generado por")} ScaleUp CRM - {formatDate(new Date())}
        </p>
      </div>
    </div>
  )
}
