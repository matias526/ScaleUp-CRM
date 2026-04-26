import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendPulseMessage } from "@/lib/services/pulse-message-service"

// Esta función se ejecutará cada 5 minutos para enviar mensajes programados
export async function GET(request: NextRequest) {
  try {
    // Obtener headers para validar que viene de Vercel
    const headers = Object.fromEntries(request.headers.entries())
    const isVercelExecution = headers["x-vercel-id"] || headers["x-vercel-deployment-url"] || headers["x-vercel-cron"]
    const manualToken = request.nextUrl.searchParams.get("token")

    // Validar que la solicitud viene de Vercel o tiene token válido
    if (!isVercelExecution && manualToken !== "manual-execution-2024") {
      console.log("[CronJob-ScheduledMessages] Solicitud no autorizada")
      return NextResponse.json(
        {
          error: "Unauthorized - Not from Vercel or missing valid token",
        },
        { status: 401 },
      )
    }

    console.log("[CronJob-ScheduledMessages] ✅ Iniciando envío de mensajes programados")
    console.log(`[CronJob-ScheduledMessages] Fecha y hora: ${new Date().toISOString()}`)

    const supabase = await createClient()

    // Buscar mensajes con estado "scheduled" y scheduled_at <= ahora
    const { data: scheduledMessages, error: fetchError } = await supabase
      .from("pulse_messages")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(50) // Limitar a 50 por ejecución para no saturar

    if (fetchError) {
      console.error("[CronJob-ScheduledMessages] Error al buscar mensajes programados:", fetchError)
      return NextResponse.json(
        {
          success: false,
          error: fetchError.message,
        },
        { status: 500 },
      )
    }

    if (!scheduledMessages || scheduledMessages.length === 0) {
      console.log("[CronJob-ScheduledMessages] ℹ️ No hay mensajes programados para enviar en este momento")
      return NextResponse.json({
        success: true,
        scheduled: 0,
        sent: 0,
        failed: 0,
        message: "No hay mensajes pendientes de envío",
        timestamp: new Date().toISOString(),
      })
    }

    console.log(
      `[CronJob-ScheduledMessages] Encontrados ${scheduledMessages.length} mensajes para enviar`,
    )

    const results = []

    for (const message of scheduledMessages) {
      try {
        console.log(`[CronJob-ScheduledMessages] Enviando mensaje ID: ${message.id}`)

        // Parsear los datos del mensaje programado
        const toEmails = message.to_emails || []
        const ccEmails = message.cc_emails || []
        const bccEmails = message.bcc_emails || []

        // Reconstituir el payload original para sendPulseMessage
        const payload = {
          template_id: message.template_id || null,
          opportunity_id: message.opportunity_id,
          user_id: message.user_id,
          to_emails: toEmails,
          cc_emails: ccEmails,
          bcc_emails: bccEmails,
          subject: message.subject,
          body_content: message.body_content,
          send_mode: message.send_mode || "group",
          channel: message.channel || "email",
          senderMode: message.sender_mode || "system",
          recipients: message.recipients || [],
          variables_values: message.variables_values || {},
        }

        // Enviar el mensaje
        const sendResult = await sendPulseMessage(payload)

        if (sendResult.success) {
          // Actualizar estado a "sent"
          const { error: updateError } = await supabase
            .from("pulse_messages")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", message.id)

          if (updateError) {
            console.error(`[CronJob-ScheduledMessages] Error al actualizar mensaje ${message.id}:`, updateError)
            results.push({
              messageId: message.id,
              success: false,
              error: `Enviado pero error al actualizar estado: ${updateError.message}`,
            })
          } else {
            console.log(`[CronJob-ScheduledMessages] ✅ Mensaje ${message.id} enviado exitosamente`)
            results.push({
              messageId: message.id,
              success: true,
              recipients: toEmails.length + ccEmails.length + bccEmails.length,
            })
          }
        } else {
          console.error(`[CronJob-ScheduledMessages] ❌ Error al enviar mensaje ${message.id}:`, sendResult.message)
          results.push({
            messageId: message.id,
            success: false,
            error: sendResult.message || "Error desconocido",
          })
        }
      } catch (error) {
        console.error(`[CronJob-ScheduledMessages] ❌ Excepción al procesar mensaje:`, error)
        results.push({
          messageId: message.id,
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido",
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    console.log(
      `[CronJob-ScheduledMessages] ✅ Proceso completado: ${successCount} exitosos, ${failureCount} fallidos`,
    )

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total: scheduledMessages.length,
        successful: successCount,
        failed: failureCount,
      },
      results,
    })
  } catch (error) {
    console.error("[CronJob-ScheduledMessages] ❌ Error crítico:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// También permitir POST para pruebas manuales
export async function POST(request: NextRequest) {
  try {
    const headers = Object.fromEntries(request.headers.entries())
    const isVercelExecution = headers["x-vercel-id"] || headers["x-vercel-deployment-url"] || headers["x-vercel-cron"]

    if (!isVercelExecution) {
      console.log("[CronJob-ScheduledMessages] POST no autorizado - no proviene de Vercel")
      return NextResponse.json(
        {
          error: "Unauthorized - Not from Vercel",
        },
        { status: 401 },
      )
    }

    console.log("[CronJob-ScheduledMessages] 🧪 Ejecución manual (POST)")

    // Reutilizar la lógica de GET
    const getRequest = new NextRequest(request.url, { method: "GET" })
    return GET(getRequest)
  } catch (error) {
    console.error("[CronJob-ScheduledMessages] ❌ Error en POST:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
