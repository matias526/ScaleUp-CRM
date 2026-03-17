"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"

export function NotesDebug({ opportunityId }: { opportunityId: string }) {
  const { userInfo } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>({
    loading: true,
    user: null,
    directNotes: [],
    filteredNotes: [],
    apiNotes: [],
    error: null,
  })

  // Función para obtener notas directamente de la base de datos sin filtros
  const fetchDirectNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select(`
          *,
          user:users(id, first_name, last_name, email, role_id, partner_id, tech_company_id)
        `)
        .eq("opportunity_id", opportunityId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching direct notes:", error)
      return []
    }
  }

  // Función para obtener notas con el filtro is_private = false
  const fetchFilteredNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select(`
          *,
          user:users(id, first_name, last_name, email, role_id, partner_id, tech_company_id)
        `)
        .eq("opportunity_id", opportunityId)
        .eq("is_private", false)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching filtered notes:", error)
      return []
    }
  }

  // Función para obtener notas a través de la API
  const fetchApiNotes = async () => {
    try {
      const response = await fetch(`/api/notes/debug?opportunity_id=${opportunityId}`)
      if (!response.ok) throw new Error(`API error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error("Error fetching API notes:", error)
      return []
    }
  }

  // Función para obtener información del usuario actual
  const fetchUserInfo = async () => {
    if (!userInfo?.id) return null

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*, roles(id, name, code)")
        .eq("id", userInfo.id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error fetching user info:", error)
      return null
    }
  }

  const runDebug = async () => {
    setDebugInfo({ ...debugInfo, loading: true })

    try {
      const [user, directNotes, filteredNotes, apiNotes] = await Promise.all([
        fetchUserInfo(),
        fetchDirectNotes(),
        fetchFilteredNotes(),
        fetchApiNotes(),
      ])

      setDebugInfo({
        loading: false,
        user,
        directNotes,
        filteredNotes,
        apiNotes,
        error: null,
      })
    } catch (error) {
      setDebugInfo({
        ...debugInfo,
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  useEffect(() => {
    runDebug()
  }, [opportunityId])

  const countPrivateNotes = (notes: any[]) => {
    return notes.filter((note) => note.is_private).length
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>Depuración de Notas</span>
          <Button size="sm" onClick={runDebug} disabled={debugInfo.loading}>
            {debugInfo.loading ? "Cargando..." : "Actualizar"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-slate-100 p-4 rounded-md">
            <h3 className="font-bold mb-2">Información del Usuario</h3>
            {debugInfo.user ? (
              <div>
                <p>
                  <strong>ID:</strong> {debugInfo.user.id}
                </p>
                <p>
                  <strong>Nombre:</strong> {debugInfo.user.first_name} {debugInfo.user.last_name}
                </p>
                <p>
                  <strong>Email:</strong> {debugInfo.user.email}
                </p>
                <p>
                  <strong>Role ID:</strong> {debugInfo.user.role_id}
                </p>
                <p>
                  <strong>Role:</strong> {debugInfo.user.roles?.name} ({debugInfo.user.roles?.code})
                </p>
                <p>
                  <strong>Partner ID:</strong> {debugInfo.user.partner_id || "null"}
                </p>
                <p>
                  <strong>Tech Company ID:</strong> {debugInfo.user.tech_company_id || "null"}
                </p>
                <p>
                  <strong>¿Es ScaleUp?</strong>{" "}
                  {!debugInfo.user.partner_id ||
                  [1, 2, 3].includes(debugInfo.user.role_id) ||
                  ["Admin", "BDD"].includes(debugInfo.user.roles?.code)
                    ? "SÍ"
                    : "NO"}
                </p>
              </div>
            ) : (
              <p>No se pudo obtener información del usuario</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-bold mb-2">Notas Directas (Sin Filtro)</h3>
              <p>
                <strong>Total:</strong> {debugInfo.directNotes.length}
              </p>
              <p>
                <strong>Privadas:</strong> {countPrivateNotes(debugInfo.directNotes)}
              </p>
              <p>
                <strong>Públicas:</strong> {debugInfo.directNotes.length - countPrivateNotes(debugInfo.directNotes)}
              </p>
              <div className="mt-2 max-h-40 overflow-y-auto text-xs">
                {debugInfo.directNotes.map((note: any) => (
                  <div
                    key={note.id}
                    className={`p-2 mb-1 rounded ${note.is_private ? "bg-amber-100" : "bg-green-100"}`}
                  >
                    <p>
                      <strong>{note.is_private ? "🔒 Privada" : "🌐 Pública"}</strong>
                    </p>
                    <p>{note.content.substring(0, 50)}...</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-md">
              <h3 className="font-bold mb-2">Notas Filtradas (is_private=false)</h3>
              <p>
                <strong>Total:</strong> {debugInfo.filteredNotes.length}
              </p>
              <p>
                <strong>Privadas:</strong> {countPrivateNotes(debugInfo.filteredNotes)}
              </p>
              <p>
                <strong>Públicas:</strong> {debugInfo.filteredNotes.length - countPrivateNotes(debugInfo.filteredNotes)}
              </p>
              <div className="mt-2 max-h-40 overflow-y-auto text-xs">
                {debugInfo.filteredNotes.map((note: any) => (
                  <div
                    key={note.id}
                    className={`p-2 mb-1 rounded ${note.is_private ? "bg-amber-100" : "bg-green-100"}`}
                  >
                    <p>
                      <strong>{note.is_private ? "🔒 Privada" : "🌐 Pública"}</strong>
                    </p>
                    <p>{note.content.substring(0, 50)}...</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-md">
              <h3 className="font-bold mb-2">Notas API (Lógica Actual)</h3>
              <p>
                <strong>Total:</strong> {debugInfo.apiNotes.length}
              </p>
              <p>
                <strong>Privadas:</strong> {countPrivateNotes(debugInfo.apiNotes)}
              </p>
              <p>
                <strong>Públicas:</strong> {debugInfo.apiNotes.length - countPrivateNotes(debugInfo.apiNotes)}
              </p>
              <div className="mt-2 max-h-40 overflow-y-auto text-xs">
                {debugInfo.apiNotes.map((note: any) => (
                  <div
                    key={note.id}
                    className={`p-2 mb-1 rounded ${note.is_private ? "bg-amber-100" : "bg-green-100"}`}
                  >
                    <p>
                      <strong>{note.is_private ? "🔒 Privada" : "🌐 Pública"}</strong>
                    </p>
                    <p>{note.content.substring(0, 50)}...</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {debugInfo.error && (
            <div className="bg-red-100 p-4 rounded-md">
              <h3 className="font-bold mb-2">Error</h3>
              <p>{debugInfo.error}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
