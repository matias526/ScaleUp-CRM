"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Mail, Send, CheckCircle, XCircle, User, AlertTriangle, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ScaleUpUser {
  id: string
  email: string
  first_name: string
  last_name: string
  preferred_language?: string
  role_code?: string
}

interface DebugStep {
  step: string
  status: "pending" | "success" | "error" | "info"
  message: string
  data?: any
}

export default function DebugDailyEmailPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [users, setUsers] = useState<ScaleUpUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [debugSteps, setDebugSteps] = useState<DebugStep[]>([])
  const [emailData, setEmailData] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadScaleUpUsers()
  }, [])

  const addDebugStep = (step: string, status: DebugStep["status"], message: string, data?: any) => {
    setDebugSteps((prev) => [...prev, { step, status, message, data }])
  }

  const clearDebugSteps = () => {
    setDebugSteps([])
    setEmailData(null)
  }

  const loadScaleUpUsers = async () => {
    setIsLoadingUsers(true)
    try {
      addDebugStep("Cargando usuarios", "pending", "Obteniendo lista de usuarios de ScaleUp...")

      const response = await fetch("/api/send-daily-emails?action=getUsers")
      const data = await response.json()

      if (data.success) {
        setUsers(data.users || [])
        if (data.users && data.users.length > 0) {
          setSelectedUserId(data.users[0].id)
        }
        addDebugStep("Usuarios cargados", "success", `Se cargaron ${data.users?.length || 0} usuarios`, data.users)
      } else {
        addDebugStep("Error cargando usuarios", "error", data.error || "Error desconocido")
      }
    } catch (error) {
      addDebugStep("Error cargando usuarios", "error", error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const testEmailConfiguration = async () => {
    addDebugStep("Verificando configuración", "pending", "Verificando variables de entorno...")

    try {
      const response = await fetch("/api/test-email-config")
      const data = await response.json()

      if (data.success) {
        addDebugStep("Configuración OK", "success", "Variables de entorno configuradas correctamente", data)
      } else {
        addDebugStep("Error configuración", "error", data.message || "Error en configuración", data)
      }
    } catch (error) {
      addDebugStep("Error configuración", "error", error instanceof Error ? error.message : "Error desconocido")
    }
  }

  const getEmailData = async () => {
    if (!selectedUserId) {
      addDebugStep("Error", "error", "No hay usuario seleccionado")
      return
    }

    setIsLoading(true)
    addDebugStep("Obteniendo datos", "pending", `Obteniendo datos del email para usuario ${selectedUserId}...`)

    try {
      const response = await fetch("/api/debug-daily-email-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      })

      const data = await response.json()

      if (data.success) {
        setEmailData(data)
        addDebugStep(
          "Datos obtenidos",
          "success",
          `Datos obtenidos correctamente. ¿Enviaría email? ${data.wouldSendEmail ? "SÍ" : "NO"}`,
          {
            stats: data.stats,
            hasContent: data.hasContent,
            wouldSendEmail: data.wouldSendEmail,
          },
        )

        if (!data.wouldSendEmail) {
          addDebugStep(
            "Sin contenido",
            "info",
            "En modo normal no se enviaría email, pero en DEBUG sí se enviará para probar el template",
          )
        }
      } else {
        addDebugStep("Error obteniendo datos", "error", data.error || "Error desconocido", data)
      }
    } catch (error) {
      addDebugStep("Error obteniendo datos", "error", error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  const sendDebugEmail = async () => {
    if (!selectedUserId) {
      addDebugStep("Error", "error", "No hay usuario seleccionado")
      return
    }

    setIsLoading(true)
    const selectedUser = users.find((u) => u.id === selectedUserId)
    addDebugStep(
      "Enviando email DEBUG",
      "pending",
      `Enviando email DEBUG con datos de ${selectedUser?.first_name} ${selectedUser?.last_name} a matias@scaleup-global.com...`,
    )

    try {
      const response = await fetch("/api/send-daily-emails-debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      })

      const data = await response.json()

      if (data.success) {
        addDebugStep(
          "Email DEBUG enviado",
          "success",
          `Email DEBUG enviado exitosamente a matias@scaleup-global.com con datos de ${selectedUser?.first_name} ${selectedUser?.last_name}`,
          data,
        )
        toast({
          title: "Email DEBUG enviado",
          description: `Email enviado a matias@scaleup-global.com con datos de ${selectedUser?.first_name} ${selectedUser?.last_name}`,
        })
      } else {
        addDebugStep("Error enviando email DEBUG", "error", data.error || "Error desconocido", data)
        toast({
          title: "Error",
          description: data.error || "Error al enviar email DEBUG",
          variant: "destructive",
        })
      }
    } catch (error) {
      addDebugStep("Error enviando email DEBUG", "error", error instanceof Error ? error.message : "Error desconocido")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testBasicEmail = async () => {
    if (!selectedUserId) {
      addDebugStep("Error", "error", "No hay usuario seleccionado")
      return
    }

    const selectedUser = users.find((u) => u.id === selectedUserId)
    if (!selectedUser) {
      addDebugStep("Error", "error", "Usuario no encontrado")
      return
    }

    setIsLoading(true)
    addDebugStep("Enviando email básico", "pending", "Enviando email básico de prueba a matias@scaleup-global.com...")

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: ["matias@scaleup-global.com"],
          subject: "Prueba de Email - ScaleUp CRM",
          html: `
            <h1>Email de Prueba</h1>
            <p>Hola Matias,</p>
            <p>Este es un email de prueba desde ScaleUp CRM para verificar que el sistema de emails funciona correctamente.</p>
            <p><strong>Datos del usuario de prueba:</strong></p>
            <ul>
              <li>Nombre: ${selectedUser.first_name} ${selectedUser.last_name}</li>
              <li>Email: ${selectedUser.email}</li>
              <li>Idioma: ${selectedUser.preferred_language || "es"}</li>
              <li>Rol: ${selectedUser.role_code || "N/A"}</li>
            </ul>
            <p>Fecha: ${new Date().toLocaleString()}</p>
          `,
        }),
      })

      const data = await response.json()

      if (data.success) {
        addDebugStep(
          "Email básico enviado",
          "success",
          "Email básico enviado exitosamente a matias@scaleup-global.com",
          data,
        )
        toast({
          title: "Email básico enviado",
          description: "Email básico enviado exitosamente a matias@scaleup-global.com",
        })
      } else {
        addDebugStep("Error email básico", "error", data.message || "Error desconocido", data)
      }
    } catch (error) {
      addDebugStep("Error email básico", "error", error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  const getStepIcon = (status: DebugStep["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      case "info":
        return <Info className="h-4 w-4 text-blue-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    }
  }

  const selectedUser = users.find((u) => u.id === selectedUserId)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Mail className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Debug - Email Diario</h1>
      </div>

      {/* Alerta de modo debug */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Modo Debug Activado</AlertTitle>
        <AlertDescription>
          Todos los emails de prueba se enviarán a <strong>matias@scaleup-global.com</strong> con los datos del usuario
          seleccionado.
        </AlertDescription>
      </Alert>

      {/* Selector de usuario */}
      <Card>
        <CardHeader>
          <CardTitle>Selección de Usuario</CardTitle>
          <CardDescription>Selecciona un usuario para hacer las pruebas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedUser && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4" />
                <span className="font-medium">
                  {selectedUser.first_name || ""} {selectedUser.last_name || ""}
                </span>
                <span className="text-muted-foreground">({selectedUser.email})</span>
                <Badge variant="outline" className="text-xs">
                  {selectedUser.preferred_language?.toUpperCase() || "ES"}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {selectedUser.role_code?.toUpperCase() || "N/A"}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                📧 El email se enviará a <strong>matias@scaleup-global.com</strong> con los datos de este usuario
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controles de prueba */}
      <Card>
        <CardHeader>
          <CardTitle>Pruebas de Diagnóstico</CardTitle>
          <CardDescription>Ejecuta estas pruebas paso a paso para identificar el problema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button onClick={clearDebugSteps} variant="outline" className="flex items-center space-x-2">
              <XCircle className="h-4 w-4" />
              <span>Limpiar Log</span>
            </Button>

            <Button onClick={testEmailConfiguration} disabled={isLoading} className="flex items-center space-x-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              <span>1. Config Email</span>
            </Button>

            <Button
              onClick={getEmailData}
              disabled={isLoading || !selectedUserId}
              className="flex items-center space-x-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Info className="h-4 w-4" />}
              <span>2. Obtener Datos</span>
            </Button>

            <Button
              onClick={testBasicEmail}
              disabled={isLoading || !selectedUserId}
              className="flex items-center space-x-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span>3. Email Básico</span>
            </Button>
          </div>

          <Button
            onClick={sendDebugEmail}
            disabled={isLoading || !selectedUserId}
            className="w-full flex items-center justify-center space-x-2"
            variant="default"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            <span>🐛 Enviar Email Diario DEBUG (a matias@scaleup-global.com)</span>
          </Button>
        </CardContent>
      </Card>

      {/* Datos del email */}
      {emailData && (
        <Card>
          <CardHeader>
            <CardTitle>Datos del Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{emailData.stats?.totalUpcomingTasks || 0}</div>
                <div className="text-sm text-muted-foreground">Tareas Próximas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{emailData.stats?.overdueTasks || 0}</div>
                <div className="text-sm text-muted-foreground">Vencidas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{emailData.stats?.newTasksCount || 0}</div>
                <div className="text-sm text-muted-foreground">Tareas Nuevas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{emailData.stats?.newOpportunitiesCount || 0}</div>
                <div className="text-sm text-muted-foreground">Oportunidades</div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Modo Debug</AlertTitle>
              <AlertDescription>
                En modo debug, el email se enviará independientemente de si hay contenido o no, para poder probar el
                template completo.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Log de debug */}
      {debugSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Log de Debug</CardTitle>
            <CardDescription>Seguimiento paso a paso del proceso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {debugSteps.map((step, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded">
                  {getStepIcon(step.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{step.step}</span>
                      <Badge
                        variant={
                          step.status === "success" ? "default" : step.status === "error" ? "destructive" : "secondary"
                        }
                      >
                        {step.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{step.message}</p>
                    {step.data && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-blue-600">Ver datos</summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(step.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
