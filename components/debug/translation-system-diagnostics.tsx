"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TranslationService } from "@/lib/services/translation-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Bug, RefreshCw, AlertTriangle, CheckCircle2, Search } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useTranslations } from "@/hooks/use-translations"

interface TranslationRow {
  id: string
  key: string
  language: string
  value: string
  created_at: string
  updated_at: string
}

export function TranslationSystemDiagnostics() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dbTranslations, setDbTranslations] = useState<TranslationRow[]>([])
  const [memoryTranslations, setMemoryTranslations] = useState<Record<string, Record<string, string>>>({})
  const [searchKey, setSearchKey] = useState("")
  const [comparisonResults, setComparisonResults] = useState<any[]>([])

  const { t, language, isLoaded, error: hookError } = useTranslations()

  // Cargar datos iniciales
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    await Promise.all([loadMemoryTranslations(), loadDbTranslations()])
  }

  // Cargar traducciones de la memoria
  const loadMemoryTranslations = () => {
    try {
      const languages = TranslationService.getAvailableLanguages()
      const translations: Record<string, Record<string, string>> = {}

      languages.forEach((lang) => {
        translations[lang] = TranslationService.getAllTranslationsForLanguage(lang)
      })

      setMemoryTranslations(translations)
      console.log("Traducciones en memoria cargadas:", translations)
    } catch (error) {
      console.error("Error al cargar traducciones de memoria:", error)
    }
  }

  // Cargar traducciones de la base de datos
  const loadDbTranslations = async () => {
    try {
      const { data, error } = await supabase.from("translations").select("*").order("key", { ascending: true })

      if (error) throw error

      setDbTranslations(data || [])
      console.log("Traducciones de BD cargadas:", data?.length || 0)
    } catch (error) {
      console.error("Error al cargar traducciones de la base de datos:", error)
      setError(error instanceof Error ? error.message : "Error al cargar traducciones de la base de datos")
    }
  }

  // Comparar traducciones entre memoria y BD
  const compareTranslations = () => {
    const results: any[] = []
    const allKeys = new Set<string>()

    // Obtener todas las claves de la BD
    dbTranslations.forEach((row) => allKeys.add(row.key))

    // Obtener todas las claves de memoria
    Object.values(memoryTranslations).forEach((langTranslations) => {
      Object.keys(langTranslations).forEach((key) => allKeys.add(key))
    })

    // Comparar cada clave
    Array.from(allKeys).forEach((key) => {
      const result: any = {
        key,
        inDb: {},
        inMemory: {},
        missing: [],
      }

      // Verificar en BD
      const dbEntries = dbTranslations.filter((row) => row.key === key)
      dbEntries.forEach((entry) => {
        result.inDb[entry.language] = entry.value
      })

      // Verificar en memoria
      Object.keys(memoryTranslations).forEach((lang) => {
        if (memoryTranslations[lang][key]) {
          result.inMemory[lang] = memoryTranslations[lang][key]
        }
      })

      // Identificar faltantes
      const dbLanguages = Object.keys(result.inDb)
      const memoryLanguages = Object.keys(result.inMemory)

      dbLanguages.forEach((lang) => {
        if (!memoryLanguages.includes(lang)) {
          result.missing.push(`${lang} (en memoria)`)
        }
      })

      results.push(result)
    })

    setComparisonResults(results)
  }

  // Forzar recarga completa
  const forceFullReload = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      console.log("Iniciando recarga completa del sistema de traducciones...")

      // 1. Forzar recarga del servicio
      await TranslationService.forceReload()

      // 2. Recargar datos locales
      await loadAllData()

      // 3. Comparar resultados
      compareTranslations()

      setSuccess("Sistema de traducciones recargado completamente")
    } catch (error) {
      console.error("Error durante la recarga completa:", error)
      setError(error instanceof Error ? error.message : "Error durante la recarga completa")
    } finally {
      setIsLoading(false)
    }
  }

  // Probar traducciones específicas
  const testSpecificTranslations = () => {
    const testKeys = [
      "dashboard.partner.title",
      "dashboard.partner.opportunities",
      "dashboard.partner.tasks",
      "opportunities.title",
      "partners.title",
      "tech_companies.title",
    ]

    console.log("=== PRUEBA DE TRADUCCIONES ESPECÍFICAS ===")
    testKeys.forEach((key) => {
      const esTranslation = TranslationService.getTranslation(key, "es", "NO_ENCONTRADA")
      const enTranslation = TranslationService.getTranslation(key, "en", "NOT_FOUND")
      const hookTranslation = t(key, "HOOK_DEFAULT")

      console.log(`Clave: ${key}`)
      console.log(`  Servicio ES: ${esTranslation}`)
      console.log(`  Servicio EN: ${enTranslation}`)
      console.log(`  Hook (${language}): ${hookTranslation}`)
      console.log(`  ¿Existe en memoria ES?: ${TranslationService.hasTranslation(key, "es")}`)
      console.log(`  ¿Existe en memoria EN?: ${TranslationService.hasTranslation(key, "en")}`)
      console.log("---")
    })
  }

  // Filtrar resultados de comparación
  const filteredResults = comparisonResults.filter(
    (result) => searchKey === "" || result.key.toLowerCase().includes(searchKey.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Diagnóstico del Sistema de Traducciones
          </CardTitle>
          <CardDescription>Herramienta completa para diagnosticar problemas con las traducciones</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {hookError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error del Hook</AlertTitle>
              <AlertDescription>{hookError}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Éxito</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Estado general */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Servicio</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={TranslationService.isInitialized ? "default" : "destructive"}>
                  {TranslationService.isInitialized ? "Inicializado" : "No inicializado"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Hook</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={isLoaded ? "default" : "destructive"}>{isLoaded ? "Cargado" : "No cargado"}</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Idioma Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">{language}</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">BD vs Memoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <div>BD: {dbTranslations.length}</div>
                  <div>
                    Memoria:{" "}
                    {Object.values(memoryTranslations).reduce((acc, lang) => acc + Object.keys(lang).length, 0)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 mb-6">
            <Button onClick={forceFullReload} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Recarga Completa
            </Button>

            <Button onClick={compareTranslations} variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Comparar BD vs Memoria
            </Button>

            <Button onClick={testSpecificTranslations} variant="outline">
              Probar Traducciones
            </Button>

            <Button onClick={() => TranslationService.debugTranslations()} variant="outline">
              Debug en Consola
            </Button>
          </div>

          <Tabs defaultValue="comparison">
            <TabsList>
              <TabsTrigger value="comparison">Comparación</TabsTrigger>
              <TabsTrigger value="memory">Memoria</TabsTrigger>
              <TabsTrigger value="database">Base de Datos</TabsTrigger>
              <TabsTrigger value="tests">Pruebas</TabsTrigger>
            </TabsList>

            <TabsContent value="comparison" className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar clave..."
                  value={searchKey}
                  onChange={(e) => setSearchKey(e.target.value)}
                  className="max-w-sm"
                />
                <Badge variant="outline">{filteredResults.length} resultados</Badge>
              </div>

              <ScrollArea className="h-[400px] border rounded-md">
                <div className="p-4 space-y-4">
                  {filteredResults.map((result, index) => (
                    <Card key={result.key} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                      <CardHeader className="py-2">
                        <CardTitle className="text-sm font-mono">{result.key}</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="font-medium mb-1">En Base de Datos:</div>
                            {Object.keys(result.inDb).length > 0 ? (
                              Object.entries(result.inDb).map(([lang, value]) => (
                                <div key={lang} className="mb-1">
                                  <Badge variant="outline" className="mr-2">
                                    {lang}
                                  </Badge>
                                  <span>{value as string}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-muted-foreground">No encontrada</span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium mb-1">En Memoria:</div>
                            {Object.keys(result.inMemory).length > 0 ? (
                              Object.entries(result.inMemory).map(([lang, value]) => (
                                <div key={lang} className="mb-1">
                                  <Badge variant="outline" className="mr-2">
                                    {lang}
                                  </Badge>
                                  <span>{value as string}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-muted-foreground">No encontrada</span>
                            )}
                          </div>
                        </div>
                        {result.missing.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs font-medium text-destructive">Faltantes:</div>
                            <div className="text-xs text-destructive">{result.missing.join(", ")}</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="memory">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Traducciones cargadas en memoria por el TranslationService
                </div>
                <ScrollArea className="h-[400px] border rounded-md p-4">
                  {Object.keys(memoryTranslations).map((lang) => (
                    <div key={lang} className="mb-4">
                      <div className="font-medium mb-2 flex items-center gap-2">
                        <Badge>{lang}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {Object.keys(memoryTranslations[lang]).length} traducciones
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        {Object.entries(memoryTranslations[lang])
                          .slice(0, 10)
                          .map(([key, value]) => (
                            <div key={key} className="grid grid-cols-2 gap-2">
                              <span className="font-mono text-muted-foreground">{key}</span>
                              <span>{value}</span>
                            </div>
                          ))}
                        {Object.keys(memoryTranslations[lang]).length > 10 && (
                          <div className="text-muted-foreground">
                            ... y {Object.keys(memoryTranslations[lang]).length - 10} más
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="database">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">Traducciones almacenadas en la base de datos</div>
                <ScrollArea className="h-[400px] border rounded-md">
                  <div className="grid grid-cols-4 font-medium p-2 border-b bg-muted/50 text-sm">
                    <div>Clave</div>
                    <div>Idioma</div>
                    <div>Valor</div>
                    <div>Actualizado</div>
                  </div>
                  {dbTranslations.slice(0, 100).map((row, index) => (
                    <div
                      key={row.id}
                      className={`grid grid-cols-4 p-2 text-xs ${index % 2 === 0 ? "bg-muted/20" : ""}`}
                    >
                      <div className="font-mono">{row.key}</div>
                      <div>
                        <Badge variant="outline">{row.language}</Badge>
                      </div>
                      <div className="truncate">{row.value}</div>
                      <div className="text-muted-foreground">{new Date(row.updated_at).toLocaleDateString()}</div>
                    </div>
                  ))}
                  {dbTranslations.length > 100 && (
                    <div className="p-2 text-center text-muted-foreground text-sm">
                      Mostrando 100 de {dbTranslations.length} traducciones
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="tests">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Pruebas de traducciones específicas (revisa la consola para más detalles)
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Prueba Rápida</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>dashboard.partner.title:</strong>
                        <div className="ml-4">
                          <div>Hook: {t("dashboard.partner.title", "DEFAULT")}</div>
                          <div>
                            Servicio ES: {TranslationService.getTranslation("dashboard.partner.title", "es", "DEFAULT")}
                          </div>
                          <div>
                            Servicio EN: {TranslationService.getTranslation("dashboard.partner.title", "en", "DEFAULT")}
                          </div>
                        </div>
                      </div>

                      <div>
                        <strong>opportunities.title:</strong>
                        <div className="ml-4">
                          <div>Hook: {t("opportunities.title", "DEFAULT")}</div>
                          <div>
                            Servicio ES: {TranslationService.getTranslation("opportunities.title", "es", "DEFAULT")}
                          </div>
                          <div>
                            Servicio EN: {TranslationService.getTranslation("opportunities.title", "en", "DEFAULT")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
