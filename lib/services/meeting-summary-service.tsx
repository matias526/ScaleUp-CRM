import { format, addDays, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { sendEmail } from "./email-service"

interface Opportunity {
  id: string
  name: string
}

interface MeetingSummaryData {
  meetingTitle: string
  meetingStartTime: Date
  attendees: string[]
  opportunities: Opportunity[]
  reviewedOpportunityIds: string[]
}

class MeetingSummaryService {
  async generateSummary(data: MeetingSummaryData): Promise<string> {
    const { meetingTitle, meetingStartTime, attendees, opportunities, reviewedOpportunityIds } = data

    if (!attendees || attendees.length === 0) {
      console.log("No hay destinatarios válidos")
      return "No se puede generar un resumen sin destinatarios."
    }

    if (!Array.isArray(opportunities)) {
      console.log("opportunities no es un array:", opportunities)
      return "Error: La información de oportunidades no es válida."
    }

    if (!Array.isArray(reviewedOpportunityIds)) {
      console.log("reviewedOpportunityIds no es un array:", reviewedOpportunityIds)
      return "Error: La información de oportunidades revisadas no es válida."
    }

    if (!(meetingStartTime instanceof Date) || isNaN(meetingStartTime.getTime())) {
      console.log("meetingStartTime no es una fecha válida:", meetingStartTime)
      return "Error: La hora de inicio de la reunión no es válida."
    }

    let summary = `Resumen de la reunión: ${meetingTitle}\n`
    summary += `Fecha y hora: ${meetingStartTime.toLocaleString()}\n`
    summary += `Asistentes: ${attendees.join(", ")}\n\n`

    summary += "Oportunidades discutidas:\n"
    if (opportunities.length === 0) {
      summary += "No se discutieron oportunidades.\n"
    } else {
      opportunities.forEach((opportunity) => {
        const isReviewed = reviewedOpportunityIds.includes(opportunity.id)
        summary += `- ${opportunity.name} (ID: ${opportunity.id}) - ${isReviewed ? "Revisada" : "No Revisada"}\n`
      })
    }

    return summary
  }
}

export default MeetingSummaryService

// Preparar datos para el resumen de la reunión
export function prepareMeetingSummaryData(data: {
  partnerName: string
  techCompanyName: string
  opportunities: any[]
  reviewedOpportunityIds: string[]
  meetingStartTime: Date
  userName?: string // Añadir el nombre del usuario
}) {
  try {
    const { partnerName, techCompanyName, opportunities, reviewedOpportunityIds, meetingStartTime, userName } = data

    console.log("=== PREPARANDO DATOS PARA RESUMEN ===")
    console.log("Opportunities recibidas:", opportunities.length)
    console.log("Primera oportunidad completa:", JSON.stringify(opportunities[0], null, 2))

    // Validar datos de entrada
    if (!Array.isArray(opportunities)) {
      console.log("opportunities no es un array:", opportunities)
      return {
        partnerName: partnerName || "N/A",
        techCompanyName: techCompanyName || "N/A",
        date: format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es }),
        reviewedOpportunities: [],
        unReviewedOpportunities: [],
        userName: userName || "Usuario desconocido",
        stats: {
          reviewedCount: 0,
          totalCount: 0,
          reviewedPercentage: 0,
          upcomingTasksCount: 0,
          newTasksCount: 0,
        },
      }
    }

    // Separar oportunidades revisadas y no revisadas
    const reviewedOpportunities = opportunities.filter((opp) => reviewedOpportunityIds.includes(opp.id))
    const unReviewedOpportunities = opportunities.filter((opp) => !reviewedOpportunityIds.includes(opp.id))

    console.log("Oportunidades revisadas:", reviewedOpportunities.length)
    console.log("Oportunidades no revisadas:", unReviewedOpportunities.length)

    // Fecha límite para tareas próximas (7 días desde hoy)
    const upcomingTasksLimit = addDays(new Date(), 7)

    // Preparar datos de oportunidades revisadas
    const reviewedOpportunitiesData = reviewedOpportunities.map((opp) => {
      console.log(`=== PROCESANDO OPORTUNIDAD REVISADA: ${opp.title || opp.name} ===`)
      console.log("partner_responsible_id:", opp.partner_responsible_id)
      console.log("partner_responsible objeto:", opp.partner_responsible)

      try {
        // Filtrar tareas próximas (vencen en los próximos 7 días) excluyendo completadas y canceladas
        const upcomingTasks = (opp.tasks || [])
          .filter((task: any) => {
            try {
              if (!task || !task.due_date) return false
              // Excluir tareas completadas o canceladas
              if (task.status === "completed" || task.status === "cancelled") return false
              const dueDate = parseISO(task.due_date)
              return dueDate <= upcomingTasksLimit
            } catch (error) {
              console.log("Error al procesar tarea próxima:", error)
              return false
            }
          })
          .map((task: any) => {
            try {
              return {
                title: task.title || "Sin título",
                dueDate: task.due_date ? format(parseISO(task.due_date), "dd/MM/yyyy", { locale: es }) : "Sin fecha",
                responsible: task.assigned_to_user
                  ? `${task.assigned_to_user.first_name || ""} ${task.assigned_to_user.last_name || ""}`.trim() ||
                    task.assigned_to_user.email ||
                    "Sin asignar"
                  : "Sin asignar",
              }
            } catch (error) {
              console.log("Error al mapear tarea próxima:", error)
              return {
                title: "Error al procesar tarea",
                dueDate: "N/A",
                responsible: "N/A",
              }
            }
          })

        const newTasks = (opp.tasks || [])
          .filter((task: any) => {
            try {
              if (!task || !task.created_at || !meetingStartTime) return false
              // Excluir tareas completadas o canceladas
              if (task.status === "completed" || task.status === "cancelled") return false
              const createdAt = parseISO(task.created_at)
              return createdAt >= meetingStartTime
            } catch (error) {
              console.log("Error al procesar tarea nueva:", error)
              return false
            }
          })
          .map((task: any) => {
            try {
              return {
                title: task.title || "Sin título",
                dueDate: task.due_date ? format(parseISO(task.due_date), "dd/MM/yyyy", { locale: es }) : "Sin fecha",
                responsible: task.assigned_to_user
                  ? `${task.assigned_to_user.first_name || ""} ${task.assigned_to_user.last_name || ""}`.trim() ||
                    task.assigned_to_user.email ||
                    "Sin asignar"
                  : "Sin asignar",
              }
            } catch (error) {
              console.log("Error al mapear tarea nueva:", error)
              return {
                title: "Error al procesar tarea",
                dueDate: "N/A",
                responsible: "N/A",
              }
            }
          })

        // Filtrar notas creadas durante la reunión
        const newNotes = (opp.notes || [])
          .filter((note: any) => {
            try {
              if (!note || !note.created_at || !meetingStartTime) return false
              const createdAt = parseISO(note.created_at)
              return createdAt >= meetingStartTime
            } catch (error) {
              console.log("Error al procesar nota nueva:", error)
              return false
            }
          })
          .map((note: any) => {
            try {
              return {
                content: note.content || "Sin contenido",
                author: note.user
                  ? `${note.user.first_name || ""} ${note.user.last_name || ""}`.trim() ||
                    note.user.email ||
                    "Usuario desconocido"
                  : "Usuario desconocido",
                created_at: note.created_at,
              }
            } catch (error) {
              console.log("Error al mapear nota nueva:", error)
              return {
                content: "Error al procesar nota",
                author: "N/A",
                created_at: null,
              }
            }
          })

        // Asegurarse de usar el campo correcto para el título
        const opportunityTitle = opp.title || opp.name || "Sin título"

        // AQUÍ ES DONDE SE PROCESA EL RESPONSABLE DEL PARTNER
        let partnerResponsibleName = "No asignado"

        console.log("=== PROCESANDO RESPONSABLE DEL PARTNER ===")
        console.log("opp.partner_responsible_id:", opp.partner_responsible_id)
        console.log("opp.partner_responsible:", opp.partner_responsible)

        if (opp.partner_responsible) {
          // Si tenemos el objeto completo del responsable
          const firstName = opp.partner_responsible.first_name || ""
          const lastName = opp.partner_responsible.last_name || ""
          const email = opp.partner_responsible.email || ""

          partnerResponsibleName = `${firstName} ${lastName}`.trim() || email || "No asignado"
          console.log("Responsable encontrado (objeto):", partnerResponsibleName)
        } else if (opp.partner_responsible_id) {
          // Si solo tenemos el ID, necesitamos hacer un query adicional
          console.log("Solo tenemos ID del responsable, necesitamos hacer query adicional")
          partnerResponsibleName = "ID: " + opp.partner_responsible_id
        }

        console.log("Responsable final:", partnerResponsibleName)

        return {
          title: opportunityTitle,
          endCustomer: opp.end_customer?.name || "Sin cliente final",
          upcomingTasks,
          newTasks,
          newNotes,
          // Agregar datos adicionales para el email mejorado
          created_at: opp.created_at,
          estimated_close_date: opp.estimated_close_date,
          partner_responsible: opp.partner_responsible || null,
          partner_responsible_name: partnerResponsibleName, // Agregar el nombre procesado
        }
      } catch (error) {
        console.log("Error al procesar oportunidad revisada:", error)
        return {
          title: "Error al procesar oportunidad",
          endCustomer: "N/A",
          upcomingTasks: [],
          newTasks: [],
          newNotes: [],
          created_at: null,
          estimated_close_date: null,
          partner_responsible: null,
          partner_responsible_name: "Error al procesar",
        }
      }
    })

    // Preparar datos de oportunidades no revisadas
    const unReviewedOpportunitiesData = unReviewedOpportunities.map((opp) => {
      console.log(`=== PROCESANDO OPORTUNIDAD NO REVISADA: ${opp.title || opp.name} ===`)
      console.log("partner_responsible_id:", opp.partner_responsible_id)
      console.log("partner_responsible objeto:", opp.partner_responsible)

      try {
        // Filtrar tareas próximas (vencen en los próximos 7 días) excluyendo completadas y canceladas
        const upcomingTasks = (opp.tasks || [])
          .filter((task: any) => {
            try {
              if (!task || !task.due_date) return false
              // Excluir tareas completadas o canceladas
              if (task.status === "completed" || task.status === "cancelled") return false
              const dueDate = parseISO(task.due_date)
              return dueDate <= upcomingTasksLimit
            } catch (error) {
              console.log("Error al procesar tarea próxima:", error)
              return false
            }
          })
          .map((task: any) => {
            try {
              return {
                title: task.title || "Sin título",
                dueDate: task.due_date ? format(parseISO(task.due_date), "dd/MM/yyyy", { locale: es }) : "Sin fecha",
                responsible: task.assigned_to_user
                  ? `${task.assigned_to_user.first_name || ""} ${task.assigned_to_user.last_name || ""}`.trim() ||
                    task.assigned_to_user.email ||
                    "Sin asignar"
                  : "Sin asignar",
              }
            } catch (error) {
              console.log("Error al mapear tarea próxima:", error)
              return {
                title: "Error al procesar tarea",
                dueDate: "N/A",
                responsible: "N/A",
              }
            }
          })

        // Asegurarse de usar el campo correcto para el título
        const opportunityTitle = opp.title || opp.name || "Sin título"

        // PROCESAR RESPONSABLE PARA OPORTUNIDADES NO REVISADAS
        let partnerResponsibleName = "No asignado"

        if (opp.partner_responsible) {
          const firstName = opp.partner_responsible.first_name || ""
          const lastName = opp.partner_responsible.last_name || ""
          const email = opp.partner_responsible.email || ""

          partnerResponsibleName = `${firstName} ${lastName}`.trim() || email || "No asignado"
        } else if (opp.partner_responsible_id) {
          partnerResponsibleName = "ID: " + opp.partner_responsible_id
        }

        return {
          title: opportunityTitle,
          endCustomer: opp.end_customer?.name || "Sin cliente final",
          upcomingTasks,
          // Agregar datos adicionales para el email mejorado
          created_at: opp.created_at,
          estimated_close_date: opp.estimated_close_date,
          partner_responsible: opp.partner_responsible || null,
          partner_responsible_name: partnerResponsibleName,
        }
      } catch (error) {
        console.log("Error al procesar oportunidad no revisada:", error)
        return {
          title: "Error al procesar oportunidad",
          endCustomer: "N/A",
          upcomingTasks: [],
          created_at: null,
          estimated_close_date: null,
          partner_responsible: null,
          partner_responsible_name: "Error al procesar",
        }
      }
    })

    // Calcular estadísticas
    const totalCount = opportunities.length
    const reviewedCount = reviewedOpportunities.length
    const reviewedPercentage = totalCount > 0 ? Math.round((reviewedCount / totalCount) * 100) : 0

    // Contar tareas próximas
    const upcomingTasksCount = [...reviewedOpportunitiesData, ...unReviewedOpportunitiesData].reduce(
      (count, opp) => count + (opp.upcomingTasks?.length || 0),
      0,
    )

    // Contar tareas nuevas
    const newTasksCount = reviewedOpportunitiesData.reduce((count, opp) => count + (opp.newTasks?.length || 0), 0)

    console.log("=== RESUMEN FINAL ===")
    console.log("Total oportunidades:", totalCount)
    console.log("Oportunidades revisadas:", reviewedCount)
    console.log(
      "Datos finales de oportunidades revisadas:",
      reviewedOpportunitiesData.map((opp) => ({
        title: opp.title,
        responsible: opp.partner_responsible_name,
      })),
    )

    return {
      partnerName: partnerName || "N/A",
      techCompanyName: techCompanyName || "N/A",
      date: format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es }),
      reviewedOpportunities: reviewedOpportunitiesData,
      unReviewedOpportunities: unReviewedOpportunitiesData,
      userName: userName || "Usuario desconocido",
      stats: {
        reviewedCount,
        totalCount,
        reviewedPercentage,
        upcomingTasksCount,
        newTasksCount,
      },
    }
  } catch (error) {
    console.log("Error en prepareMeetingSummaryData:", error)
    return {
      partnerName: data.partnerName || "N/A",
      techCompanyName: data.techCompanyName || "N/A",
      date: format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es }),
      reviewedOpportunities: [],
      unReviewedOpportunities: [],
      userName: data.userName || "Usuario desconocido",
      stats: {
        reviewedCount: 0,
        totalCount: 0,
        reviewedPercentage: 0,
        upcomingTasksCount: 0,
        newTasksCount: 0,
      },
    }
  }
}

// Generar HTML para el resumen de la reunión
export function generateMeetingSummaryHtml(data: ReturnType<typeof prepareMeetingSummaryData>): string {
  try {
    const { partnerName, techCompanyName, date, reviewedOpportunities, unReviewedOpportunities, stats, userName } = data

    console.log("=== GENERANDO HTML PARA EMAIL ===")
    console.log("Oportunidades revisadas para HTML:", reviewedOpportunities.length)
    console.log("Primera oportunidad revisada:", reviewedOpportunities[0])

    // Color azul de ScaleUp
    const scaleupBlue = "#0055b8"

    // Función para calcular días hasta la fecha estimada de cierre
    const getDaysUntilEstimatedClose = (estimatedCloseDate: string | null) => {
      if (!estimatedCloseDate) return 0
      try {
        const closeDate = new Date(estimatedCloseDate)
        if (isNaN(closeDate.getTime())) return 0
        return Math.max(0, Math.floor((closeDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      } catch (e) {
        return 0
      }
    }

    // Función para calcular días desde la creación
    const getDaysSinceCreation = (createdAt: string | null) => {
      if (!createdAt) return 0
      try {
        const creationDate = new Date(createdAt)
        if (isNaN(creationDate.getTime())) return 0
        return Math.floor((new Date().getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))
      } catch (e) {
        return 0
      }
    }

    // Función para formatear fecha
    const formatDateSimple = (dateString: string | null) => {
      if (!dateString) return "N/A"
      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return "N/A"
        return format(date, "dd/MM/yyyy", { locale: es })
      } catch (e) {
        return "N/A"
      }
    }

    // Estilos CSS inline para compatibilidad con clientes de email
    const styles = {
      container:
        "font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0; padding: 0; background-color: #f9fafb; border-radius: 8px; overflow: hidden;",
      header: `background: ${scaleupBlue}; padding: 30px; color: white; text-align: left; position: relative;`,
      title: "font-size: 24px; font-weight: bold; margin-bottom: 10px; color: white;",
      subtitle: `font-size: 18px; font-weight: bold; margin: 25px 0 15px; color: ${scaleupBlue}; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;`,
      content: "padding: 30px; background-color: white; border-radius: 0 0 8px 8px;",
      meta: "display: flex; justify-content: space-between; margin-bottom: 20px; color: #6b7280; font-size: 14px;",
      stats: "display: flex; justify-content: space-between; margin: 25px 0; flex-wrap: wrap; gap: 15px;",
      statCard:
        "background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 10px; width: 30%; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;",
      statTitle: "font-size: 14px; color: #6b7280; margin-bottom: 10px;",
      statValue: `font-size: 28px; font-weight: bold; color: ${scaleupBlue};`,
      card: "background-color: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;",
      cardHeader:
        "background-color: #f9fafb; padding: 15px; margin: -20px -20px 20px; border-radius: 8px 8px 0 0; border-bottom: 1px solid #e5e7eb;",
      cardTitle: "font-size: 16px; font-weight: bold; margin: 0; color: #111827;",
      sectionTitle: "font-size: 15px; font-weight: bold; margin: 20px 0 10px; color: #4b5563;",
      list: "padding-left: 20px; margin: 10px 0;",
      listItem: "margin-bottom: 8px; color: #4b5563;",
      noItems: "color: #6b7280; font-style: italic; padding: 10px 0;",
      footer: `margin-top: 40px; padding: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: white; text-align: left; background-color: ${scaleupBlue};`,
      progressContainer: "width: 100%; height: 8px; background-color: #e5e7eb; border-radius: 4px; margin-top: 10px;",
      progressBar: "height: 100%; border-radius: 4px;",
      badge:
        "display: inline-block; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 500; margin-left: 8px;",
      facilitator: "display: flex; align-items: center; gap: 8px; margin-top: 10px; color: #6b7280;",
      facilitatorName: `font-weight: 600; color: ${scaleupBlue};`,
      opportunityInfo: "margin-top: 10px; font-size: 13px; color: #6b7280;",
      opportunityInfoItem: "margin-bottom: 4px;",
    }

    // Generar HTML para las oportunidades revisadas
    let reviewedOpportunitiesHtml = ""
    if (reviewedOpportunities && reviewedOpportunities.length > 0) {
      reviewedOpportunitiesHtml = reviewedOpportunities
        .map((opp) => {
          console.log(`=== GENERANDO HTML PARA OPORTUNIDAD: ${opp.title} ===`)
          console.log("partner_responsible:", opp.partner_responsible)
          console.log("partner_responsible_name:", opp.partner_responsible_name)

          // AQUÍ ES DONDE SE USA EL RESPONSABLE EN EL HTML DEL EMAIL
          const responsibleName =
            opp.partner_responsible_name ||
            (opp.partner_responsible
              ? `${opp.partner_responsible.first_name || ""} ${opp.partner_responsible.last_name || ""}`.trim() ||
                opp.partner_responsible.email ||
                "No asignado"
              : "No asignado")

          console.log("Responsable final para HTML:", responsibleName)

          return `
            <div style="${styles.card}">
              <div style="${styles.cardHeader}">
                <h3 style="${styles.cardTitle}">${opp.title} - ${opp.endCustomer}</h3>
              </div>
              
              <div style="${styles.opportunityInfo}">
                <div style="${styles.opportunityInfoItem}">
                  Oportunidad abierta hace ${getDaysSinceCreation(opp.created_at)} días
                </div>
                <div style="${styles.opportunityInfoItem}">
                  Responsable: ${responsibleName}
                </div>
                ${
                  opp.estimated_close_date
                    ? `<div style="${styles.opportunityInfoItem}">
                    Fecha estimada de cierre: ${formatDateSimple(opp.estimated_close_date)} - En ${getDaysUntilEstimatedClose(opp.estimated_close_date)} días
                  </div>`
                    : ""
                }
              </div>
              
              <h4 style="${styles.sectionTitle}">Próximas Acciones:</h4>
              ${
                opp.upcomingTasks && opp.upcomingTasks.length > 0
                  ? `<ul style="${styles.list}">
                      ${opp.upcomingTasks
                        .map(
                          (task) =>
                            `<li style="${styles.listItem}">${task.title} - Vence: ${task.dueDate} (Responsable: ${task.responsible})</li>`,
                        )
                        .join("")}
                    </ul>`
                  : `<p style="${styles.noItems}">No hay acciones programadas para los próximos 7 días</p>`
              }
              
              <h4 style="${styles.sectionTitle}">Acciones Nuevas:</h4>
              ${
                opp.newTasks && opp.newTasks.length > 0
                  ? `<ul style="${styles.list}">
                      ${opp.newTasks
                        .map(
                          (task) =>
                            `<li style="${styles.listItem}">${task.title} - Vence: ${task.dueDate} (Responsable: ${task.responsible})</li>`,
                        )
                        .join("")}
                    </ul>`
                  : `<p style="${styles.noItems}">No se crearon nuevas acciones durante la reunión</p>`
              }

              <h4 style="${styles.sectionTitle}">Notas Nuevas:</h4>
              ${
                opp.newNotes && opp.newNotes.length > 0
                  ? `<ul style="${styles.list}">
                      ${opp.newNotes
                        .map(
                          (note) =>
                            `<li style="${styles.listItem}">
                <strong>${note.author}:</strong> ${note.content}
              </li>`,
                        )
                        .join("")}
                    </ul>`
                  : `<p style="${styles.noItems}">No se agregaron nuevas notas durante la reunión</p>`
              }
            </div>
          `
        })
        .join("")
    } else {
      reviewedOpportunitiesHtml = `<p style="${styles.noItems}">No se revisaron oportunidades</p>`
    }

    // Generar HTML para las oportunidades no revisadas
    let unReviewedOpportunitiesHtml = ""
    if (unReviewedOpportunities && unReviewedOpportunities.length > 0) {
      unReviewedOpportunitiesHtml = unReviewedOpportunities
        .map((opp) => {
          const responsibleName =
            opp.partner_responsible_name ||
            (opp.partner_responsible
              ? `${opp.partner_responsible.first_name || ""} ${opp.partner_responsible.last_name || ""}`.trim() ||
                opp.partner_responsible.email ||
                "No asignado"
              : "No asignado")

          return `
            <div style="${styles.card}">
              <div style="${styles.cardHeader}">
                <h3 style="${styles.cardTitle}">${opp.title} - ${opp.endCustomer}</h3>
              </div>
              
              <div style="${styles.opportunityInfo}">
                <div style="${styles.opportunityInfoItem}">
                  Oportunidad abierta hace ${getDaysSinceCreation(opp.created_at)} días
                </div>
                <div style="${styles.opportunityInfoItem}">
                  Responsable: ${responsibleName}
                </div>
                ${
                  opp.estimated_close_date
                    ? `<div style="${styles.opportunityInfoItem}">
                    Fecha estimada de cierre: ${formatDateSimple(opp.estimated_close_date)} - En ${getDaysUntilEstimatedClose(opp.estimated_close_date)} días
                  </div>`
                    : ""
                }
              </div>
              
              <h4 style="${styles.sectionTitle}">Próximas Acciones:</h4>
              ${
                opp.upcomingTasks && opp.upcomingTasks.length > 0
                  ? `<ul style="${styles.list}">
                      ${opp.upcomingTasks
                        .map(
                          (task) =>
                            `<li style="${styles.listItem}">${task.title} - Vence: ${task.dueDate} (Responsable: ${task.responsible})</li>`,
                        )
                        .join("")}
                    </ul>`
                  : `<p style="${styles.noItems}">No hay acciones programadas para los próximos 7 días</p>`
              }
            </div>
          `
        })
        .join("")
    } else {
      unReviewedOpportunitiesHtml = `<p style="${styles.noItems}">Todas las oportunidades fueron revisadas</p>`
    }

    // Plantilla HTML completa con diseño mejorado
    return `
      <div style="${styles.container}">
        <div style="${styles.header}">
          <div style="position: absolute; top: 30px; right: 30px;">
            <img src="/images/design-mode/ScaleUp%20blanco.png" alt="ScaleUp Logo" width="120" height="40" style="height: 40px; width: auto;">
          </div>
          <h1 style="${styles.title}">Resumen de Reunión de Seguimiento</h1>
          <p>${partnerName} / ${techCompanyName}</p>
        </div>
        
        <div style="${styles.content}">
          <div style="${styles.meta}">
            <div>
              <strong>Fecha:</strong> ${date}
            </div>
            <div style="margin-left: 20px;">
              <strong>Facilitador:</strong> <span style="${styles.facilitatorName}">${userName}</span>
            </div>
          </div>
          
          <h2 style="${styles.subtitle}">Status General</h2>
          <div style="${styles.stats}">
            <div style="${styles.statCard}">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="${styles.statTitle}">Oportunidades Revisadas</div>
                <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${scaleupBlue};"></div>
              </div>
              <div style="${styles.statValue}">${stats.reviewedCount}/${stats.totalCount}</div>
              <div style="${styles.progressContainer}">
                <div style="${styles.progressBar}; width: ${stats.reviewedPercentage}%; background-color: ${scaleupBlue};"></div>
              </div>
              <div style="font-size: 14px; margin-top: 5px; color: #6b7280;">${stats.reviewedPercentage}% completado</div>
            </div>
            
            <div style="${styles.statCard}">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="${styles.statTitle}">Tareas Programadas</div>
                <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${scaleupBlue};"></div>
              </div>
              <div style="${styles.statValue}">${stats.upcomingTasksCount}</div>
            </div>
            
            <div style="${styles.statCard}">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="${styles.statTitle}">Tareas Nuevas</div>
                <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${scaleupBlue};"></div>
              </div>
              <div style="${styles.statValue}">${stats.newTasksCount}</div>
            </div>
          </div>
          
          <h2 style="${styles.subtitle}">Oportunidades Revisadas</h2>
          ${reviewedOpportunitiesHtml}
          
          <h2 style="${styles.subtitle}">Oportunidades No Revisadas</h2>
          ${unReviewedOpportunitiesHtml}
        </div>
        
        <div style="${styles.footer}">
          Este es un email automático generado por el sistema CRM ScaleUp. Por favor no responda a este email.
        </div>
      </div>
    `
  } catch (error) {
    console.log("Error en generateMeetingSummaryHtml:", error)
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Error al generar el resumen de la reunión</h1>
        <p>Se ha producido un error al generar el resumen de la reunión. Por favor, inténtelo de nuevo más tarde.</p>
      </div>
    `
  }
}

// Enviar resumen de la reunión por email
export async function sendMeetingSummary(data: {
  to: string[]
  partnerName: string
  techCompanyName: string
  opportunities: any[]
  reviewedOpportunityIds: string[]
  meetingStartTime: Date
  from?: string
  replyTo?: string
  userEmail?: string
  userName?: string
}): Promise<{ success: boolean; message?: string }> {
  try {
    console.log("=== INICIANDO ENVÍO DE RESUMEN DE REUNIÓN ===")
    console.log("Opportunities recibidas para email:", data.opportunities.length)
    console.log("Primera oportunidad para email:", JSON.stringify(data.opportunities[0], null, 2))

    const {
      to,
      partnerName,
      techCompanyName,
      opportunities,
      reviewedOpportunityIds,
      meetingStartTime,
      userEmail,
      userName,
    } = data

    // Validar datos de entrada
    if (!Array.isArray(to) || to.length === 0) {
      console.log("No hay destinatarios válidos")
      return {
        success: false,
        message: "No hay destinatarios válidos",
      }
    }

    if (!Array.isArray(opportunities)) {
      console.log("opportunities no es un array:", opportunities)
      return {
        success: false,
        message: "Error en los datos de oportunidades",
      }
    }

    if (!Array.isArray(reviewedOpportunityIds)) {
      console.log("reviewedOpportunityIds no es un array:", reviewedOpportunityIds)
      return {
        success: false,
        message: "Error en los datos de oportunidades revisadas",
      }
    }

    if (!(meetingStartTime instanceof Date)) {
      console.log("meetingStartTime no es una fecha válida:", meetingStartTime)
      // Intentar convertir a Date si es posible
      const correctedDate = new Date(meetingStartTime)
      if (isNaN(correctedDate.getTime())) {
        return {
          success: false,
          message: "Error en la fecha de inicio de la reunión",
        }
      }
      // Usar la fecha corregida
      data.meetingStartTime = correctedDate
    }

    console.log("Preparando datos para el resumen...")

    // Preparar los datos para el resumen
    let summaryData: any
    try {
      summaryData = prepareMeetingSummaryData({
        partnerName: partnerName || "N/A",
        techCompanyName: techCompanyName || "N/A",
        opportunities: Array.isArray(opportunities) ? opportunities : [],
        reviewedOpportunityIds: Array.isArray(reviewedOpportunityIds) ? reviewedOpportunityIds : [],
        meetingStartTime,
        userName, // Pasar el nombre del usuario
      })
    } catch (error) {
      console.log("Error al preparar los datos del resumen:", error)
      return {
        success: false,
        message: "Error al preparar los datos del resumen",
      }
    }

    console.log("Generando HTML del email...")

    // Generar el HTML del email con manejo de errores
    let html
    try {
      html = generateMeetingSummaryHtml(summaryData)
    } catch (error) {
      console.log("Error al generar el HTML del email:", error)
      return {
        success: false,
        message: "Error al generar el HTML del email",
      }
    }

    console.log("Enviando email...")

    // Enviar el email con manejo de errores
    try {
      const result = await sendEmail({
        to,
        subject: `Resumen de Reunión de Seguimiento - ${partnerName || "N/A"} / ${techCompanyName || "N/A"}`,
        html,
        from: data.from,
        replyTo: data.replyTo || userEmail,
      })

      console.log("Resultado del envío:", result)

      return result
    } catch (error) {
      console.log("Error al enviar el email:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error al enviar el email",
      }
    }
  } catch (error) {
    console.log("Error general al enviar el resumen de la reunión:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al enviar el resumen de la reunión",
    }
  }
}
