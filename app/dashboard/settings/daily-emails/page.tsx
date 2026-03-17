"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Mail, Send, Users, CheckCircle, XCircle, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ScaleUpUser {
  id: string
  email: string
  first_name: string
  last_name: string
  preferred_language?: string
  role_code?: string
}

export default function DailyEmailsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [users, setUsers] = useState<ScaleUpUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const { toast } = useToast()

  // Cargar usuarios de ScaleUp al montar el componente
  useEffect(() => {
    loadScaleUpUsers()
  }, [])

  const loadScaleUpUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const response = await fetch("/api/send-daily-emails?action=getUsers")
      const data = await response.json()

      if (data.success) {
        setUsers(data.users || [])
        // Seleccionar el primer usuario por defecto
        if (data.users && data.users.length > 0) {
          setSelectedUserId(data.users[0].id)
        }
      } else {
        throw new Error(data.error || "Error al cargar usuarios")
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      })
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const sendDailyEmails = async () => {
    setIsLoading(true)
    setResults(null)

    try {
      const response = await fetch("/api/send-daily-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setResults(data)
        toast({
          title: "Emails enviados",
          description: `Se enviaron ${data.summary?.successful || 0} emails exitosamente`,
        })
      } else {
        throw new Error(data.error || "Error al enviar emails")
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al enviar emails",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testSingleEmail = async () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Por favor selecciona un usuario para la prueba",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/send-daily-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: selectedUserId }),
      })

      const data = await response.json()

      if (data.success) {
        const selectedUser = users.find((u) => u.id === selectedUserId)
        toast({
          title: "Email de prueba enviado",
          description: `Email enviado exitosamente a ${selectedUser?.email}`,
        })
      } else {
        throw new Error(data.message || "Error al enviar email de prueba")
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al enviar email de prueba",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadgeVariant = (roleCode?: string) => {
    if (!roleCode) return "outline"

    switch (roleCode.toLowerCase()) {
      case "admin":
        return "destructive"
      case "bdd":
        return "default"
      case "scaleup":
        return "secondary"
      default:
        return "outline"
    }
  }

  const formatRoleCode = (roleCode?: string) => {
    return roleCode?.toUpperCase() || "N/A"
  }

  const formatLanguage = (language?: string) => {
    return language?.toUpperCase() || "ES"
  }

  const selectedUser = users.find((u) => u.id === selectedUserId)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Mail className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Gestión de Emails Diarios</h1>
      </div>

      <div className="grid gap-6">
        {/* Controles */}
        <Card>
          <CardHeader>
            <CardTitle>Envío de Emails Diarios</CardTitle>
            <CardDescription>
              Envía emails diarios con tareas y oportunidades pendientes a todos los usuarios de ScaleUp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Envío masivo */}
            <div>
              <h4 className="font-semibold mb-3">Envío Masivo</h4>
              <Button onClick={sendDailyEmails} disabled={isLoading} className="flex items-center space-x-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                <span>Enviar a Todos los Usuarios</span>
              </Button>
            </div>

            {/* Separador */}
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-3">Envío de Prueba Individual</h4>

              {/* Selector de usuario */}
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Seleccionar Usuario:</label>
                  {isLoadingUsers ? (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Cargando usuarios...</span>
                    </div>
                  ) : (
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="w-full max-w-md">
                        <SelectValue placeholder="Selecciona un usuario" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>
                                {user.first_name || ""} {user.last_name || ""}
                              </span>
                              <span className="text-muted-foreground">({user.email})</span>
                              <Badge variant={getRoleBadgeVariant(user.role_code)} className="text-xs">
                                {formatRoleCode(user.role_code)}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Información del usuario seleccionado */}
                {selectedUser && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="h-4 w-4" />
                      <span className="font-medium">
                        {selectedUser.first_name || ""} {selectedUser.last_name || ""}
                      </span>
                      <span className="text-muted-foreground">({selectedUser.email})</span>
                      <Badge variant={getRoleBadgeVariant(selectedUser.role_code)} className="text-xs">
                        {formatRoleCode(selectedUser.role_code)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {formatLanguage(selectedUser.preferred_language)}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Botón de envío */}
                <Button
                  variant="outline"
                  onClick={testSingleEmail}
                  disabled={isLoading || !selectedUserId || isLoadingUsers}
                  className="flex items-center space-x-2"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Enviar Email de Prueba</span>
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground border-t pt-4">
              <p>
                <strong>Contenido del email:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Tareas próximas a vencer (hoy a 3 días) o vencidas</li>
                <li>Tareas nuevas asignadas en las últimas 24 horas</li>
                <li>Oportunidades nuevas asignadas en las últimas 24 horas</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados del Envío</CardTitle>
              <CardDescription>Resumen del último envío de emails diarios</CardDescription>
            </CardHeader>
            <CardContent>
              {results.summary && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{results.summary.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{results.summary.successful}</div>
                    <div className="text-sm text-muted-foreground">Exitosos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{results.summary.failed}</div>
                    <div className="text-sm text-muted-foreground">Fallidos</div>
                  </div>
                </div>
              )}

              {results.results && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <h4 className="font-semibold">Detalle por Usuario:</h4>
                  {results.results.map((result: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm">{result.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.success ? "Enviado" : "Error"}
                        </Badge>
                        {result.message && (
                          <span className="text-xs text-muted-foreground max-w-xs truncate">{result.message}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración Automática</CardTitle>
            <CardDescription>Para envío automático diario, configura un cron job o tarea programada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Endpoint para automatización:</h4>
                <code className="block mt-1 p-2 bg-muted rounded text-sm">GET /api/send-daily-emails</code>
              </div>

              <div>
                <h4 className="font-semibold">Ejemplo de cron job (diario a las 8:00 AM):</h4>
                <code className="block mt-1 p-2 bg-muted rounded text-sm">
                  0 8 * * * curl -X GET https://tu-dominio.com/api/send-daily-emails
                </code>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>
                  <strong>Nota:</strong> Los emails solo se envían si hay contenido relevante (tareas o oportunidades
                  pendientes).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
