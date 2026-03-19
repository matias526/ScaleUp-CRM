"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Info } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function StorageAdminPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [bucketStatus, setBucketStatus] = useState<"unknown" | "exists" | "not_exists">("unknown")


  // Verificar si el bucket existe
  const checkBucket = async () => {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets()

      if (error) {
        throw error
      }

      const exists = buckets.some((b) => b.name === "opportunity_files")
      setBucketStatus(exists ? "exists" : "not_exists")

      return exists
    } catch (err) {
      console.error("Error al verificar bucket:", err)
      return false
    }
  }

  // Crear el bucket
  const createBucket = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Verificar si el bucket ya existe
      const bucketExists = await checkBucket()

      if (bucketExists) {
        setResult({
          success: true,
          message: "El bucket 'opportunity_files' ya existe. Puedes subir archivos.",
        })
        return
      }

      // Intentar crear el bucket
      const { data, error } = await supabase.storage.createBucket("opportunity_files", {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      })

      if (error) {
        throw error
      }

      // Actualizar el estado
      setBucketStatus("exists")
      setResult({
        success: true,
        message: "Bucket 'opportunity_files' creado correctamente. Ahora puedes subir archivos.",
      })
    } catch (err) {
      console.error("Error al crear bucket:", err)

      // Si el error es porque el bucket ya existe, lo consideramos un éxito
      if (err.message && err.message.includes("already exists")) {
        setBucketStatus("exists")
        setResult({
          success: true,
          message: "El bucket 'opportunity_files' ya existe. Puedes subir archivos.",
        })
      } else {
        setResult({
          success: false,
          message: `Error al crear bucket: ${err.message || "Error desconocido"}`,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Verificar el estado del bucket al cargar la página
  useState(() => {
    checkBucket()
  }, [])

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Administración de Almacenamiento</h1>

      <Tabs defaultValue="bucket">
        <TabsList className="mb-4">
          <TabsTrigger value="bucket">Crear Bucket</TabsTrigger>
          <TabsTrigger value="instructions">Instrucciones SQL</TabsTrigger>
        </TabsList>

        <TabsContent value="bucket">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Crear Bucket para Archivos de Oportunidades</CardTitle>
              <CardDescription>
                Crea el bucket necesario para almacenar archivos adjuntos a oportunidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Si estás experimentando problemas al subir archivos con el mensaje "El bucket de almacenamiento no
                existe", puedes crear el bucket necesario haciendo clic en el botón a continuación.
              </p>

              {bucketStatus === "exists" && (
                <Alert className="mb-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Bucket Existente</AlertTitle>
                  <AlertDescription>
                    El bucket 'opportunity_files' ya existe en tu proyecto de Supabase.
                  </AlertDescription>
                </Alert>
              )}

              {bucketStatus === "not_exists" && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Bucket No Encontrado</AlertTitle>
                  <AlertDescription>
                    El bucket 'opportunity_files' no existe. Debes crearlo para poder subir archivos.
                  </AlertDescription>
                </Alert>
              )}

              {result && (
                <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
                  {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={createBucket} disabled={loading || bucketStatus === "exists"}>
                {loading ? "Creando bucket..." : "Crear Bucket 'opportunity_files'"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="instructions">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Instrucciones SQL</CardTitle>
              <CardDescription>Ejecuta estos comandos SQL en la consola de Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Instrucciones</AlertTitle>
                <AlertDescription>
                  Si prefieres crear el bucket manualmente, puedes ejecutar el siguiente SQL en la consola SQL de
                  Supabase.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                <pre className="text-sm">
                  {`-- Script minimalista que solo crea el bucket
BEGIN;
  -- Crear el bucket
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('opportunity_files', 'opportunity_files', true)
  ON CONFLICT (id) DO NOTHING;
COMMIT;`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
