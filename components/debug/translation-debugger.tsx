"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationService } from "@/lib/services/translation-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Bug, Database, RefreshCw, Code, AlertTriangle, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export function TranslationDebugger() {
  const [isLoading, setIsLoading] = useState(false)
  const [dbLoading, setDbLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dbTranslations, setDbTranslations] = useState<any[]>([])
  const [memoryTranslations, setMemoryTranslations] = useState<Record<string, Record<string, string>>>({})
  const [dbStats, setDbStats] = useState({ total: 0, languages: [] as string[] })
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})

  // Cargar datos iniciales
  useEffect(() => {
    loadMemoryTranslations()
    loadDbTranslations()
  }, [])

  // Cargar traducciones de la memoria
  const loadMemoryTranslations = () => {
    try {
      const languages = TranslationService.getAvailableLanguages()
      const translations: Record<string, Record<string, string>> = {}

      languages.forEach((lang) => {
        translations[lang] = TranslationService.getAllTranslationsForLanguage(lang)
      })

      setMemoryTranslations(translations)
    } catch (error) {
      console.error("Error al cargar traducciones de memoria:", error)
    }
  }

  // Cargar traducciones de la base de datos
  const loadDbTranslations = async () => {
    setDbLoading(true)
    try {
      const { data, error } = await supabase.from("translations").select("*").limit(100)

      if (error) throw error

      setDbTranslations(data || [])

      // Calcular estadísticas
      if (data) {
        const languages = [...new Set(data.map((item) => item.language))]
        setDbStats({
          total: data.length,
          languages: languages as string[],
        })
      }
    } catch (error) {
      console.error("Error al cargar traducciones de la base de datos:", error)
      setError(error instanceof Error ? error.message : "Error al cargar traducciones de la base de datos")
    } finally {
      setDbLoading(false)
    }
  }

  // Forzar recarga de traducciones
  const forceReloadTranslations = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await TranslationService.forceReload()

      // Verificar si hubo algún error durante la recarga
      const lastError = TranslationService.getLastError()
      if (lastError) {
        throw lastError
      }

      loadMemoryTranslations()
      setSuccess("Traducciones recargadas correctamente")
    } catch (error) {
      console.error("Error al recargar traducciones:", error)
      setError(error instanceof Error ? error.message : "Error al recargar traducciones")
    } finally {
      setIsLoading(false)
    }
  }

  // Ejecutar pruebas de diagnóstico
  const runDiagnostics = async () => {
    setIsLoading(true)
    const results: Record<string, boolean> = {}

    // Prueba 1: Verificar si el servicio está inicializado
    results["serviceInitialized"] = TranslationService.isInitialized

    // Prueba 2: Verificar si hay traducciones en memoria
    const languages = TranslationService.getAvailableLanguages()
    results["hasTranslationsInMemory"] = languages.length > 0

    // Prueba 3: Verificar conexión a la base de datos
    try {
      const { data, error } = await supabase.from("translations").select("count()", { count: "exact" })
      results["dbConnection"] = !error
    } catch {
      results["dbConnection"] = false
    }

    // Prueba 4: Verificar si hay traducciones en español
    results["hasSpanishTranslations"] = Object.keys(TranslationService.getAllTranslationsForLanguage("es")).length > 0

    // Prueba 5: Verificar si hay traducciones en inglés
    results["hasEnglishTranslations"] = Object.keys(TranslationService.getAllTranslationsForLanguage("en")).length > 0

    setTestResults(results)
    setIsLoading(false)
  }

  // Reparar problemas comunes
  const repairCommonIssues = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // 1. Forzar recarga completa
      await TranslationService.forceReload()

      // 2. Verificar si hay errores después de la recarga
      const lastError = TranslationService.getLastError()
      if (lastError) {
        throw lastError
      }

      // 3. Actualizar datos locales
      loadMemoryTranslations()
      await loadDbTranslations()

      setSuccess("Reparación completada. Se han recargado todas las traducciones.")
    } catch (error) {
      console.error("Error durante la reparación:", error)
      setError(error instanceof Error ? error.message : "Error durante la reparación")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Depurador de Traducciones
        </CardTitle>
        <CardDescription>
          Herramienta avanzada para diagnosticar y solucionar problemas con el sistema de traducciones
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Éxito</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Estado del Servicio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Badge variant={TranslationService.isInitialized ? "success" : "destructive"}>
                  {TranslationService.isInitialized ? "Inicializado" : "No inicializado"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Traducciones en Memoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.keys(memoryTranslations).map((lang) => (
                  <div key={lang} className="flex justify-between">
                    <span>{lang}:</span>
                    <span className="font-medium">{Object.keys(memoryTranslations[lang] || {}).length} claves</span>
                  </div>
                ))}
                {Object.keys(memoryTranslations).length === 0 && (
                  <span className="text-destructive">No hay traducciones cargadas</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Base de Datos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-medium">{dbStats.total} registros</span>
                </div>
                <div className="flex justify-between">
                  <span>Idiomas:</span>
                  <span className="font-medium">{dbStats.languages.join(", ") || "Ninguno"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="diagnostics">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="diagnostics">Diagnóstico</TabsTrigger>
            <TabsTrigger value="memory">Memoria</TabsTrigger>
            <TabsTrigger value="database">Base de Datos</TabsTrigger>
            <TabsTrigger value="tests">Pruebas</TabsTrigger>
          </TabsList>

          <TabsContent value="diagnostics" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Diagnóstico Rápido</h3>
              <p className="text-sm text-muted-foreground">
                Ejecuta pruebas para identificar problemas comunes con el sistema de traducciones.
              </p>

              <div className="flex gap-2 mt-4">
                <Button onClick={runDiagnostics} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bug className="mr-2 h-4 w-4" />}
                  Ejecutar Diagnóstico
                </Button>

                <Button onClick={repairCommonIssues} variant="secondary" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Reparar Problemas Comunes
                </Button>
              </div>

              {Object.keys(testResults).length > 0 && (
                <div className="mt-4 border rounded-md p-4">
                  <h4 className="font-medium mb-2">Resultados del Diagnóstico:</h4>
                  <ul className="space-y-2">
                    {Object.entries(testResults).map(([test, result]) => (
                      <li key={test} className="flex items-center">
                        {result ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                        )}
                        <span>
                          {test === "serviceInitialized" && "Servicio inicializado"}
                          {test === "hasTranslationsInMemory" && "Traducciones en memoria"}
                          {test === "dbConnection" && "Conexión a base de datos"}
                          {test === "hasSpanishTranslations" && "Traducciones en español"}
                          {test === "hasEnglishTranslations" && "Traducciones en inglés"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="memory">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Traducciones en Memoria</h3>
                <Button variant="outline" size="sm" onClick={loadMemoryTranslations}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {Object.keys(memoryTranslations).map((lang) => (
                  <AccordionItem key={lang} value={lang}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <span>{lang}</span>
                        <Badge variant="outline">{Object.keys(memoryTranslations[lang] || {}).length} claves</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="h-[200px] rounded-md border p-4">
                        <div className="space-y-2">
                          {Object.entries(memoryTranslations[lang] || {})
                            .slice(0, 20)
                            .map(([key, value]) => (
                              <div key={key} className="grid grid-cols-2 gap-2 text-sm">
                                <div className="font-mono text-muted-foreground">{key}</div>
                                <div>{value}</div>
                              </div>
                            ))}
                          {Object.keys(memoryTranslations[lang] || {}).length > 20 && (
                            <div className="text-sm text-muted-foreground pt-2 border-t">
                              Mostrando 20 de {Object.keys(memoryTranslations[lang] || {}).length} traducciones
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                ))}
                {Object.keys(memoryTranslations).length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">No hay traducciones cargadas en memoria</div>
                )}
              </Accordion>
            </div>
          </TabsContent>

          <TabsContent value="database">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Traducciones en Base de Datos</h3>
                <Button variant="outline" size="sm" onClick={loadDbTranslations} disabled={dbLoading}>
                  {dbLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  Cargar desde DB
                </Button>
              </div>

              <div className="rounded-md border">
                <div className="grid grid-cols-3 font-medium p-2 border-b bg-muted/50">
                  <div>Clave</div>
                  <div>Idioma</div>
                  <div>Valor</div>
                </div>

                <ScrollArea className="h-[300px]">
                  {dbLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : dbTranslations.length > 0 ? (
                    dbTranslations.map((item, index) => (
                      <div
                        key={`${item.key}-${item.language}`}
                        className={`grid grid-cols-3 p-2 text-sm ${index % 2 === 0 ? "bg-muted/20" : ""}`}
                      >
                        <div className="font-mono">{item.key}</div>
                        <div>{item.language}</div>
                        <div>{item.value}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No se encontraron traducciones en la base de datos
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tests">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pruebas de Traducción</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 rounded-md border p-4">
                  <div className="font-medium">Clave</div>
                  <div className="font-medium">Español (es)</div>
                  <div className="font-medium">Inglés (en)</div>

                  {["tech_companies.title", "partners.title", "common.loading", "test.hello"].map((key) => (
                    <div key={key} className="contents">
                      <div className="text-sm text-muted-foreground">{key}</div>
                      <div>{TranslationService.getTranslation(key, "es", "—")}</div>
                      <div>{TranslationService.getTranslation(key, "en", "—")}</div>
                    </div>
                  ))}
                </div>

                <Alert>
                  <Code className="h-4 w-4" />
                  <AlertTitle>Uso del Servicio de Traducciones</AlertTitle>
                  <AlertDescription>
                    <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 overflow-x-auto">
                      <code className="text-white text-sm">
                        {`// Obtener una traducción
const texto = TranslationService.getTranslation("tech_companies.title", "es");

// Verificar si el servicio está inicializado
const inicializado = TranslationService.isInitialized;

// Forzar recarga de traducciones
await TranslationService.forceReload();`}
                      </code>
                    </pre>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refrescar Página
        </Button>
        <Button onClick={forceReloadTranslations} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Recargando...
            </>
          ) : (
            "Forzar Recarga de Traducciones"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
