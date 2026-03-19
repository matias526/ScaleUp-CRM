"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"

export default function TasksFilterDebug() {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Obtener usuario actual
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // Obtener rol del usuario
          const { data: userRoles } = await supabase
            .from("user_roles")
            .select("role_code")
            .eq("user_id", user.id)
            .single()

          setUserRole(userRoles)

          // Obtener tareas asignadas al usuario o creadas por él
          const { data: assignedTasks } = await supabase
            .from("tasks")
            .select(`
              id, title, description, status, due_date,
              assigned_to,
              assigned_by
            `)
            .or(`assigned_to.eq.${user.id},assigned_by.eq.${user.id}`)

          setTasks(assignedTasks || [])
        }
      } catch (error) {
        console.error("Error loading debug data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  if (loading) {
    return <div>Cargando información de depuración...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Depuración de Filtros de Tareas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium">Usuario Actual:</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">{JSON.stringify(user, null, 2)}</pre>
        </div>

        <div>
          <h3 className="font-medium">Rol del Usuario:</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">{JSON.stringify(userRole, null, 2)}</pre>
        </div>

        <div>
          <h3 className="font-medium">Tareas Filtradas ({tasks.length}):</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">{JSON.stringify(tasks, null, 2)}</pre>
        </div>

        <div className="bg-yellow-100 p-3 rounded border border-yellow-300">
          <p className="text-sm">
            <strong>Filtro aplicado:</strong>{" "}
            <code>
              assigned_to.eq.{user?.id || "undefined"},assigned_by.eq.{user?.id || "undefined"}
            </code>
          </p>
          <p className="text-sm mt-2">
            Este filtro debería mostrar solo las tareas donde el usuario actual es el asignado o el creador.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
