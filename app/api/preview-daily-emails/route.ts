import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { DailyEmailService, DailyEmailData } from "@/lib/services/daily-email-service"
import { format } from "date-fns"

interface DebugLog {
  query: string
  params: Record<string, any>
  result: {
    success: boolean
    count: number
    error?: string
    data?: any
  }
}

export async function GET() {
  const supabase = createServerClient()
  const debugLogs: DebugLog[] = []
  
  // Query 1: Get users with receive_daily_email = true
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select(`
      id, email, first_name, last_name, preferred_language,
      roles!inner (code)
    `)
    .eq("is_active", true)
    .eq("receive_daily_email", true)
    .limit(10)

  debugLogs.push({
    query: `SELECT id, email, first_name, last_name, preferred_language, roles.code FROM users WHERE is_active = true AND receive_daily_email = true LIMIT 10`,
    params: { is_active: true, receive_daily_email: true },
    result: {
      success: !usersError,
      count: users?.length || 0,
      error: usersError?.message,
      data: users
    }
  })

  if (usersError) {
    return NextResponse.json({ 
      error: usersError.message,
      debugLogs 
    }, { status: 500 })
  }

  // Si no hay usuarios, mostrar diagnóstico
  if (!users || users.length === 0) {
    const { data: allUsers } = await supabase
      .from("users")
      .select("id, email, first_name, is_active, receive_daily_email")
      .limit(20)

    debugLogs.push({
      query: "SELECT id, email, first_name, is_active, receive_daily_email FROM users LIMIT 20",
      params: {},
      result: {
        success: true,
        count: allUsers?.length || 0,
        data: allUsers
      }
    })

    return NextResponse.json({
      totalUsers: 0,
      usersWithTasks: 0,
      previews: [],
      debugLogs,
      message: "No se encontraron usuarios con receive_daily_email = true"
    })
  }

  const emailPreviews = []

  for (const user of users || []) {
    const roleCode = (user.roles as any)?.code || null

    // Usar el servicio real para obtener los datos del email
    const emailData = await DailyEmailService.getDailyEmailData(user.id, roleCode)

    debugLogs.push({
      query: `DailyEmailService.getDailyEmailData('${user.id}', '${roleCode}')`,
      params: { userId: user.id, roleCode },
      result: {
        success: !!emailData,
        count: emailData ? (emailData.stats.totalMyTasks + emailData.stats.totalAssignedToOthers) : 0,
        data: emailData ? {
          totalMyTasks: emailData.stats.totalMyTasks,
          totalAssignedToOthers: emailData.stats.totalAssignedToOthers,
          overdueCount: emailData.stats.overdueCount,
          isScaleUpUser: emailData.isScaleUpUser
        } : null
      }
    })

    if (!emailData) {
      continue
    }

    // Verificar si tiene tareas
    const hasTasks = emailData.stats.totalMyTasks > 0 || emailData.stats.totalAssignedToOthers > 0

    if (!hasTasks) {
      debugLogs.push({
        query: `SKIP: Usuario ${user.email} no tiene tareas pendientes`,
        params: { user_id: user.id },
        result: {
          success: true,
          count: 0,
          data: { myTasks: 0, assignedTasks: 0 }
        }
      })
      continue
    }

    // Generar el HTML usando el servicio real
    const html = DailyEmailService.generateDailyEmailHtml(emailData, true)
    
    // Generar el asunto del email
    const todayFormatted = format(new Date(), "dd/MM/yyyy")
    const subject = `ScaleUp - Tareas Pendientes ${todayFormatted}`

    emailPreviews.push({
      user: {
        id: emailData.user.id,
        name: `${emailData.user.first_name} ${emailData.user.last_name}`,
        email: emailData.user.email,
        role: emailData.user.role_code,
        language: emailData.user.preferred_language,
        isScaleUp: emailData.isScaleUpUser
      },
      subject,
      stats: {
        myTasks: emailData.stats.totalMyTasks,
        assignedTasks: emailData.stats.totalAssignedToOthers,
        overdueCount: emailData.stats.overdueCount,
        myCommitments: countCommitments(emailData.tasks.myTasks),
        assignedCommitments: countCommitments(emailData.tasks.assignedToOthers)
      },
      html
    })
  }

  return NextResponse.json({
    totalUsers: users?.length || 0,
    usersWithTasks: emailPreviews.length,
    previews: emailPreviews,
    debugLogs
  })
}

function countCommitments(group: { commitments: { overdue: any[]; dueSoon: any[]; other: any[] } }): number {
  return group.commitments.overdue.length + group.commitments.dueSoon.length + group.commitments.other.length
}
