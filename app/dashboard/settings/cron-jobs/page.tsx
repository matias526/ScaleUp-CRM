"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Clock, Calendar, CheckCircle, AlertCircle, Play, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CronJobsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const { toast } = useToast()

  const testCronJob = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      // Ejecutar manualmente usando POST
      const response = await fetch("/api/cron/daily-emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer manual-test",
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setTestResult(data)

      if (data.success) {
        toast({
          title: "Prueba exitosa",
          description: `Se enviaron ${data.summary?.successful || 0} emails correctamente`,
        })
      } else {
        throw new Error(data.error || "Error en la prueba del cron job")
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al probar el cron job",
        variant: "destructive",
      })
      setTestResult({ success: false, error: error instanceof Error ? error.message : "Error desconocido" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Clock className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Tareas Programadas (Cron Jobs)</h1>
      </div>

      <Tabs defaultValue="daily-emails">
        <TabsList>
          <TabsTrigger value="daily-emails">Emails Diarios</TabsTrigger>
          <TabsTrigger value="status">Estado del Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="daily-emails" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Emails Diarios Automáticos</span>
              </CardTitle>
              <CardDescription>
                Sistema automático de envío de emails diarios configurado con Vercel Cron Jobs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-md bg-green-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="font-medium text-green-800">Estado: Configurado</p>
                  </div>
                  <p className="text-sm text-green-700">
                    El cron job está configurado en <code>vercel.json</code> y se ejecutará automáticamente
                  </p>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="font-medium">Horario de Ejecución</p>
                  <p className="text-sm text-muted-foreground">5:00 AM UTC (2:00 AM Argentina)</p>
                  <p className="text-xs text-muted-foreground mt-1">Todos los días</p>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="font-medium">Destinatarios</p>
                  <p className="text-sm text-muted-foreground">Usuarios con roles Admin y BDD</p>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="font-medium">Contenido</p>
                  <p className="text-sm text-muted-foreground">Tareas próximas, nuevas y oportunidades</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="font-medium text-blue-800 mb-2">📋 Configuración Automática</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    El cron job ya está configurado automáticamente en el archivo <code>vercel.json</code>. No necesitas
                    hacer nada más.
                  </p>
                  <div className="bg-white p-3 rounded border text-xs font-mono">
                    <div className="text-gray-600">// vercel.json</div>
                    <div>{`{`}</div>
                    <div className="ml-2">{`"crons": [`}</div>
                    <div className="ml-4">{`{`}</div>
                    <div className="ml-6">{`"path": "/api/cron/daily-emails",`}</div>
                    <div className="ml-6">{`"schedule": "0 5 * * *"`}</div>
                    <div className="ml-4">{`}`}</div>
                    <div className="ml-2">{`]`}</div>
                    <div>{`}`}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Probar Manualmente</h3>
                  <p className="text-sm text-muted-foreground">
                    Puedes ejecutar el cron job manualmente para verificar que funciona correctamente.
                  </p>
                  <Button onClick={testCronJob} disabled={isLoading} className="flex items-center space-x-2">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    <span>Ejecutar Ahora</span>
                  </Button>
                </div>

                {testResult && (
                  <div
                    className={`p-4 rounded-md ${testResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      {testResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <h4 className="font-medium">
                        {testResult.success ? "✅ Ejecución Exitosa" : "❌ Error en la Ejecución"}
                      </h4>
                    </div>

                    {testResult.success && testResult.summary && (
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="font-medium">Total</p>
                            <p className="text-2xl font-bold text-blue-600">{testResult.summary.total}</p>
                          </div>
                          <div>
                            <p className="font-medium">Exitosos</p>
                            <p className="text-2xl font-bold text-green-600">{testResult.summary.successful}</p>
                          </div>
                          <div>
                            <p className="font-medium">Fallidos</p>
                            <p className="text-2xl font-bold text-red-600">{testResult.summary.failed}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Ejecutado: {new Date(testResult.timestamp).toLocaleString()}
                        </p>
                        {testResult.manual && <p className="text-xs text-blue-600">🧪 Ejecución manual</p>}
                      </div>
                    )}

                    {!testResult.success && testResult.error && (
                      <p className="mt-2 text-sm text-red-600">{testResult.error}</p>
                    )}

                    {testResult.results && testResult.results.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium">Ver detalles por usuario</summary>
                        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                          {testResult.results.map((result: any, index: number) => (
                            <div
                              key={index}
                              className={`text-xs p-2 rounded ${result.success ? "bg-green-100" : "bg-red-100"}`}
                            >
                              <span className={result.success ? "text-green-800" : "text-red-800"}>
                                {result.success ? "✅" : "❌"} {result.email}
                              </span>
                              {result.message && <span className="ml-2 text-gray-600">- {result.message}</span>}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Estado del Sistema</span>
              </CardTitle>
              <CardDescription>Información sobre el estado de las tareas programadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-md">
                    <p className="font-medium">Próxima Ejecución</p>
                    <p className="text-sm text-muted-foreground">Mañana a las 2:00 AM (Argentina)</p>
                  </div>
                  <div className="p-4 border rounded-md">
                    <p className="font-medium">Última Ejecución</p>
                    <p className="text-sm text-muted-foreground">Ver logs en Vercel Dashboard</p>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-md">
                  <h4 className="font-medium text-yellow-800 mb-2">📊 Monitoreo</h4>
                  <p className="text-sm text-yellow-700">
                    Para ver los logs de ejecución del cron job, ve al Dashboard de Vercel → Functions → Cron Jobs. Allí
                    podrás ver el historial de ejecuciones y cualquier error que pueda ocurrir.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
