"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"

export function ConnectionTest() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Intentamos hacer una consulta simple para verificar la conexión
      const { data, error } = await supabase.from("roles").select("code").limit(1)

      if (error) {
        throw error
      }

      setIsConnected(true)
    } catch (err: any) {
      setIsConnected(false)
      setError(err.message || "Error al conectar con la base de datos")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>CRM ScaleUp</CardTitle>
        <CardDescription>Verificación de conexión a Supabase</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6">
        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-12 w-12 animate-spin text-primary" />
            <p>Verificando conexión...</p>
          </div>
        ) : isConnected === true ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-center font-medium">¡Conexión exitosa a la base de datos!</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <XCircle className="h-12 w-12 text-red-500" />
            <p className="text-center font-medium">Error de conexión</p>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={testConnection} disabled={isLoading} className="gap-2">
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
          Verificar conexión
        </Button>
      </CardFooter>
    </Card>
  )
}
