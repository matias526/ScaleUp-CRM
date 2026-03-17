"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getNotesByOpportunityId, type Note, isScaleUpMember } from "@/lib/services/notes-service"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface OpportunityNotesDebugProps {
  opportunityId: string
}

export function OpportunityNotesDebug({ opportunityId }: OpportunityNotesDebugProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isUserScaleUp, setIsUserScaleUp] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // 1. Obtener el usuario actual
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setError("No se pudo obtener el usuario actual")
          return
        }

        setCurrentUser(user)
        console.log("Usuario actual:", user)

        // 2. Verificar si el usuario es ScaleUp
        const scaleUpStatus = await isScaleUpMember(user.id)
        setIsUserScaleUp(scaleUpStatus)
        console.log("¿Es usuario ScaleUp?:", scaleUpStatus)

        // 3. Obtener todas las notas sin filtrar
        const { data: allNotes, error: notesError } = await supabase
          .from("notes")
          .select(`
            *,
            user:users(id, first_name, last_name, email, role_id, partner_id, tech_company_id)
          `)
          .eq("opportunity_id", opportunityId)
          .order("created_at", { ascending: false })

        if (notesError) {
          setError(`Error al obtener notas: ${notesError.message}`)
          return
        }

        console.log("Todas las notas (sin filtrar):", allNotes)

        // 4. Obtener las notas a través del servicio normal
        const serviceNotes = await getNotesByOpportunityId(opportunityId, user.id)
        console.log("Notas obtenidas a través del servicio:", serviceNotes)

        setNotes(allNotes || [])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(`Error inesperado: ${errorMessage}`)
        console.error("Error al cargar datos:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [opportunityId, supabase])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Depuración de Notas</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Cargando información...</div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-800 rounded-md">{error}</div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-md">
              <h3 className="font-bold mb-2">Información del Usuario:</h3>
              <p>ID: {currentUser?.id}</p>
              <p>Email: {currentUser?.email}</p>
              <p>¿Es ScaleUp?: {isUserScaleUp === null ? "Verificando..." : isUserScaleUp ? "SÍ" : "NO"}</p>
            </div>

            <div className="p-4 bg-green-50 rounded-md">
              <h3 className="font-bold mb-2">Resumen de Notas:</h3>
              <p>Total de notas: {notes.length}</p>
              <p>Notas privadas: {notes.filter((note) => note.is_private).length}</p>
              <p>Notas públicas: {notes.filter((note) => !note.is_private).length}</p>
            </div>

            <div className="p-4 bg-amber-50 rounded-md">
              <h3 className="font-bold mb-2">Detalle de Notas:</h3>
              <div className="space-y-2">
                {notes.map((note, index) => (
                  <div key={note.id} className="p-2 bg-white rounded border">
                    <p className="font-bold">
                      Nota {index + 1}: {note.is_private ? "🔒 Privada" : "🌐 Pública"}
                    </p>
                    <p className="text-sm text-gray-500">ID: {note.id}</p>
                    <p className="text-sm text-gray-500">Creada: {new Date(note.created_at).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">
                      Usuario: {note.user?.first_name} {note.user?.last_name}
                    </p>
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <pre className="whitespace-pre-wrap">{note.content}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-md">
              <h3 className="font-bold mb-2">Instrucciones para Depuración:</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Verifica si el usuario es correctamente identificado como ScaleUp</li>
                <li>Confirma que existen notas privadas en la oportunidad</li>
                <li>Compara esta información con lo que ves en la página principal</li>
                <li>Revisa el componente OpportunityDetail para ver cómo se pasa isScaleUpMember</li>
              </ol>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
