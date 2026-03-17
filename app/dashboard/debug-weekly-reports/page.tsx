"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugWeeklyReportsPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkEmailConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/email-config")
      const data = await response.json()
      setDebugInfo(data)
    } catch (error) {
      console.error("Error checking email config:", error)
      setDebugInfo({ error: "Error al verificar configuración" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Debug - Reportes Semanales</h1>
        <p className="text-muted-foreground">Verificar configuración de emails</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Verificar Configuración de Email</CardTitle>
            <CardDescription>Comprobar que Resend esté configurado correctamente</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={checkEmailConfig} disabled={loading}>
              {loading ? "Verificando..." : "Verificar Configuración"}
            </Button>

            {debugInfo && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <pre className="text-sm overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
