"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, AlertTriangle, Play, RefreshCw } from "lucide-react"

interface DiagnosticResult {
  name: string
  status: "success" | "error" | "warning"
  message: string
  details?: any
}

export default function DebugCronWeeklyReportsPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const runDiagnostics = async () => {
    setIsRunning(true)
    setDiagnostics([])

    try {
      const response = await fetch("/api/debug/cron-weekly-reports")
      const data = await response.json()

      if (response.ok) {
        setDiagnostics(data.diagnostics)
      } else {
        setDiagnostics([
          {
            name: "API Error",
            status: "error",
            message: data.error || "Error desconocido",
          },
        ])
      }
    } catch (error) {
      setDiagnostics([
        {
          name: "Connection Error",
          status: "error",
          message: "No se pudo conectar con la API de diagnóstico",
        },
      ])
    } finally {
      setIsRunning(false)
    }
  }

  const testCronEndpoint = async () => {
    setIsRunning(true)
    setTestResult(null)

    try {
      // Usar el token correcto para autenticación
      const response = await fetch("/api/cron/weekly-reports", {
        method: "POST",
        headers: {
          Authorization: "Bearer weekly-reports-cron-2024",
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()

      setTestResult({
        status: response.ok ? "success" : "error",
        data: data,
        statusCode: response.status,
      })
    } catch (error) {
      setTestResult({
        status: "error",
        data: { error: error.message },
        statusCode: 0,
      })
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">OK</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Advertencia</Badge>
      default:
        return <Badge variant="secondary">Desconocido</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Diagnóstico Cron Reportes Semanales</h1>
          <p className="text-gray-600 mt-2">
            Herramienta para diagnosticar problemas con el cron job de reportes semanales
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runDiagnostics} disabled={isRunning}>
            {isRunning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Ejecutar Diagnóstico
          </Button>
          <Button variant="outline" onClick={testCronEndpoint} disabled={isRunning}>
            {isRunning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Test Cron Endpoint
          </Button>
        </div>
      </div>

      {/* Resultados del Diagnóstico */}
      {diagnostics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados del Diagnóstico</CardTitle>
            <CardDescription>Estado de los componentes del sistema de reportes semanales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {diagnostics.map((diagnostic, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                  {getStatusIcon(diagnostic.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{diagnostic.name}</h3>
                      {getStatusBadge(diagnostic.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{diagnostic.message}</p>
                    {diagnostic.details && (
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(diagnostic.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado del Test del Cron */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado del Test del Cron</CardTitle>
            <CardDescription>Resultado de la ejecución manual del endpoint del cron</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Estado:</span>
                {getStatusBadge(testResult.status)}
                <span className="text-sm text-gray-500">HTTP {testResult.statusCode}</span>
              </div>
              <div>
                <h4 className="font-medium mb-2">Respuesta:</h4>
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
          <CardDescription>Configuración actual del cron job</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Endpoint del Cron:</span> /api/cron/weekly-reports
            </div>
            <div>
              <span className="font-medium">Configuración en vercel.json:</span> Todos los lunes a las 09:00 UTC
            </div>
            <div>
              <span className="font-medium">Servicio:</span> WeeklyReportServiceV8
            </div>
            <div>
              <span className="font-medium">Proveedor de Email:</span> Resend
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
