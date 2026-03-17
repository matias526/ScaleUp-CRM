"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase/client"

export function RoleDebugger() {
  const { userInfo, refreshUser } = useAuth()
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [userRoleDetails, setUserRoleDetails] = useState<any>(null)

  // Cargar todos los roles disponibles
  useEffect(() => {
    async function loadRoles() {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("roles").select("*").order("code")

        if (error) {
          console.error("Error al cargar roles:", error)
          return
        }

        setRoles(data || [])
      } catch (error) {
        console.error("Error inesperado al cargar roles:", error)
      } finally {
        setLoading(false)
      }
    }

    loadRoles()
  }, [])

  // Cargar detalles del rol del usuario
  useEffect(() => {
    async function loadUserRoleDetails() {
      if (!userInfo?.id) return

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("users")
          .select(`
            id,
            email,
            first_name,
            last_name,
            role_id,
            roles:role_id (id, code, name, description)
          `)
          .eq("id", userInfo.id)
          .single()

        if (error) {
          console.error("Error al cargar detalles del rol del usuario:", error)
          return
        }

        setUserRoleDetails(data)
      } catch (error) {
        console.error("Error inesperado al cargar detalles del rol:", error)
      } finally {
        setLoading(false)
      }
    }

    if (userInfo) {
      loadUserRoleDetails()
    }
  }, [userInfo])

  return (
    <Card className="mb-4 bg-blue-50 border-blue-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-blue-800">Depuración de Roles</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-blue-700 space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Información del Usuario:</h3>
          <p>
            <strong>ID:</strong> {userInfo?.id || "No disponible"}
          </p>
          <p>
            <strong>Email:</strong> {userInfo?.email || "No disponible"}
          </p>
          <p>
            <strong>Nombre:</strong> {userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : "No disponible"}
          </p>
          <p>
            <strong>Rol (userInfo):</strong> {userInfo?.roleCode || "No disponible"}
          </p>
          <p>
            <strong>isAdmin:</strong> {userInfo?.isAdmin ? "true" : "false"}
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-1">Detalles del Rol (consulta directa):</h3>
          {userRoleDetails ? (
            <>
              <p>
                <strong>ID del Rol:</strong> {userRoleDetails.role_id || "No disponible"}
              </p>
              <p>
                <strong>Código del Rol:</strong> {userRoleDetails.roles?.code || "No disponible"}
              </p>
              <p>
                <strong>Nombre del Rol:</strong> {userRoleDetails.roles?.name || "No disponible"}
              </p>
              <p>
                <strong>Descripción:</strong> {userRoleDetails.roles?.description || "No disponible"}
              </p>
            </>
          ) : (
            <p>Cargando detalles del rol...</p>
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-1">Todos los Roles Disponibles:</h3>
          {roles.length > 0 ? (
            <ul className="list-disc pl-5">
              {roles.map((role) => (
                <li key={role.id}>
                  {role.code} - {role.name}
                </li>
              ))}
            </ul>
          ) : (
            <p>Cargando roles...</p>
          )}
        </div>

        <Button size="sm" variant="outline" onClick={() => refreshUser()} disabled={loading} className="mt-2">
          Refrescar Información de Usuario
        </Button>
      </CardContent>
    </Card>
  )
}
