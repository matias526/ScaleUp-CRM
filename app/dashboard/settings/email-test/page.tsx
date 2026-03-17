"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function EmailTestPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  const handleSendTestEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Por favor, ingresa un email",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al enviar el email de prueba")
      }

      setResult({
        success: true,
        message: "Email de prueba enviado correctamente. Por favor, verifica tu bandeja de entrada.",
      })

      toast({
        title: "Éxito",
        description: "Email de prueba enviado correctamente",
      })
    } catch (error: any) {
      console.error("Error al enviar email de prueba:", error)

      setResult({
        success: false,
        message: error.message || "Error al enviar el email de prueba",
      })

      toast({
        title: "Error",
        description: error.message || "Error al enviar el email de prueba",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Prueba de Configuración de Email</h1>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Enviar Email de Prueba</CardTitle>
          <CardDescription>
            Verifica que la configuración de SendGrid funciona correctamente enviando un email de prueba.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email de Destino
            </label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {result && (
            <div
              className={`p-3 rounded-md ${result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
            >
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <p className="text-sm font-medium">{result.success ? "Éxito" : "Error"}</p>
              </div>
              <p className="text-sm mt-1">{result.message}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSendTestEmail} disabled={isLoading || !email} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Enviar Email de Prueba
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8 max-w-md mx-auto">
        <h2 className="text-lg font-semibold mb-2">Solución de problemas</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>
            <strong>API Key no configurada:</strong> Asegúrate de que has configurado correctamente la API key de
            SendGrid en tu archivo <code>.env.local</code>.
          </li>
          <li>
            <strong>Email no verificado:</strong> El email remitente debe estar verificado en SendGrid.
          </li>
          <li>
            <strong>Límites de envío:</strong> Si estás usando una cuenta gratuita de SendGrid, hay límites en el número
            de emails que puedes enviar.
          </li>
          <li>
            <strong>Problemas de spam:</strong> Los emails pueden estar llegando a la carpeta de spam. Verifica allí.
          </li>
          <li>
            <strong>Errores en la consola:</strong> Revisa la consola del navegador y los logs del servidor para ver si
            hay errores específicos.
          </li>
        </ul>
      </div>
    </div>
  )
}
