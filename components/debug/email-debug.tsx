"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Info } from "lucide-react"

export default function EmailDebug() {
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("Test Email")
  const [html, setHtml] = useState("<h1>Test Email</h1><p>This is a test email from ScaleUp CRM.</p>")
  const [from, setFrom] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSendEmail = async () => {
    try {
      setLoading(true)
      setResult(null)
      setError(null)

      // Validar campos
      if (!to || !subject || !html) {
        setError("Por favor, completa todos los campos requeridos (destinatario, asunto y contenido)")
        return
      }

      // Procesar destinatarios
      const recipients = to
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email !== "")
      if (recipients.length === 0) {
        setError("Por favor, proporciona al menos un destinatario válido")
        return
      }

      // Enviar email
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: recipients,
          subject,
          html,
          from: from || undefined,
        }),
      })

      const data = await response.json()
      setResult(data)

      if (!response.ok) {
        setError(data.message || "Error al enviar el email")
      }
    } catch (error: any) {
      console.error("Error sending email:", error)
      setError(error.message || "Error al enviar el email")
    } finally {
      setLoading(false)
    }
  }

  const handleCheckConfig = async () => {
    try {
      setLoading(true)
      setResult(null)
      setError(null)

      // Verificar configuración
      const response = await fetch("/api/test-email-config", {
        method: "GET",
      })

      const data = await response.json()
      setResult(data)

      if (!response.ok) {
        setError(data.message || "Error al verificar la configuración")
      }
    } catch (error: any) {
      console.error("Error checking config:", error)
      setError(error.message || "Error al verificar la configuración")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Depuración de Email</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="to">Destinatarios (separados por comas)</Label>
              <Input
                id="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Asunto</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="from">Remitente (opcional)</Label>
              <Input
                id="from"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="ScaleUp CRM <no-reply@scaleup-global.com>"
              />
              <p className="text-xs text-gray-500">
                Si se deja en blanco, se utilizará el remitente predeterminado configurado en las variables de entorno.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="html">Contenido HTML</Label>
              <Textarea
                id="html"
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex space-x-4">
              <Button onClick={handleSendEmail} disabled={loading}>
                {loading ? "Enviando..." : "Enviar Email"}
              </Button>
              <Button variant="outline" onClick={handleCheckConfig} disabled={loading}>
                Verificar Configuración
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>
              {result.success ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Operación exitosa
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Error en la operación
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Resultado:</h3>
                <pre className="mt-2 rounded-md bg-slate-950 p-4 text-white overflow-auto text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>

              {result.details && (
                <div>
                  <h3 className="text-sm font-medium">Detalles:</h3>
                  <pre className="mt-2 rounded-md bg-slate-950 p-4 text-white overflow-auto text-xs">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="h-5 w-5 mr-2" />
            Información de Depuración
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Requisitos para el envío de emails:</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                <li>
                  La variable de entorno <code>SENDGRID_API_KEY</code> debe estar configurada.
                </li>
                <li>
                  La variable de entorno <code>NEXT_PUBLIC_EMAIL_FROM</code> debe estar configurada con un remitente
                  válido.
                </li>
                <li>El dominio del remitente debe estar verificado en SendGrid.</li>
                <li>La API key debe tener permisos para enviar emails.</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium">Solución de problemas comunes:</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                <li>
                  <strong>Error "Unauthorized"</strong>: La API key de SendGrid no es válida o no tiene los permisos
                  necesarios.
                </li>
                <li>
                  <strong>Error "Forbidden"</strong>: El dominio del remitente no está verificado en SendGrid.
                </li>
                <li>
                  <strong>Error "Bad Request"</strong>: Hay un problema con los datos enviados (destinatarios, asunto,
                  contenido).
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
