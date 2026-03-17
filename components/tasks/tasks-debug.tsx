"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TasksDebug() {
  const { userInfo } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [tasksCount, setTasksCount] = useState({ all: 0, filtered: 0 })
  const [rawQuery, setRawQuery] = useState("")
  const [actualTasks, setActualTasks] = useState<any[]>([])

  useEffect(() => {
    if (userInfo?.id && isLoading) {
      const fetchDebugInfo = async () => {
        //const supabase = createClientComponentClient()

        try {
          // Obtener información del usuario actual
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*, roles(*)")
            .eq("id", userInfo.id)
            .single()

          if (userError) throw userError

          // Contar todas las tareas
          const { count: allTasksCount, error: countError } = await supabase
            .from("tasks")
            .select("*", { count: "exact", head: true })
            .is("parent_task_id", null)

          if (countError) throw countError

          // Construir la consulta para tareas de BDD
          const bddQuery = `assigned_by.eq.${userInfo.id},assigned_to.eq.${userInfo.id}`

          // Contar tareas filtradas para BDD
          const { count: filteredTasksCount, error: filteredCountError } = await supabase
            .from("tasks")
            .select("*", { count: "exact", head: true })
            .or(bddQuery)
            .is("parent_task_id", null)

          if (filteredCountError) throw filteredCountError

          // Obtener algunas tareas para verificar
          const { data: sampleTasks, error: tasksError } = await supabase
            .from("tasks")
            .select("id, title, assigned_by, assigned_to")
            .limit(5)

          if (tasksError) throw tasksError

          // Actualizar todos los estados de una vez para evitar múltiples renderizados
          setQuery(bddQuery)
          setTasksCount({
            all: allTasksCount || 0,
            filtered: filteredTasksCount || 0,
          })
          setDebugInfo({
            user: userData,
            role: userData?.roles,
            roleCode: userData?.roles?.code,
            userId: userInfo.id,
            sampleTasks,
          })
        } catch (error) {
          console.error("Error fetching debug info:", error)
          setDebugInfo({ error: String(error) })
        } finally {
          setIsLoading(false)
        }
      }

      fetchDebugInfo()
    }
  }, [userInfo, isLoading])

  const testBDDQuery = async () => {
    //const supabase = createClientComponentClient()
    try {
      // Probar la consulta manualmente
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, assigned_by, assigned_to")
        .or(query)
        .is("parent_task_id", null)
        .limit(10)

      if (error) throw error

      setDebugInfo((prev) => ({
        ...prev,
        testQueryResults: data,
      }))
    } catch (error) {
      console.error("Error testing query:", error)
      setDebugInfo((prev) => ({
        ...prev,
        testQueryError: String(error),
      }))
    }
  }

  // Función para obtener la consulta SQL real
  const getActualQuery = async () => {
    //const supabase = createClientComponentClient()
    try {
      // Crear una consulta similar a la que se usa en task-service-client.ts
      const queryBuilder = supabase
        .from("tasks")
        .select(`
          *,
          assigned_to_user:assigned_to(id, first_name, last_name, email),
          assigned_by_user:assigned_by(id, first_name, last_name, email),
          tech_company:tech_company_id(id, name),
          partner:partner_id(id, name),
          task_type:task_type_id(id, name, code)
        `)
        .or(query)
        .is("parent_task_id", null)
        .order("due_date", { ascending: true, nullsLast: true })
        .limit(10)

      // Obtener la consulta SQL real (esto es una aproximación)
      const sqlQuery = `
SELECT 
  tasks.*,
  assigned_to_user.id, assigned_to_user.first_name, assigned_to_user.last_name, assigned_to_user.email,
  assigned_by_user.id, assigned_by_user.first_name, assigned_by_user.last_name, assigned_by_user.email,
  tech_company.id, tech_company.name,
  partner.id, partner.name,
  task_type.id, task_type.name, task_type.code
FROM 
  tasks
LEFT JOIN 
  users AS assigned_to_user ON tasks.assigned_to = assigned_to_user.id
LEFT JOIN 
  users AS assigned_by_user ON tasks.assigned_by = assigned_by_user.id
LEFT JOIN 
  tech_companies AS tech_company ON tasks.tech_company_id = tech_company.id
LEFT JOIN 
  partners AS partner ON tasks.partner_id = partner.id
LEFT JOIN 
  task_types AS task_type ON tasks.task_type_id = task_type.id
WHERE 
  (tasks.assigned_by = '${userInfo?.id}' OR tasks.assigned_to = '${userInfo?.id}')
  AND tasks.parent_task_id IS NULL
ORDER BY 
  COALESCE(tasks.due_date, 'infinity') ASC
LIMIT 10;
      `

      // Ejecutar la consulta real
      const { data, error } = await queryBuilder

      if (error) throw error

      setRawQuery(sqlQuery)
      setActualTasks(data || [])
    } catch (error) {
      console.error("Error getting actual query:", error)
      setRawQuery(`Error: ${String(error)}`)
    }
  }

  if (isLoading) {
    return <div className="p-4">Cargando información de depuración...</div>
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Depuración de Tareas para BDD</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="info">
          <TabsList className="mb-4">
            <TabsTrigger value="info">Información Básica</TabsTrigger>
            <TabsTrigger value="query">Consulta SQL</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Información del Usuario:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(
                  {
                    id: debugInfo.userId,
                    name: debugInfo.user?.first_name + " " + debugInfo.user?.last_name,
                    email: debugInfo.user?.email,
                    role: debugInfo.roleCode,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">Consulta para filtrar tareas de BDD:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">{query}</pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">Conteo de Tareas:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">{JSON.stringify(tasksCount, null, 2)}</pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">Muestra de Tareas:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(debugInfo.sampleTasks, null, 2)}
              </pre>
            </div>

            <Button onClick={testBDDQuery}>Probar Consulta BDD</Button>

            {debugInfo.testQueryResults && (
              <div>
                <h3 className="font-medium mb-2">Resultados de la Prueba:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(debugInfo.testQueryResults, null, 2)}
                </pre>
              </div>
            )}

            {debugInfo.testQueryError && (
              <div>
                <h3 className="font-medium mb-2 text-red-500">Error en la Prueba:</h3>
                <pre className="bg-red-50 p-3 rounded text-sm overflow-auto text-red-500">
                  {debugInfo.testQueryError}
                </pre>
              </div>
            )}
          </TabsContent>

          <TabsContent value="query" className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Consulta SQL Aproximada:</h3>
              <Button onClick={getActualQuery} className="mb-2">
                Generar Consulta SQL
              </Button>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto whitespace-pre-wrap">{rawQuery}</pre>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Resultados de la Consulta:</h3>
              <Button onClick={getActualQuery} className="mb-2">
                Ejecutar Consulta
              </Button>
              <div className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Título</th>
                      <th className="text-left p-2">Asignado Por</th>
                      <th className="text-left p-2">Asignado A</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actualTasks.map((task) => (
                      <tr key={task.id} className="border-b">
                        <td className="p-2">{task.id}</td>
                        <td className="p-2">{task.title}</td>
                        <td className="p-2">{task.assigned_by}</td>
                        <td className="p-2">{task.assigned_to}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {actualTasks.length === 0 && <p className="p-2">No se encontraron tareas.</p>}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
