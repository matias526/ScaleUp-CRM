"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [message, setMessage] = useState<string>("")
  const [details, setDetails] = useState<string>("")

  const testConnection = async () => {
    setStatus("testing")
    setMessage("Probando conexión a Supabase...")

    try {
      // Verificar que el cliente existe
      if (!supabase) {
        throw new Error("Cliente de Supabase no inicializado")
      }

      // Intentar una consulta simple
      const start = Date.now()
      const { count, error } = await supabase.from("translations").select("*", { count: "exact", head: true }).limit(1)
      const elapsed = Date.now() - start

      if (error) {
        throw error
      }

      // Verificar la respuesta
      setStatus("success")
      setMessage(`Conexión exitosa (${elapsed}ms)`)
      setDetails(`Tabla de traducciones accesible. Tiempo de respuesta: ${elapsed}ms`)
    } catch (error) {
      setStatus("error")
      setMessage("Error de conexión")
      setDetails(error instanceof Error ? error.message : String(error))
      console.error("Error al probar conexión:", error)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Estado de Conexión a Supabase
          <Button variant="outline" size="sm" onClick={testConnection} disabled={status === "testing"}>
            <RefreshCw className={`h-4 w-4 mr-2 ${status === "testing" ? "animate-spin" : ""}`} />
            Probar Conexión
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {status === "idle" && <div className="text-muted-foreground">Esperando prueba de conexión...</div>}

        {status === "testing" && (
          <div className="flex items-center">
            <RefreshCw className="h-5 w-5 mr-2 animate-spin text-blue-500" />
            <span>{message}</span>
          </div>
        )}

        {status === "success" && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <AlertTitle className="ml-2 text-green-700">{message}</AlertTitle>
            <AlertDescription className="ml-7 text-green-600">{details}</AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert variant="destructive">
            <XCircle className="h-5 w-5" />
            <AlertTitle className="ml-2">{message}</AlertTitle>
            <AlertDescription className="ml-7">
              {details}
              <div className="mt-2">
                <strong>Posibles soluciones:</strong>
                <ul className="list-disc ml-5 mt-1">
                  <li>Verifica que las variables de entorno de Supabase estén configuradas correctamente</li>
                  <li>Asegúrate de que la tabla de traducciones exista en tu base de datos</li>
                  <li>Revisa las políticas de seguridad de Supabase</li>
                  <li>Verifica que tu aplicación tenga acceso a Internet</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
