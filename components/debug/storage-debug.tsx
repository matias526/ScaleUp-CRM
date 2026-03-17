"use client"

import { useState, useEffect } from "react"
//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Info } from "lucide-react"

export function StorageDebug() {
  const [buckets, setBuckets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [testLoading, setTestLoading] = useState(false)

  //const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadBuckets() {
      try {
        setLoading(true)
        const { data, error } = await supabase.storage.listBuckets()

        if (error) {
          throw error
        }

        setBuckets(data || [])
      } catch (err) {
        console.error("Error al cargar buckets:", err)
        setError(err.message || "Error al cargar buckets")
      } finally {
        setLoading(false)
      }
    }

    loadBuckets()
  }, [])

  const testFileUpload = async () => {
    setTestLoading(true)
    setTestResult(null)

    try {
      // Crear un archivo de prueba
      const testBlob = new Blob(["Test file content"], { type: "text/plain" })
      const testFile = new File([testBlob], "test-file.txt", { type: "text/plain" })

      // Intentar subir el archivo
      const { data, error } = await supabase.storage
        .from("opportunity_files")
        .upload(`test_${Date.now()}.txt`, testFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (error) {
        throw error
      }

      setTestResult({
        success: true,
        message: "Prueba exitosa: Se pudo subir un archivo de prueba",
      })
    } catch (err) {
      console.error("Error en prueba de carga:", err)
      setTestResult({
        success: false,
        message: `Error en prueba de carga: ${err.message || "Error desconocido"}`,
      })
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Diagnóstico de Almacenamiento</CardTitle>
        <CardDescription>Verifica la configuración de almacenamiento de Supabase</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Buckets disponibles</h3>
            {loading ? (
              <p>Cargando buckets...</p>
            ) : buckets.length === 0 ? (
              <p>No se encontraron buckets</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                {buckets.map((bucket) => (
                  <li key={bucket.id}>
                    {bucket.name} {bucket.public ? "(público)" : "(privado)"}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Prueba de carga</h3>
            <Button onClick={testFileUpload} disabled={testLoading || loading} className="mb-2">
              {testLoading ? "Probando..." : "Probar carga de archivo"}
            </Button>

            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{testResult.success ? "Éxito" : "Error"}</AlertTitle>
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Información</AlertTitle>
            <AlertDescription>
              Para que la carga de archivos funcione correctamente, asegúrate de que:
              <ul className="list-disc pl-5 mt-2">
                <li>El bucket "opportunity_files" existe</li>
                <li>El bucket tiene las políticas de acceso correctas</li>
                <li>El usuario está autenticado</li>
                <li>El servicio de almacenamiento está habilitado en tu proyecto de Supabase</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  )
}
