"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, AlertTriangle, CheckCircle, XCircle, Users, Building2, Mail } from "lucide-react"

interface DebugInfo {
  emailConfig: {
    RESEND_API_KEY: boolean
    NEXT_PUBLIC_EMAIL_FROM: string
  }
  recipients: {
    total: number
    active: number
    inactive: number
    withMissingUser: number
    withMissingTechCompany: number
  }
  techCompanies: {
    total: number
    found: number
    list: Array<{
      id: string
      name: string
      logo_url?: string
    }>
  }
  opportunities: { [key: string]: number }
  activeRecipients: Array<{
    id: string
    techCompany: string
    user: string
    language: string
    isActive: boolean
  }>
  issues: string[]
}

export default function DebugWeeklyReportConfigPage() {
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [testingCron, setTestingCron] = useState(false)
  const [cronResult, setCronResult] = useState<any>(null)

  const runDebug = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/weekly-report-config")
      const data = await response.json()

      if (data.success) {
        setDebugInfo(data.debug)
      } else {
        console.error("Debug failed:", data.error)
      }
    } catch (error) {
      console.error("Error running debug:", error)
    } finally {
      setLoading(false)
    }
  }

  const testCron = async () => {
    setTestingCron(true)
    setCronResult(null)
    try {
      const response = await fetch("/api/cron/weekly-reports", {
        method: "POST",
        headers: {
          Authorization: `Bearer weekly-reports-cron-2024`,
        },
      })
      const data = await response.json()
      setCronResult(data)
    } catch (error) {
      console.error("Error testing cron:", error)
      setCronResult({ success: false, error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setTestingCron(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Debug: Configuración de Reportes Semanales</h1>
          <p className="text-muted-foreground">Diagnóstico completo del sistema de reportes semanales</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={runDebug} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Ejecutar Debug
              </>
            )}
          </Button>
          <Button onClick={testCron} disabled={testingCron} variant="outline">
            {testingCron ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Probando Cron...
              </>
            ) : (
              "Probar Cron Job"
            )}
          </Button>
        </div>
      </div>

      {debugInfo && (
        <div className="grid gap-6">
          {/* Resumen de Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {debugInfo.issues.length === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                Estado General
              </CardTitle>
            </CardHeader>
            <CardContent>
              {debugInfo.issues.length === 0 ? (
                <div className="text-green-600 font-medium">✅ Configuración correcta, no se encontraron problemas</div>
              ) : (
                <div className="space-y-2">
                  <div className="text-red-600 font-medium">❌ Se encontraron {debugInfo.issues.length} problemas:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {debugInfo.issues.map((issue, index) => (
                      <li key={index} className="text-red-600">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuración de Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configuración de Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  {debugInfo.emailConfig.RESEND_API_KEY ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>RESEND_API_KEY: {debugInfo.emailConfig.RESEND_API_KEY ? "Configurado" : "NO CONFIGURADO"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {debugInfo.emailConfig.NEXT_PUBLIC_EMAIL_FROM ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>EMAIL_FROM: {debugInfo.emailConfig.NEXT_PUBLIC_EMAIL_FROM || "NO CONFIGURADO"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Destinatarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{debugInfo.recipients.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{debugInfo.recipients.active}</div>
                  <div className="text-sm text-muted-foreground">Activos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{debugInfo.recipients.inactive}</div>
                  <div className="text-sm text-muted-foreground">Inactivos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{debugInfo.recipients.withMissingUser}</div>
                  <div className="text-sm text-muted-foreground">Sin Usuario</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{debugInfo.recipients.withMissingTechCompany}</div>
                  <div className="text-sm text-muted-foreground">Sin Tech Company</div>
                </div>
              </div>

              {debugInfo.activeRecipients.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Recipients Activos:</h4>
                  <div className="space-y-2">
                    {debugInfo.activeRecipients.map((recipient) => (
                      <div key={recipient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{recipient.user}</div>
                          <div className="text-sm text-muted-foreground">{recipient.techCompany}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{recipient.language}</Badge>
                          <Badge variant={recipient.isActive ? "default" : "secondary"}>
                            {recipient.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tech Companies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Tech Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{debugInfo.techCompanies.total}</div>
                  <div className="text-sm text-muted-foreground">Con Recipients</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{debugInfo.techCompanies.found}</div>
                  <div className="text-sm text-muted-foreground">Encontradas</div>
                </div>
              </div>

              {debugInfo.techCompanies.list.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Tech Companies que recibirán reportes:</h4>
                  <div className="space-y-2">
                    {debugInfo.techCompanies.list.map((company) => (
                      <div key={company.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {company.logo_url && (
                            <img
                              src={company.logo_url || "/placeholder.svg"}
                              alt={company.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">{company.name}</div>
                            <div className="text-sm text-muted-foreground">ID: {company.id}</div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {debugInfo.opportunities[company.id] || 0} oportunidades
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resultado del Cron Test */}
      {cronResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {cronResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Resultado del Cron Job
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
              {JSON.stringify(cronResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {!debugInfo && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Database className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Ejecutar Diagnóstico</h3>
            <p className="text-muted-foreground mb-4">Haz clic en "Ejecutar Debug" para analizar la configuración</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
