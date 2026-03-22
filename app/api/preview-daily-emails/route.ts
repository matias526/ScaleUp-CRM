import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

interface TaskData {
  id: string
  title: string
  description: string | null
  due_date: string | null
  priority: string
  status: string
  is_commitment: boolean
  assigned_to: string
  assigned_by: string
  company_name: string | null
  assigned_to_name: string | null
  assigned_by_name: string | null
}

interface UserData {
  id: string
  email: string
  first_name: string
  last_name: string
  preferred_language: string
  role_code: string
}

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
  const usersQuery = {
    table: "users",
    select: "id, email, first_name, last_name, preferred_language, roles!inner (code)",
    filters: {
      is_active: true,
      receive_daily_email: true
    },
    limit: 10
  }

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
    query: `SELECT ${usersQuery.select} FROM ${usersQuery.table} WHERE is_active = true AND receive_daily_email = true LIMIT 10`,
    params: usersQuery.filters,
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

  // Si no hay usuarios, también verificar cuántos usuarios hay en total y cuántos tienen el flag
  if (!users || users.length === 0) {
    // Query adicional para debug: contar usuarios totales
    const { data: totalUsers, error: totalError } = await supabase
      .from("users")
      .select("id, email, first_name, is_active, receive_daily_email")
      .limit(20)

    debugLogs.push({
      query: "SELECT id, email, first_name, is_active, receive_daily_email FROM users LIMIT 20",
      params: {},
      result: {
        success: !totalError,
        count: totalUsers?.length || 0,
        error: totalError?.message,
        data: totalUsers
      }
    })

    // Query para ver usuarios activos
    const { data: activeUsers, error: activeError } = await supabase
      .from("users")
      .select("id, email, first_name, receive_daily_email")
      .eq("is_active", true)
      .limit(20)

    debugLogs.push({
      query: "SELECT id, email, first_name, receive_daily_email FROM users WHERE is_active = true LIMIT 20",
      params: { is_active: true },
      result: {
        success: !activeError,
        count: activeUsers?.length || 0,
        error: activeError?.message,
        data: activeUsers
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
    const userData: UserData = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      preferred_language: user.preferred_language || "es",
      role_code: (user.roles as any)?.code || ""
    }

    const isScaleUpUser = ["Admin", "BDD"].includes(userData.role_code)

    // Get tasks assigned TO this user (my tasks) - query simple sin joins
    const { data: myTasks, error: myTasksError } = await supabase
      .from("tasks")
      .select(`
        id, title, description, due_date, priority, status, is_commitment,
        assigned_to, assigned_by, tech_company_id
      `)
      .eq("assigned_to", user.id)
      .in("status", ["pending", "in_progress"])

    debugLogs.push({
      query: `SELECT id, title, description, due_date, priority, status, is_commitment, assigned_to, assigned_by, tech_company_id FROM tasks WHERE assigned_to = '${user.id}' AND status IN ('pending', 'in_progress')`,
      params: { assigned_to: user.id, status: ["pending", "in_progress"] },
      result: {
        success: !myTasksError,
        count: myTasks?.length || 0,
        error: myTasksError?.message,
        data: myTasks
      }
    })

    // Get tasks assigned BY this user to others - query simple sin joins
    const { data: assignedTasks, error: assignedError } = await supabase
      .from("tasks")
      .select(`
        id, title, description, due_date, priority, status, is_commitment,
        assigned_to, assigned_by, tech_company_id
      `)
      .eq("assigned_by", user.id)
      .neq("assigned_to", user.id)
      .in("status", ["pending", "in_progress"])

    debugLogs.push({
      query: `SELECT id, title, description, due_date, priority, status, is_commitment, assigned_to, assigned_by, tech_company_id FROM tasks WHERE assigned_by = '${user.id}' AND assigned_to != '${user.id}' AND status IN ('pending', 'in_progress')`,
      params: { assigned_by: user.id, assigned_to_neq: user.id, status: ["pending", "in_progress"] },
      result: {
        success: !assignedError,
        count: assignedTasks?.length || 0,
        error: assignedError?.message,
        data: assignedTasks
      }
    })

    // Get tech company names for all tasks
    const allTechCompanyIds = [...new Set([...(myTasks || []), ...(assignedTasks || [])].map(t => t.tech_company_id).filter(Boolean))]
    let techCompaniesMap: Record<string, string> = {}
    
    if (allTechCompanyIds.length > 0) {
      const { data: techCompanies } = await supabase
        .from("tech_companies")
        .select("id, name")
        .in("id", allTechCompanyIds)
      
      techCompaniesMap = (techCompanies || []).reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {})
      
      debugLogs.push({
        query: `SELECT id, name FROM tech_companies WHERE id IN (${allTechCompanyIds.map(id => `'${id}'`).join(", ")})`,
        params: { tech_company_ids: allTechCompanyIds },
        result: {
          success: true,
        count: techCompanies?.length || 0,
        data: techCompanies
        }
      })
    }

    // Get user names for assigned_to and assigned_by
    const allUserIds = [...new Set([...(myTasks || []), ...(assignedTasks || [])].flatMap(t => [t.assigned_to, t.assigned_by]).filter(Boolean))]
    let usersMap: Record<string, string> = {}
    
    if (allUserIds.length > 0) {
      const { data: usersData } = await supabase
        .from("users")
        .select("id, first_name, last_name")
        .in("id", allUserIds)
      
      usersMap = (usersData || []).reduce((acc, u) => ({ ...acc, [u.id]: `${u.first_name} ${u.last_name}` }), {})
      
      debugLogs.push({
        query: `SELECT id, first_name, last_name FROM users WHERE id IN (${allUserIds.length} users)`,
        params: { user_ids: allUserIds },
        result: {
          success: true,
          count: usersData?.length || 0,
          data: usersData
        }
      })
    }

    const formatTasks = (tasks: any[], techCompaniesMap: Record<string, string>, usersMap: Record<string, string>): TaskData[] => {
      return tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        due_date: t.due_date,
        priority: t.priority,
        status: t.status,
        is_commitment: t.is_commitment || false,
        assigned_to: t.assigned_to,
        assigned_by: t.assigned_by,
        company_name: t.tech_company_id ? techCompaniesMap[t.tech_company_id] || null : null,
        assigned_to_name: t.assigned_to ? usersMap[t.assigned_to] || null : null,
        assigned_by_name: t.assigned_by ? usersMap[t.assigned_by] || null : null
      }))
    }

    const myTasksFormatted = formatTasks(myTasks || [], techCompaniesMap, usersMap)
    const assignedTasksFormatted = formatTasks(assignedTasks || [], techCompaniesMap, usersMap)

    // Skip if no tasks
    if (myTasksFormatted.length === 0 && assignedTasksFormatted.length === 0) {
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

    // Generate HTML
    const html = generateEmailHtml(userData, myTasksFormatted, assignedTasksFormatted, isScaleUpUser)

    emailPreviews.push({
      user: {
        id: userData.id,
        name: `${userData.first_name} ${userData.last_name}`,
        email: userData.email,
        role: userData.role_code,
        isScaleUp: isScaleUpUser
      },
      stats: {
        myTasks: myTasksFormatted.length,
        assignedTasks: assignedTasksFormatted.length,
        myCommitments: myTasksFormatted.filter(t => t.is_commitment).length,
        assignedCommitments: assignedTasksFormatted.filter(t => t.is_commitment).length
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

function generateEmailHtml(
  user: UserData,
  myTasks: TaskData[],
  assignedTasks: TaskData[],
  isScaleUpUser: boolean
): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const threeDaysFromNow = new Date(today)
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

  const categorizeTasks = (tasks: TaskData[]) => {
    const overdue: TaskData[] = []
    const dueSoon: TaskData[] = []
    const other: TaskData[] = []

    for (const task of tasks) {
      if (!task.due_date) {
        other.push(task)
        continue
      }
      
      const dueDate = new Date(task.due_date)
      dueDate.setHours(0, 0, 0, 0)
      
      if (dueDate < today) {
        overdue.push(task)
      } else if (dueDate <= threeDaysFromNow) {
        dueSoon.push(task)
      } else {
        other.push(task)
      }
    }

    return { overdue, dueSoon, other }
  }

  const renderTaskRow = (task: TaskData, showAssignee: boolean = false) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    
    let urgencyBadge = ""
    if (task.due_date) {
      const dueDate = new Date(task.due_date)
      dueDate.setHours(0, 0, 0, 0)
      
      if (dueDate < today) {
        urgencyBadge = `<span style="background-color: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">VENCIDA</span>`
      } else if (dueDate <= threeDaysFromNow) {
        urgencyBadge = `<span style="background-color: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">PRONTO</span>`
      }
    }

    const commitmentBadge = task.is_commitment && isScaleUpUser
      ? `<span style="background-color: #ede9fe; color: #7c3aed; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-right: 6px;">CS</span>`
      : ""

    const assigneeInfo = showAssignee && task.assigned_to_name
      ? `<div style="color: #6b7280; font-size: 12px; margin-top: 2px;">Asignado a: ${task.assigned_to_name}</div>`
      : ""

    const dueDateFormatted = task.due_date
      ? new Date(task.due_date).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
      : "Sin fecha"

    return `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6;">
          <div style="display: flex; align-items: flex-start; gap: 8px;">
            <div style="flex: 1;">
              <div style="font-weight: 500; color: #111827; margin-bottom: 2px;">
                ${commitmentBadge}${task.title}
              </div>
              ${task.company_name ? `<div style="color: #6b7280; font-size: 13px;">${task.company_name}</div>` : ""}
              ${assigneeInfo}
            </div>
            <div style="text-align: right; white-space: nowrap;">
              <div style="margin-bottom: 4px;">${urgencyBadge}</div>
              <div style="color: #6b7280; font-size: 12px;">${dueDateFormatted}</div>
            </div>
          </div>
        </td>
      </tr>
    `
  }

  const renderSection = (title: string, tasks: TaskData[], showAssignee: boolean = false) => {
    if (tasks.length === 0) return ""

    // Separate commitments (only for ScaleUp users)
    const commitments = isScaleUpUser ? tasks.filter(t => t.is_commitment) : []
    const regularTasks = isScaleUpUser ? tasks.filter(t => !t.is_commitment) : tasks

    const { overdue: overdueCommitments, dueSoon: dueSoonCommitments, other: otherCommitments } = categorizeTasks(commitments)
    const { overdue: overdueRegular, dueSoon: dueSoonRegular, other: otherRegular } = categorizeTasks(regularTasks)

    let html = `
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">
          ${title}
        </h2>
    `

    // Commitments section (only if there are any and user is ScaleUp)
    if (commitments.length > 0) {
      html += `
        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 13px; font-weight: 600; color: #7c3aed; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">
            Compromisos Semanales (${commitments.length})
          </h3>
          <table style="width: 100%; border-collapse: collapse; background-color: #faf5ff; border-radius: 8px; overflow: hidden;">
            <tbody>
              ${[...overdueCommitments, ...dueSoonCommitments, ...otherCommitments].map(t => renderTaskRow(t, showAssignee)).join("")}
            </tbody>
          </table>
        </div>
      `
    }

    // Regular tasks section
    if (regularTasks.length > 0) {
      const sectionTitle = commitments.length > 0 ? "Otras Tareas" : ""
      html += `
        <div>
          ${sectionTitle ? `<h3 style="font-size: 13px; font-weight: 600; color: #6b7280; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">${sectionTitle} (${regularTasks.length})</h3>` : ""}
          <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <tbody>
              ${[...overdueRegular, ...dueSoonRegular, ...otherRegular].map(t => renderTaskRow(t, showAssignee)).join("")}
            </tbody>
          </table>
        </div>
      `
    }

    html += `</div>`
    return html
  }

  const myTasksHtml = renderSection("Mis Tareas Pendientes", myTasks, false)
  const assignedTasksHtml = renderSection("Tareas que Asigné a Otros", assignedTasks, true)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0;">
            Tareas Pendientes
          </h1>
          <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">
            Hola ${user.first_name}, aquí está tu resumen de tareas
          </p>
        </div>

        <!-- Content -->
        <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          ${myTasksHtml}
          ${assignedTasksHtml}
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">Este es un correo automático del sistema CRM ScaleUp</p>
        </div>
      </div>
    </body>
    </html>
  `
}
