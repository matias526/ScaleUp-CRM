import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface InternalMeetingSummaryData {
  to: string[]
  meetingDate: string
  weeklyTopic: string | null
  newsItems: Array<{ title: string; description: string }>
  previousCommitments: Array<{
    title: string
    description: string | null
    commitment_status: string | null
    tech_company_name: string | null
    user_name: string
  }>
  currentCommitments: Array<{
    title: string
    description: string | null
    tech_company_name: string | null
    user_name: string
  }>
  participants: Array<{
    first_name: string
    last_name: string
    email: string
  }>
}

export async function sendInternalMeetingSummary(
  data: InternalMeetingSummaryData,
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log("[v0] sendInternalMeetingSummary called with data:", {
      to: data.to,
      newsCount: data.newsItems?.length || 0,
      previousCommitmentsCount: data.previousCommitments?.length || 0,
      currentCommitmentsCount: data.currentCommitments?.length || 0,
      participantsCount: data.participants?.length || 0,
    })

    const html = generateInternalMeetingSummaryHtml(data)

    console.log("[v0] HTML generated, sending email via Resend...")

    const result = await resend.emails.send({
      from: process.env.NEXT_PUBLIC_EMAIL_FROM || "onboarding@resend.dev",
      to: data.to,
      subject: `Resumen Reunión Interna - ${format(new Date(data.meetingDate), "dd/MM/yyyy")}`,
      html,
    })

    console.log("[v0] Resend result:", result)

    return {
      success: true,
      message: "Email enviado correctamente",
    }
  } catch (error) {
    console.error("[v0] Error in sendInternalMeetingSummary:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al enviar el email",
    }
  }
}

function generateInternalMeetingSummaryHtml(data: InternalMeetingSummaryData): string {
  const { meetingDate, weeklyTopic, newsItems, previousCommitments, currentCommitments, participants } = data

  const scaleupBlue = "#0055b8"

  const styles = {
    container:
      "font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0; padding: 0; background-color: #f9fafb;",
    header: `background: ${scaleupBlue}; padding: 30px; color: white; text-align: left; position: relative;`,
    logo: "position: absolute; top: 30px; right: 30px;",
    title: "font-size: 24px; font-weight: bold; margin-bottom: 10px; color: white;",
    subtitle: "font-size: 14px; color: white; opacity: 0.9;",
    content: "padding: 30px; background-color: white;",
    sectionTitle: `font-size: 18px; font-weight: bold; margin: 25px 0 15px; color: ${scaleupBlue}; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;`,
    card: "background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 15px; border-left: 4px solid #e5e7eb;",
    cardTitle: "font-size: 16px; font-weight: bold; margin: 0 0 8px 0; color: #111827;",
    cardDescription: "font-size: 14px; color: #6b7280; margin: 0; line-height: 1.5;",
    commitmentCard:
      "background-color: white; border-radius: 8px; padding: 15px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border-left: 4px solid #e5e7eb;",
    commitmentTitle: "font-size: 14px; font-weight: 600; margin: 0 0 4px 0; color: #111827;",
    commitmentMeta: "font-size: 13px; color: #6b7280; margin: 4px 0;",
    badge:
      "display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; margin-left: 8px;",
    userSection: "margin-bottom: 20px;",
    userName: `font-size: 15px; font-weight: 600; color: ${scaleupBlue}; margin-bottom: 8px;`,
    statsContainer: "display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap;",
    statBadge: "padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;",
    progressBar: "width: 100%; height: 8px; background-color: #e5e7eb; border-radius: 4px; margin-top: 8px;",
    progressFill: "height: 100%; border-radius: 4px;",
    topicCard: "background-color: #fffbeb; border-radius: 8px; padding: 20px; border-left: 4px solid #f59e0b;",
    topicText: "font-size: 15px; color: #92400e; margin: 0; line-height: 1.6;",
    participantsList: "list-style: none; padding: 0; margin: 10px 0;",
    participantItem: "font-size: 14px; color: #4b5563; padding: 6px 0; border-bottom: 1px solid #f3f4f6;",
    footer: `margin-top: 30px; padding: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: white; text-align: left; background-color: ${scaleupBlue};`,
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return ""
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      completed: { bg: "#dcfce7", text: "#166534", label: "Cumplido" },
      not_completed: { bg: "#fee2e2", text: "#991b1b", label: "No Cumplido" },
      partial: { bg: "#fef3c7", text: "#92400e", label: "Parcial" },
    }
    const config = statusConfig[status] || { bg: "#f3f4f6", text: "#6b7280", label: status }
    return `<span style="${styles.badge}; background-color: ${config.bg}; color: ${config.text};">${config.label}</span>`
  }

  // Group commitments by user
  const groupedPreviousCommitments = previousCommitments.reduce(
    (acc, commitment) => {
      if (!acc[commitment.user_name]) {
        acc[commitment.user_name] = []
      }
      acc[commitment.user_name].push(commitment)
      return acc
    },
    {} as Record<string, typeof previousCommitments>,
  )

  const groupedCurrentCommitments = currentCommitments.reduce(
    (acc, commitment) => {
      if (!acc[commitment.user_name]) {
        acc[commitment.user_name] = []
      }
      acc[commitment.user_name].push(commitment)
      return acc
    },
    {} as Record<string, typeof currentCommitments>,
  )

  // Calculate stats for each user
  const userStats = Object.entries(groupedPreviousCommitments).map(([userName, commitments]) => {
    const total = commitments.length
    const completed = commitments.filter((c) => c.commitment_status === "completed").length
    const notCompleted = commitments.filter((c) => c.commitment_status === "not_completed").length
    const partial = commitments.filter((c) => c.commitment_status === "partial").length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return { userName, total, completed, notCompleted, partial, percentage }
  })

  // Calculate overall stats
  const totalPreviousCommitments = previousCommitments.length
  const totalCompleted = previousCommitments.filter((c) => c.commitment_status === "completed").length
  const overallPercentage =
    totalPreviousCommitments > 0 ? Math.round((totalCompleted / totalPreviousCommitments) * 100) : 0

  return `
    <div style="${styles.container}">
      <div style="${styles.header}">
        <div style="${styles.logo}">
          <img src="/images/design-mode/ScaleUp%20blanco.png" alt="ScaleUp Logo" width="120" height="40" style="height: 40px; width: auto;">
        </div>
        <h1 style="${styles.title}">Resumen Reunión Interna</h1>
        <p style="${styles.subtitle}">${format(new Date(meetingDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}</p>
      </div>
      
      <div style="${styles.content}">
        
        <h2 style="${styles.sectionTitle}">👥 Participantes</h2>
        <ul style="${styles.participantsList}">
          ${participants
            .map((p) => `<li style="${styles.participantItem}">${p.first_name} ${p.last_name} (${p.email})</li>`)
            .join("")}
        </ul>
        
        ${
          newsItems && newsItems.length > 0
            ? `
        <h2 style="${styles.sectionTitle}">📰 Noticias Generales</h2>
        ${newsItems
          .map(
            (news) => `
          <div style="${styles.card}">
            <h3 style="${styles.cardTitle}">${news.title}</h3>
            <p style="${styles.cardDescription}">${news.description}</p>
          </div>
        `,
          )
          .join("")}
        `
            : ""
        }
        
        <h2 style="${styles.sectionTitle}">✓ Compromisos</h2>
        
        ${
          previousCommitments && previousCommitments.length > 0
            ? `
        <h3 style="font-size: 16px; font-weight: 600; color: #4b5563; margin: 20px 0 10px;">Compromisos Semana Anterior</h3>
        
        ${Object.entries(groupedPreviousCommitments)
          .map(([userName, commitments]) => {
            const stats = userStats.find((s) => s.userName === userName)!
            return `
          <div style="${styles.userSection}">
            <div style="${styles.userName}">${userName} (${stats.percentage}%)</div>
            <div style="${styles.statsContainer}">
              <span style="${styles.statBadge}; background-color: #dcfce7; color: #166534;">✓ ${stats.completed} Cumplidos</span>
              <span style="${styles.statBadge}; background-color: #fee2e2; color: #991b1b;">✗ ${stats.notCompleted} No Cumplidos</span>
              <span style="${styles.statBadge}; background-color: #fef3c7; color: #92400e;">◐ ${stats.partial} Parciales</span>
            </div>
            <div style="${styles.progressBar}">
              <div style="${styles.progressFill}; width: ${stats.percentage}%; background-color: ${scaleupBlue};"></div>
            </div>
            
            ${commitments
              .map(
                (c) => `
              <div style="${styles.commitmentCard}">
                <div style="${styles.commitmentTitle}">
                  ${c.title}
                  ${getStatusBadge(c.commitment_status)}
                </div>
                ${c.description ? `<div style="${styles.commitmentMeta}">${c.description}</div>` : ""}
                ${c.tech_company_name ? `<div style="${styles.commitmentMeta}">Empresa: ${c.tech_company_name}</div>` : ""}
              </div>
            `,
              )
              .join("")}
          </div>
        `
          })
          .join("")}
        
        <div style="margin: 15px 0; padding: 15px; background-color: #f0f9ff; border-radius: 8px; border-left: 4px solid ${scaleupBlue};">
          <strong style="color: ${scaleupBlue};">📊 Cumplimiento General del Equipo: ${overallPercentage}%</strong>
          <div style="${styles.progressBar}; margin-top: 8px;">
            <div style="${styles.progressFill}; width: ${overallPercentage}%; background-color: ${scaleupBlue};"></div>
          </div>
        </div>
        `
            : ""
        }
        
        ${
          currentCommitments && currentCommitments.length > 0
            ? `
        <h3 style="font-size: 16px; font-weight: 600; color: #4b5563; margin: 20px 0 10px;">Compromisos Asumidos Esta Reunión</h3>
        
        ${Object.entries(groupedCurrentCommitments)
          .map(
            ([userName, commitments]) => `
          <div style="${styles.userSection}">
            <div style="${styles.userName}">${userName}</div>
            
            ${commitments
              .map(
                (c) => `
              <div style="${styles.commitmentCard}">
                <div style="${styles.commitmentTitle}">${c.title}</div>
                ${c.description ? `<div style="${styles.commitmentMeta}">${c.description}</div>` : ""}
                ${c.tech_company_name ? `<div style="${styles.commitmentMeta}">Empresa: ${c.tech_company_name}</div>` : ""}
              </div>
            `,
              )
              .join("")}
          </div>
        `,
          )
          .join("")}
        `
            : ""
        }
        
        ${
          weeklyTopic
            ? `
        <h2 style="${styles.sectionTitle}">💡 Tema de la Semana</h2>
        <div style="${styles.topicCard}">
          <p style="${styles.topicText}">${weeklyTopic}</p>
        </div>
        `
            : ""
        }
        
      </div>
      
      <div style="${styles.footer}">
        <strong>ScaleUp - Reunión Interna</strong><br>
        Este es un resumen automático de la reunión
      </div>
    </div>
  `
}
