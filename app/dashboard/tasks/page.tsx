//import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createServerClient } from "@/lib/supabase/server"
//import { cookies } from "next/headers"
import TasksTable from "@/components/tasks/tasks-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function TasksPage() {
  //const supabase = createServerComponentClient({ cookies })
  const supabase = createServerClient()

  // Obtener el usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Obtener el rol del usuario
  let userRole = null
  let isAdmin = false
  let isBDD = false
  let isPartnerUser = false
  let isTechUser = false

  if (user) {
    // Consulta correcta para obtener el rol del usuario
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, role_id, roles:role_id(id, code)")
      .eq("id", user.id)
      .single()

    if (userData?.roles?.code) {
      userRole = userData.roles.code
      const roleCodeLower = userRole.toLowerCase()

      isAdmin = roleCodeLower === "admin"
      isBDD = roleCodeLower === "bdd"
      isPartnerUser = roleCodeLower.includes("partner")
      isTechUser = roleCodeLower.includes("tech") && roleCodeLower.includes("user")
    }
  }

  // Obtener todas las tech companies para los filtros
  const { data: techCompanies } = await supabase.from("tech_companies").select("id, name").order("name")

  // Obtener todos los partners para los filtros
  const { data: partners } = await supabase.from("partners").select("id, name").order("name")

  // Obtener las tareas según el rol del usuario
  let tasks = []
  let tasksQuery = null

  if (user) {
    if (isAdmin) {
      // Si es Admin, obtener todas las tareas
      tasksQuery = supabase
        .from("tasks")
        .select(`
          *,
          assigned_to_user:assigned_to(id, first_name, last_name, email),
          assigned_by_user:assigned_by(id, first_name, last_name, email),
          tech_company:tech_company_id(id, name),
          partner:partner_id(id, name),
          opportunity:opportunity_id(id, title),
          task_type:task_type_id(id, name, code)
        `)
        .is("parent_task_id", null) // Solo tareas principales
        .order("created_at", { ascending: false })
    } else if (isBDD || isPartnerUser || isTechUser) {
      // Para BDD, PartnerUser y TechUser: solo tareas que crearon o están asignadas a ellos
      tasksQuery = supabase
        .from("tasks")
        .select(`
          *,
          assigned_to_user:assigned_to(id, first_name, last_name, email),
          assigned_by_user:assigned_by(id, first_name, last_name, email),
          tech_company:tech_company_id(id, name),
          partner:partner_id(id, name),
          opportunity:opportunity_id(id, title),
          task_type:task_type_id(id, name, code)
        `)
        .or(`assigned_to.eq.${user.id},assigned_by.eq.${user.id}`)
        .is("parent_task_id", null) // Solo tareas principales
        .order("created_at", { ascending: false })
    }

    if (tasksQuery) {
      const { data, error } = await tasksQuery

      if (error) {
        console.error("Error al obtener tareas:", error)
      } else {
        tasks = data || []
      }
    }
  }

  // Verificar si el usuario tiene tareas asignadas o creadas
  let userHasTasks = false
  if (user) {
    const { count, error } = await supabase
      .from("tasks")
      .select("id", { count: "exact" })
      .or(`assigned_to.eq.${user.id},assigned_by.eq.${user.id}`)

    if (!error) {
      userHasTasks = count > 0
    }
  }

  return (
    <div className="p-0 sm:p-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Link href="/dashboard/tasks/create">
          <Button className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </Button>
        </Link>
      </div>

      <TasksTable
        initialTasks={tasks}
        userRoleInfo={{ id: user?.id || null, role: userRole, isAdmin, isBDD, isPartnerUser, isTechUser }}
        techCompanies={techCompanies || []}
        partners={partners || []}
      />
    </div>
  )
}
