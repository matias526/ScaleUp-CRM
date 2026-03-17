"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { TranslationService } from "@/lib/services/translation-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from "@/hooks/use-translations"

export function TranslationServiceInspector() {
  const [searchTerm, setSearchTerm] = useState("")
  const [stats, setStats] = useState<any>({})
  const [isLoaded, setIsLoaded] = useState(false)
  const [languages, setLanguages] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<Record<string, Record<string, string>>>({})
  const [specificKeys, setSpecificKeys] = useState<string[]>([
    "opportunities.table_view",
    "opportunities.kanban_view",
    "opportunities.title",
    "opportunities.create",
  ])
  const [specificResults, setSpecificResults] = useState<Record<string, Record<string, boolean>>>({})
  const { language } = useTranslations()

  useEffect(() => {
    checkServiceStatus()
  }, [])

  const checkServiceStatus = () => {
    const isInitialized = TranslationService.isInitialized
    setIsLoaded(isInitialized)

    if (isInitialized) {
      setLanguages(TranslationService.getAvailableLanguages())
      setStats({
        ...TranslationService.getInitStats(),
        totalKeys: TranslationService.getAllTranslationKeys().length,
      })
    } else {
      setStats(TranslationService.getInitStats())
    }
  }

  const handleReload = async () => {
    await TranslationService.forceReload()
    checkServiceStatus()
    alert("Traducciones recargadas")
  }

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults({})
      return
    }

    const results = TranslationService.getTranslationsByPattern(searchTerm)
    setSearchResults(results)
  }

  const handleCheckSpecific = () => {
    const results = TranslationService.checkSpecificTranslations(specificKeys)
    setSpecificResults(results)
  }

  const handleAddKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value) {
      setSpecificKeys([...specificKeys, e.currentTarget.value])
      e.currentTarget.value = ""
    }
  }

  const handleRemoveKey = (key: string) => {
    setSpecificKeys(specificKeys.filter((k) => k !== key))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Estado del Servicio de Traducciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <span>Inicializado:</span>
              <span className={isLoaded ? "text-green-500" : "text-red-500"}>{isLoaded ? "Sí" : "No"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Idiomas disponibles:</span>
              <span>{languages.join(", ")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total de claves:</span>
              <span>{stats.totalKeys || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total de traducciones:</span>
              <span>{stats.count || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Intentos de inicialización:</span>
              <span>{stats.attempts || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Última inicialización:</span>
              <span>{stats.lastTime ? new Date(stats.lastTime).toLocaleString() : "Nunca"}</span>
            </div>
            <Button onClick={handleReload}>Recargar Traducciones</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="search">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="search">Buscar Traducciones</TabsTrigger>
          <TabsTrigger value="specific">Verificar Específicas</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar traducciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={handleSearch}>Buscar</Button>
          </div>

          {Object.keys(searchResults).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados de búsqueda</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={language}>
                  <TabsList className="mb-4">
                    {Object.keys(searchResults).map((lang) => (
                      <TabsTrigger key={lang} value={lang}>
                        {lang}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {Object.keys(searchResults).map((lang) => (
                    <TabsContent key={lang} value={lang}>
                      <div className="border rounded-md">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="p-2 text-left">Clave</th>
                              <th className="p-2 text-left">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(searchResults[lang]).length > 0 ? (
                              Object.entries(searchResults[lang]).map(([key, value]) => (
                                <tr key={key} className="border-b">
                                  <td className="p-2">{key}</td>
                                  <td className="p-2">{value}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={2} className="p-2 text-center">
                                  No se encontraron resultados
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="specific" className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {specificKeys.map((key) => (
              <div key={key} className="bg-gray-100 rounded-full px-3 py-1 flex items-center gap-2">
                <span>{key}</span>
                <button onClick={() => handleRemoveKey(key)} className="text-red-500 hover:text-red-700">
                  ×
                </button>
              </div>
            ))}
            <Input
              placeholder="Añadir clave (Enter para añadir)..."
              onKeyDown={handleAddKey}
              className="flex-1 min-w-[200px]"
            />
          </div>

          <Button onClick={handleCheckSpecific}>Verificar Traducciones</Button>

          {Object.keys(specificResults).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados de verificación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left">Clave</th>
                        {Object.keys(specificResults).map((lang) => (
                          <th key={lang} className="p-2 text-center">
                            {lang}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {specificKeys.map((key) => (
                        <tr key={key} className="border-b">
                          <td className="p-2">{key}</td>
                          {Object.keys(specificResults).map((lang) => (
                            <td key={lang} className="p-2 text-center">
                              <span className={specificResults[lang][key] ? "text-green-500" : "text-red-500"}>
                                {specificResults[lang][key] ? "✓" : "✗"}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4">
                  <h3 className="font-medium mb-2">Valores actuales:</h3>
                  <div className="space-y-2">
                    {specificKeys.map((key) => (
                      <div key={key} className="border p-3 rounded-md">
                        <h4 className="font-medium">{key}</h4>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {Object.keys(specificResults).map((lang) => (
                            <div key={lang} className="flex justify-between">
                              <span className="font-medium">{lang}:</span>
                              <span>
                                {TranslationService.getTranslation(key, lang) === key ? (
                                  <span className="text-red-500">No encontrado</span>
                                ) : (
                                  <span className="text-green-500">
                                    "{TranslationService.getTranslation(key, lang)}"
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
