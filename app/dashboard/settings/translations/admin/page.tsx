"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, Save, Search, X } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { TranslationService } from "@/lib/services/translation-service"

// Tipo para las traducciones
interface Translation {
  id: string
  key: string
  language: string
  value: string
}

// Tipo para las traducciones agrupadas por clave
interface GroupedTranslation {
  key: string
  translations: {
    [language: string]: {
      id: string
      value: string
    }
  }
}

export default function TranslationsAdminPage() {
  const [translations, setTranslations] = useState<Translation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [moduleFilter, setModuleFilter] = useState<string>("all")
  const [editingTranslation, setEditingTranslation] = useState<{
    key: string
    language: string
    value: string
    id: string
  } | null>(null)
  const [newTranslation, setNewTranslation] = useState({
    key: "",
    es: "",
    en: "",
    pt: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  // Cargar todas las traducciones
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error } = await supabase.from("translations").select("*").order("key").order("language")

        if (error) {
          throw new Error(`Error al cargar traducciones: ${error.message}`)
        }

        setTranslations(data || [])
      } catch (err: any) {
        setError(err.message || "Error al cargar traducciones")
      } finally {
        setIsLoading(false)
      }
    }

    loadTranslations()
  }, [])

  // Extraer los módulos (prefijos de las claves)
  const modules = useMemo(() => {
    const moduleSet = new Set<string>()

    translations.forEach((translation) => {
      const parts = translation.key.split(".")
      if (parts.length > 1) {
        moduleSet.add(parts[0])
      }
    })

    return Array.from(moduleSet).sort()
  }, [translations])

  // Agrupar traducciones por clave
  const groupedTranslations = useMemo(() => {
    const grouped: { [key: string]: GroupedTranslation } = {}

    translations.forEach((translation) => {
      if (!grouped[translation.key]) {
        grouped[translation.key] = {
          key: translation.key,
          translations: {},
        }
      }

      grouped[translation.key].translations[translation.language] = {
        id: translation.id,
        value: translation.value,
      }
    })

    return Object.values(grouped)
  }, [translations])

  // Filtrar traducciones
  const filteredTranslations = useMemo(() => {
    return groupedTranslations.filter((item) => {
      // Filtrar por módulo
      if (moduleFilter !== "all" && !item.key.startsWith(`${moduleFilter}.`)) {
        return false
      }

      // Filtrar por término de búsqueda
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()

        // Buscar en la clave
        if (item.key.toLowerCase().includes(searchLower)) {
          return true
        }

        // Buscar en los valores
        for (const lang in item.translations) {
          if (item.translations[lang].value.toLowerCase().includes(searchLower)) {
            return true
          }
        }

        return false
      }

      return true
    })
  }, [groupedTranslations, moduleFilter, searchTerm])

  // Guardar una traducción editada
  const saveTranslation = async () => {
    if (!editingTranslation) return

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from("translations")
        .update({ value: editingTranslation.value })
        .eq("id", editingTranslation.id)

      if (error) {
        throw new Error(`Error al guardar traducción: ${error.message}`)
      }

      // Actualizar el estado local
      setTranslations((prev) =>
        prev.map((t) => (t.id === editingTranslation.id ? { ...t, value: editingTranslation.value } : t)),
      )

      setSuccess(`Traducción "${editingTranslation.key}" (${editingTranslation.language}) actualizada correctamente`)
      setEditingTranslation(null)

      // Recargar las traducciones en el servicio
      await TranslationService.loadTranslations()
    } catch (err: any) {
      setError(err.message || "Error al guardar traducción")
    } finally {
      setIsSaving(false)
    }
  }

  // Añadir una nueva traducción
  const addNewTranslation = async () => {
    if (!newTranslation.key || (!newTranslation.es && !newTranslation.en && !newTranslation.pt)) {
      setError("Debes proporcionar al menos una clave y un valor para algún idioma")
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const newEntries = []

      if (newTranslation.es) {
        newEntries.push({
          key: newTranslation.key,
          language: "es",
          value: newTranslation.es,
        })
      }

      if (newTranslation.en) {
        newEntries.push({
          key: newTranslation.key,
          language: "en",
          value: newTranslation.en,
        })
      }

      if (newTranslation.pt) {
        newEntries.push({
          key: newTranslation.key,
          language: "pt",
          value: newTranslation.pt,
        })
      }

      const { data, error } = await supabase
        .from("translations")
        .upsert(newEntries, { onConflict: "key,language" })
        .select()

      if (error) {
        throw new Error(`Error al añadir traducción: ${error.message}`)
      }

      // Actualizar el estado local
      setTranslations((prev) => [...prev, ...(data || [])])

      setSuccess(`Traducción "${newTranslation.key}" añadida correctamente`)
      setNewTranslation({
        key: "",
        es: "",
        en: "",
        pt: "",
      })

      // Recargar las traducciones en el servicio
      await TranslationService.loadTranslations()
    } catch (err: any) {
      setError(err.message || "Error al añadir traducción")
    } finally {
      setIsSaving(false)
    }
  }

  // Recargar todas las traducciones
  const reloadTranslations = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.from("translations").select("*").order("key").order("language")

      if (error) {
        throw new Error(`Error al recargar traducciones: ${error.message}`)
      }

      setTranslations(data || [])
      await TranslationService.loadTranslations()
      setSuccess("Traducciones recargadas correctamente")
    } catch (err: any) {
      setError(err.message || "Error al recargar traducciones")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Administración de Traducciones</h1>
        <Button onClick={reloadTranslations} disabled={isLoading}>
          <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Recargar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Listado de Traducciones</TabsTrigger>
          <TabsTrigger value="add">Añadir Traducción</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Filtra las traducciones por módulo o término de búsqueda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="module">Módulo</Label>
                  <Select value={moduleFilter} onValueChange={setModuleFilter}>
                    <SelectTrigger id="module">
                      <SelectValue placeholder="Selecciona un módulo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los módulos</SelectItem>
                      {modules.map((module) => (
                        <SelectItem key={module} value={module}>
                          {module}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      type="search"
                      placeholder="Buscar en claves y valores..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Traducciones</CardTitle>
              <CardDescription>{filteredTranslations.length} traducciones encontradas</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredTranslations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron traducciones con los filtros actuales
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Clave</TableHead>
                        <TableHead>Español (es)</TableHead>
                        <TableHead>English (en)</TableHead>
                        <TableHead>Português (pt)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTranslations.map((item) => (
                        <TableRow key={item.key}>
                          <TableCell className="font-medium">{item.key}</TableCell>

                          {/* Español */}
                          <TableCell>
                            {editingTranslation &&
                            editingTranslation.key === item.key &&
                            editingTranslation.language === "es" ? (
                              <div className="flex items-center gap-2">
                                <Textarea
                                  value={editingTranslation.value}
                                  onChange={(e) =>
                                    setEditingTranslation({
                                      ...editingTranslation,
                                      value: e.target.value,
                                    })
                                  }
                                  className="min-h-[80px]"
                                />
                                <div className="flex flex-col gap-2">
                                  <Button size="icon" variant="ghost" onClick={saveTranslation} disabled={isSaving}>
                                    {isSaving ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Save className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={() => setEditingTranslation(null)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-muted p-2 rounded-md"
                                onClick={() =>
                                  item.translations.es &&
                                  setEditingTranslation({
                                    key: item.key,
                                    language: "es",
                                    value: item.translations.es.value,
                                    id: item.translations.es.id,
                                  })
                                }
                              >
                                {item.translations.es ? (
                                  item.translations.es.value
                                ) : (
                                  <span className="text-muted-foreground italic">No traducido</span>
                                )}
                              </div>
                            )}
                          </TableCell>

                          {/* Inglés */}
                          <TableCell>
                            {editingTranslation &&
                            editingTranslation.key === item.key &&
                            editingTranslation.language === "en" ? (
                              <div className="flex items-center gap-2">
                                <Textarea
                                  value={editingTranslation.value}
                                  onChange={(e) =>
                                    setEditingTranslation({
                                      ...editingTranslation,
                                      value: e.target.value,
                                    })
                                  }
                                  className="min-h-[80px]"
                                />
                                <div className="flex flex-col gap-2">
                                  <Button size="icon" variant="ghost" onClick={saveTranslation} disabled={isSaving}>
                                    {isSaving ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Save className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={() => setEditingTranslation(null)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-muted p-2 rounded-md"
                                onClick={() =>
                                  item.translations.en &&
                                  setEditingTranslation({
                                    key: item.key,
                                    language: "en",
                                    value: item.translations.en.value,
                                    id: item.translations.en.id,
                                  })
                                }
                              >
                                {item.translations.en ? (
                                  item.translations.en.value
                                ) : (
                                  <span className="text-muted-foreground italic">No traducido</span>
                                )}
                              </div>
                            )}
                          </TableCell>

                          {/* Portugués */}
                          <TableCell>
                            {editingTranslation &&
                            editingTranslation.key === item.key &&
                            editingTranslation.language === "pt" ? (
                              <div className="flex items-center gap-2">
                                <Textarea
                                  value={editingTranslation.value}
                                  onChange={(e) =>
                                    setEditingTranslation({
                                      ...editingTranslation,
                                      value: e.target.value,
                                    })
                                  }
                                  className="min-h-[80px]"
                                />
                                <div className="flex flex-col gap-2">
                                  <Button size="icon" variant="ghost" onClick={saveTranslation} disabled={isSaving}>
                                    {isSaving ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Save className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={() => setEditingTranslation(null)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-muted p-2 rounded-md"
                                onClick={() =>
                                  item.translations.pt &&
                                  setEditingTranslation({
                                    key: item.key,
                                    language: "pt",
                                    value: item.translations.pt.value,
                                    id: item.translations.pt.id,
                                  })
                                }
                              >
                                {item.translations.pt ? (
                                  item.translations.pt.value
                                ) : (
                                  <span className="text-muted-foreground italic">No traducido</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Añadir Nueva Traducción</CardTitle>
              <CardDescription>
                Añade una nueva clave de traducción con sus valores en diferentes idiomas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="key">Clave de Traducción</Label>
                  <Input
                    id="key"
                    placeholder="Ej: tech_companies.new_button"
                    value={newTranslation.key}
                    onChange={(e) => setNewTranslation({ ...newTranslation, key: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Usa el formato "modulo.submodulo.elemento" para mantener la organización
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="es">Español (es)</Label>
                    <Textarea
                      id="es"
                      placeholder="Traducción en español"
                      value={newTranslation.es}
                      onChange={(e) => setNewTranslation({ ...newTranslation, es: e.target.value })}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="en">English (en)</Label>
                    <Textarea
                      id="en"
                      placeholder="English translation"
                      value={newTranslation.en}
                      onChange={(e) => setNewTranslation({ ...newTranslation, en: e.target.value })}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pt">Português (pt)</Label>
                    <Textarea
                      id="pt"
                      placeholder="Tradução em português"
                      value={newTranslation.pt}
                      onChange={(e) => setNewTranslation({ ...newTranslation, pt: e.target.value })}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={addNewTranslation} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir Traducción
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
