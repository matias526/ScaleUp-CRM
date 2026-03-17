"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthProviderFixed, useAuth } from "@/components/auth/auth-provider-fixed"

function OpportunityCreateFormContent() {
  const router = useRouter()
  const renderCountRef = useRef(0)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  // PASO 2: Agregar useAuth ARREGLADO
  const { user, userInfo, loading } = useAuth()

  // Contador de renders SIN causar re-renders
  renderCountRef.current += 1
  console.log(`🔄 Render #${renderCountRef.current} - Título: "${title}"`)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log("Formulario enviado:", { title, description })
    console.log("Usuario:", user)
    router.push("/dashboard/opportunities")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando información del usuario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Debug Info */}
      <div className="border border-blue-200 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Debug Info - useAuth ARREGLADO</h3>
        <div className="space-y-1 text-sm text-blue-700">
          <p>
            <strong>Renders:</strong> {renderCountRef.current}
          </p>
          <p>
            <strong>Usuario:</strong> {user?.email || "No cargado"}
          </p>
          <p>
            <strong>UserInfo:</strong> {userInfo?.roleCode || "No cargado"}
          </p>
          <p>
            <strong>Loading:</strong> {loading ? "Sí" : "No"}
          </p>
          <p>
            <strong>Título actual:</strong> "{title}"
          </p>
          {renderCountRef.current > 10 && <p className="text-red-600 font-medium">⚠️ MUCHOS RENDERS!</p>}
        </div>
      </div>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Crear Oportunidad - useAuth Arreglado</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título *</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título de la oportunidad" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción de la oportunidad"
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard/opportunities")}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function OpportunityCreateFormStepByStep() {
  return (
    <AuthProviderFixed>
      <OpportunityCreateFormContent />
    </AuthProviderFixed>
  )
}
