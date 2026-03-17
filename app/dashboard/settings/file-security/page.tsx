"use client"

import { useState, useEffect } from "react"
//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "@/components/file-upload"
import { Info, CheckCircle, AlertCircle } from "lucide-react"

export default function FileSecurityPage() {
  const [maxSizeMB, setMaxSizeMB] = useState(5)
  const [allowedTypes, setAllowedTypes] = useState("")
  const [testFileUrl, setTestFileUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [bucketInfo, setBucketInfo] = useState<any>(null)

  //const supabase = createClientComponentClient()

  // Cargar la configuración actual del bucket
  useEffect(() => {
    async function loadBucketInfo() {
      try {
        const { data: buckets, error } = await supabase.storage.listBuckets()

        if (error) {
          throw error
        }

        const opportunityFilesBucket = buckets.find((b) => b.name === "opportunity_files")
        if (opportunityFilesBucket) {
          setBucketInfo(opportunityFilesBucket)

          // Si el bucket tiene configuración de tamaño máximo, actualizamos el estado
          if (opportunityFilesBucket.file_size_limit) {
            // Convertir de bytes a MB
            setMaxSizeMB(Math.floor(opportunityFilesBucket.file_size_limit / (1024 * 1024)))
          }
        }
      } catch (err) {
        console.error("Error al cargar información del bucket:", err)
      }
    }

    loadBucketInfo()
  }, [])

  // Actualizar la configuración del bucket
  const updateBucketConfig = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Convertir MB a bytes para la API de Supabase
      const fileSizeLimit = maxSizeMB * 1024 * 1024

      // Actualizar la configuración del bucket
      const { data, error } = await supabase.storage.updateBucket("opportunity_files", {
        public: true,
        fileSizeLimit,
      })

      if (error) {
        throw error
      }

      setResult({
        success: true,
        message: "Configuración de seguridad actualizada correctamente.",
      })

      // Actualizar la información del bucket
      setBucketInfo({
        ...bucketInfo,
        file_size_limit: fileSizeLimit,
      })
    } catch (err) {
      console.error("Error al actualizar configuración:", err)
      setResult({
        success: false,
        message: `Error al actualizar configuración: ${err.message || "Error desconocido"}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Configuración de Seguridad de Archivos</h1>

      <Tabs defaultValue="config">
        <TabsList className="mb-4">
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="test">Probar Carga</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Restricciones de Archivos</CardTitle>
              <CardDescription>
                Configura las restricciones de seguridad para los archivos que se suben al sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bucketInfo ? (
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Información del Bucket</AlertTitle>
                  <AlertDescription>
                    <p>Nombre: {bucketInfo.name}</p>
                    <p>Público: {bucketInfo.public ? "Sí" : "No"}</p>
                    <p>
                      Tamaño máximo:{" "}
                      {bucketInfo.file_size_limit
                        ? `${Math.floor(bucketInfo.file_size_limit / (1024 * 1024))}MB`
                        : "Sin límite"}
                    </p>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Bucket no encontrado</AlertTitle>
                  <AlertDescription>
                    No se encontró el bucket "opportunity_files". Debes crearlo primero.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="maxSize">Tamaño máximo de archivo (MB)</Label>
                <Input
                  id="maxSize"
                  type="number"
                  value={maxSizeMB}
                  onChange={(e) => setMaxSizeMB(Number.parseInt(e.target.value) || 5)}
                  min={1}
                  max={100}
                />
                <p className="text-xs text-gray-500">Recomendado: 5-10MB. Máximo permitido por Supabase: 50MB.</p>
              </div>

              {result && (
                <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
                  {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={updateBucketConfig} disabled={loading || !bucketInfo}>
                {loading ? "Actualizando..." : "Guardar Configuración"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Probar Carga de Archivos</CardTitle>
              <CardDescription>Prueba la carga de archivos con las restricciones configuradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>
                  Utiliza este formulario para probar la carga de archivos y verificar que las restricciones de
                  seguridad funcionan correctamente.
                </p>

                <div className="p-4 border rounded-md">
                  <Label className="mb-2 block">Archivo de prueba</Label>
                  <FileUpload value={testFileUrl} onChange={setTestFileUrl} maxSizeMB={maxSizeMB} />
                </div>

                {testFileUrl && (
                  <Alert className="mt-4">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Archivo cargado correctamente</AlertTitle>
                    <AlertDescription>
                      <p className="break-all">{testFileUrl}</p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
