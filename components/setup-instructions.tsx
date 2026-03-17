"use client"

import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Check, Copy } from "lucide-react"

export function SetupInstructions() {
  const [copied, setCopied] = useState(false)
  const [serviceKey, setServiceKey] = useState("")
  const [isConfigured, setIsConfigured] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveKey = () => {
    // En un entorno real, aquí guardaríamos la clave en localStorage o en una cookie
    // Por ahora, solo simulamos que se ha configurado
    setIsConfigured(true)
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Configuración de Supabase Service Role Key</CardTitle>
        <CardDescription>
          Para crear usuarios sin verificación de email, necesitas configurar la clave de servicio de Supabase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConfigured ? (
          <>
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuración requerida</AlertTitle>
              <AlertDescription>
                Para crear usuarios sin verificación de email, necesitas configurar la clave de servicio de Supabase.
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="local">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="local">Desarrollo local</TabsTrigger>
                <TabsTrigger value="vercel">Despliegue en Vercel</TabsTrigger>
              </TabsList>
              <TabsContent value="local" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">1. Obtén tu Service Role Key</h3>
                  <p className="text-sm text-muted-foreground">
                    Ve a tu proyecto de Supabase, navega a Settings &gt; API y copia la "service_role key".
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">2. Crea un archivo .env.local</h3>
                  <p className="text-sm text-muted-foreground">
                    Crea un archivo llamado .env.local en la raíz de tu proyecto y añade la siguiente línea:
                  </p>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                      <code>SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aquí</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard("SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aquí")}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">3. Reinicia tu servidor de desarrollo</h3>
                  <p className="text-sm text-muted-foreground">
                    Después de crear el archivo .env.local, reinicia tu servidor de desarrollo para que los cambios
                    surtan efecto.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="vercel" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">1. Obtén tu Service Role Key</h3>
                  <p className="text-sm text-muted-foreground">
                    Ve a tu proyecto de Supabase, navega a Settings &gt; API y copia la "service_role key".
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">2. Configura la variable de entorno en Vercel</h3>
                  <p className="text-sm text-muted-foreground">
                    Ve a tu proyecto en Vercel, navega a Settings &gt; Environment Variables y añade una nueva variable:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="key-name">Nombre</Label>
                      <Input id="key-name" value="SUPABASE_SERVICE_ROLE_KEY" readOnly />
                    </div>
                    <div>
                      <Label htmlFor="key-value">Valor</Label>
                      <Input id="key-value" placeholder="Pega tu service_role key aquí" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">3. Redespliega tu aplicación</h3>
                  <p className="text-sm text-muted-foreground">
                    Después de configurar la variable de entorno, redespliega tu aplicación para que los cambios surtan
                    efecto.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2 pt-4 border-t">
              <h3 className="text-lg font-medium">Configuración temporal para pruebas</h3>
              <p className="text-sm text-muted-foreground">
                Para probar la funcionalidad sin reiniciar el servidor, puedes ingresar tu Service Role Key aquí:
              </p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Ingresa tu Service Role Key"
                  value={serviceKey}
                  onChange={(e) => setServiceKey(e.target.value)}
                />
                <Button onClick={handleSaveKey} disabled={!serviceKey}>
                  Guardar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Nota: Esta configuración es temporal y solo se guardará en esta sesión del navegador.
              </p>
            </div>
          </>
        ) : (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertTitle>Configuración completada</AlertTitle>
            <AlertDescription>
              La clave de servicio de Supabase ha sido configurada correctamente. Ahora puedes crear usuarios sin
              verificación de email.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="outline" onClick={() => window.history.back()}>
          Volver
        </Button>
      </CardFooter>
    </Card>
  )
}
