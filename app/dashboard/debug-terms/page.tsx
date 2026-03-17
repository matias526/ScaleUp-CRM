"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { TermsService } from "@/lib/services/terms-service"
import { TermsAndConditionsModal } from "@/components/auth/terms-and-conditions-modal"

export default function DebugTermsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [hasAccepted, setHasAccepted] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  //const supabase = createClientComponentClient()

  useEffect(() => {
    async function checkUser() {
      try {
        setIsLoading(true)
        setError(null)

        // Obtener el usuario actual
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw new Error("Error al obtener la sesión: " + sessionError.message)
        }

        if (!session?.user) {
          throw new Error("No hay usuario autenticado")
        }

        setUserId(session.user.id)

        // Verificar si el usuario ha aceptado los términos
        const termsService = new TermsService(supabase)
        const accepted = await termsService.hasAcceptedTerms(session.user.id)
        setHasAccepted(accepted)
      } catch (err: any) {
        console.error("Error:", err)
        setError(err.message || "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()
  }, [supabase])

  const handleAcceptTerms = async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      setError(null)

      const termsService = new TermsService(supabase)
      await termsService.acceptTerms(userId)

      setHasAccepted(true)
      setShowModal(false)
    } catch (err: any) {
      console.error("Error al aceptar términos:", err)
      setError(err.message || "Error al aceptar los términos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetTerms = async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      setError(null)

      // Eliminar el registro de aceptación de términos
      const { error } = await supabase.from("user_terms_acceptance").delete().eq("user_id", userId)

      if (error) {
        throw new Error("Error al eliminar la aceptación de términos: " + error.message)
      }

      setHasAccepted(false)
    } catch (err: any) {
      console.error("Error al resetear términos:", err)
      setError(err.message || "Error al resetear los términos")
    } finally {
      setIsLoading(false)
    }
  }

  const checkTermsTable = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Verificar si la tabla existe
      const { data, error } = await supabase.from("user_terms_acceptance").select("count(*)")

      if (error) {
        throw new Error("Error al verificar la tabla: " + error.message)
      }

      alert(`La tabla user_terms_acceptance existe y tiene ${data?.[0]?.count || 0} registros.`)
    } catch (err: any) {
      console.error("Error al verificar la tabla:", err)
      setError(err.message || "Error al verificar la tabla")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Depuración de Términos y Condiciones</CardTitle>
          <CardDescription>
            Esta página permite verificar y depurar la funcionalidad de términos y condiciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Cargando...</p>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>
                <strong>Error:</strong> {error}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p>
                  <strong>ID de Usuario:</strong> {userId || "No autenticado"}
                </p>
                <p>
                  <strong>Estado de Términos:</strong>{" "}
                  {hasAccepted === null ? "Desconocido" : hasAccepted ? "Aceptados" : "No aceptados"}
                </p>
              </div>

              <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
                <p className="font-medium">Información de depuración:</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>
                    Verifica que la tabla <code>user_terms_acceptance</code> exista en la base de datos.
                  </li>
                  <li>Verifica que el usuario tenga permisos para leer/escribir en esta tabla.</li>
                  <li>Revisa la consola del navegador para ver mensajes de error detallados.</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button onClick={() => setShowModal(true)} disabled={isLoading}>
            Mostrar Modal de Términos
          </Button>
          <Button onClick={handleResetTerms} disabled={isLoading || !hasAccepted} variant="destructive">
            Resetear Aceptación
          </Button>
          <Button onClick={checkTermsTable} disabled={isLoading} variant="outline">
            Verificar Tabla
          </Button>
        </CardFooter>
      </Card>

      <TermsAndConditionsModal isOpen={showModal} onOpenChange={setShowModal} onAccept={handleAcceptTerms} />
    </div>
  )
}
