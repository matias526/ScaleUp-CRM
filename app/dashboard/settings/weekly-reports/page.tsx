"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Send, Users, Building2, Database, Sparkles, Plus, Trash2, UserPlus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface TechCompany {
  id: string
  name: string
  logo_url?: string
}

interface WeeklyReportRecipient {
  id: string
  tech_company_id: string
  user_id: string
  is_active: boolean
  preferred_language: string
  users: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
}

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
}

const LANGUAGES = [
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
]

export default function WeeklyReportsPage() {
  const [techCompanies, setTechCompanies] = useState<TechCompany[]>([])
  const [recipients, setRecipients] = useState<WeeklyReportRecipient[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingTest, setSendingTest] = useState<string | null>(null)
  const [sendingAll, setSendingAll] = useState(false)
  const [fetchingStages, setFetchingStages] = useState(false)
  const [stagesInfo, setStagesInfo] = useState<string>("")
  const [addingRecipient, setAddingRecipient] = useState(false)
  const [selectedTechCompanyForAdd, setSelectedTechCompanyForAdd] = useState<string>("")
  const [selectedUserForAdd, setSelectedUserForAdd] = useState<string>("")
  const [selectedLanguageForAdd, setSelectedLanguageForAdd] = useState<string>("es")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()

      // Cargar tech companies
      const { data: techCompaniesData, error: techCompaniesError } = await supabase
        .from("tech_companies")
        .select("id, name, logo_url")
        .order("name")

      if (techCompaniesError) throw techCompaniesError

      // Cargar destinatarios CON idioma preferido
      const { data: recipientsData, error: recipientsError } = await supabase
        .from("weekly_report_recipients")
        .select(`
          id,
          tech_company_id,
          user_id,
          is_active,
          preferred_language,
          users (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .order("created_at", { ascending: false })

      if (recipientsError) throw recipientsError

      // Cargar todos los usuarios para el selector
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name")
        .order("first_name")

      if (usersError) throw usersError

      setTechCompanies(techCompaniesData || [])
      setRecipients(recipientsData || [])
      setAllUsers(usersData || [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPipelineStages = async () => {
    setFetchingStages(true)
    try {
      const supabase = createClient()
      const { data: stages, error } = await supabase
        .from("pipeline_stages")
        .select("id, code, display_order, probability")
        .order("display_order")

      if (error) throw error

      const stagesText =
        stages?.map((stage, index) => `${index + 1}. "${stage.code}" (orden: ${stage.display_order})`).join("\n") ||
        "No se encontraron etapas"

      setStagesInfo(stagesText)

      toast({
        title: "✅ Etapas obtenidas",
        description: `Se encontraron ${stages?.length || 0} etapas del pipeline`,
      })
    } catch (error) {
      console.error("Error fetching pipeline stages:", error)
      toast({
        title: "Error",
        description: "No se pudieron obtener las etapas del pipeline",
        variant: "destructive",
      })
    } finally {
      setFetchingStages(false)
    }
  }

  const addRecipient = async () => {
    if (!selectedTechCompanyForAdd || !selectedUserForAdd) {
      toast({
        title: "Error",
        description: "Selecciona una tech company y un usuario",
        variant: "destructive",
      })
      return
    }

    setAddingRecipient(true)
    try {
      const supabase = createClient()

      // Verificar si ya existe
      const { data: existing } = await supabase
        .from("weekly_report_recipients")
        .select("id")
        .eq("tech_company_id", selectedTechCompanyForAdd)
        .eq("user_id", selectedUserForAdd)
        .single()

      if (existing) {
        toast({
          title: "Error",
          description: "Este usuario ya está configurado para esta tech company",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("weekly_report_recipients").insert({
        tech_company_id: selectedTechCompanyForAdd,
        user_id: selectedUserForAdd,
        is_active: true,
        preferred_language: selectedLanguageForAdd,
      })

      if (error) throw error

      toast({
        title: "✅ Destinatario agregado",
        description: "El destinatario se agregó correctamente",
      })

      // Recargar datos
      await loadData()

      // Limpiar formulario
      setSelectedTechCompanyForAdd("")
      setSelectedUserForAdd("")
      setSelectedLanguageForAdd("es")
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error adding recipient:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el destinatario",
        variant: "destructive",
      })
    } finally {
      setAddingRecipient(false)
    }
  }

  const removeRecipient = async (recipientId: string) => {
    try {
      const supabase = createClient()

      const { error } = await supabase.from("weekly_report_recipients").delete().eq("id", recipientId)

      if (error) throw error

      toast({
        title: "✅ Destinatario eliminado",
        description: "El destinatario se eliminó correctamente",
      })

      // Recargar datos
      await loadData()
    } catch (error) {
      console.error("Error removing recipient:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el destinatario",
        variant: "destructive",
      })
    }
  }

  const toggleRecipientStatus = async (recipientId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("weekly_report_recipients")
        .update({ is_active: !currentStatus })
        .eq("id", recipientId)

      if (error) throw error

      toast({
        title: "✅ Estado actualizado",
        description: `Destinatario ${!currentStatus ? "activado" : "desactivado"}`,
      })

      // Actualizar estado local
      setRecipients((prev) =>
        prev.map((recipient) =>
          recipient.id === recipientId ? { ...recipient, is_active: !currentStatus } : recipient,
        ),
      )
    } catch (error) {
      console.error("Error toggling recipient status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      })
    }
  }

  const sendTestReport = async (techCompanyId: string, techCompanyName: string) => {
    setSendingTest(techCompanyId)
    try {
      const response = await fetch("/api/weekly-reports/send-test-v8", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tech_company_id: techCompanyId }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Reporte enviado",
          description: `Reporte V8 Ultra Compacto enviado para ${techCompanyName}. ${data.results?.length || 0} emails enviados. Oportunidades activas: ${data.summary?.totalActiveOpportunities || 0}`,
        })
      } else {
        throw new Error(data.error || "Error desconocido")
      }
    } catch (error) {
      console.error("Error sending test report:", error)
      toast({
        title: "Error",
        description: `Error al enviar reporte de prueba: ${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setSendingTest(null)
    }
  }

  const sendAllReports = async () => {
    setSendingAll(true)
    try {
      const response = await fetch("/api/weekly-reports/send-all-v8", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "✅ Reportes enviados",
          description: `Reportes V8 Ultra Compacto enviados a todas las tech companies. Total: ${data.totalSent || 0} emails`,
        })
      } else {
        throw new Error(data.error || "Error desconocido")
      }
    } catch (error) {
      console.error("Error sending all reports:", error)
      toast({
        title: "Error",
        description: `Error al enviar reportes: ${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setSendingAll(false)
    }
  }

  const getRecipientsForTechCompany = (techCompanyId: string) => {
    return recipients.filter((r) => r.tech_company_id === techCompanyId)
  }

  const getAvailableUsersForTechCompany = (techCompanyId: string) => {
    const existingUserIds = recipients.filter((r) => r.tech_company_id === techCompanyId).map((r) => r.user_id)

    return allUsers.filter((user) => !existingUserIds.includes(user.id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* TEXTO PARA CONFIRMAR DEPLOY - MEJORAS IMPLEMENTADAS */}
      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-300 rounded-lg p-4 mb-6">
        <p className="text-blue-800 font-bold text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5" />🎨 DISEÑO COMPACTO FINAL - Versión: 2025-01-03 20:15
        </p>
        <div className="text-blue-700 mt-2 space-y-1">
          <p>
            <strong>✅ 1. Gestión de destinatarios:</strong> Agregar/eliminar usuarios para reportes
          </p>
          <p>
            <strong>✅ 2. Header espaciado:</strong> Logos separados del título central
          </p>
          <p>
            <strong>✅ 3. Campos técnicos:</strong> Se muestran debajo del nombre de oportunidad
          </p>
          <p>
            <strong>✅ 4. Montos más grandes:</strong> Font aumentada en el resumen
          </p>
          <p>
            <strong>✅ 5. "Perdidas" en lugar de "Inactivas"</strong>
          </p>
        </div>
      </div>

      {/* Debug: Mostrar etapas del pipeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Debug: Etapas del Pipeline
          </CardTitle>
          <CardDescription>Verificar los códigos reales de las etapas del pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Button onClick={fetchPipelineStages} disabled={fetchingStages} variant="outline">
              {fetchingStages ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Obteniendo...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Obtener Etapas
                </>
              )}
            </Button>
          </div>
          {stagesInfo && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Etapas encontradas:</h4>
              <pre className="text-sm whitespace-pre-wrap">{stagesInfo}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reportes Semanales</h1>
          <p className="text-muted-foreground">Configuración y envío de reportes semanales por tech company</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="mr-2 h-4 w-4" />
                Agregar Destinatario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Destinatario</DialogTitle>
                <DialogDescription>
                  Selecciona una tech company, un usuario y un idioma preferido para recibir reportes semanales
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tech-company-select">Tech Company</Label>
                  <Select value={selectedTechCompanyForAdd} onValueChange={setSelectedTechCompanyForAdd}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una tech company" />
                    </SelectTrigger>
                    <SelectContent>
                      {techCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="user-select">Usuario</Label>
                  <Select
                    value={selectedUserForAdd}
                    onValueChange={setSelectedUserForAdd}
                    disabled={!selectedTechCompanyForAdd}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedTechCompanyForAdd &&
                        getAvailableUsersForTechCompany(selectedTechCompanyForAdd).map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name} {user.last_name} ({user.email})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language-select">Idioma Preferido</Label>
                  <Select
                    value={selectedLanguageForAdd}
                    onValueChange={setSelectedLanguageForAdd}
                    disabled={!selectedTechCompanyForAdd || !selectedUserForAdd}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((language) => (
                        <SelectItem key={language.code} value={language.code}>
                          {language.flag} {language.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={addRecipient}
                  disabled={addingRecipient || !selectedTechCompanyForAdd || !selectedUserForAdd}
                >
                  {addingRecipient ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            onClick={sendAllReports}
            disabled={sendingAll || techCompanies.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {sendingAll ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Todos V8 Ultra Compacto 🎯
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {techCompanies.map((techCompany) => {
          const techCompanyRecipients = getRecipientsForTechCompany(techCompany.id)
          const activeRecipients = techCompanyRecipients.filter((r) => r.is_active)

          return (
            <Card key={techCompany.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {techCompany.logo_url && (
                      <img
                        src={techCompany.logo_url || "/placeholder.svg"}
                        alt={`${techCompany.name} logo`}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {techCompany.name}
                      </CardTitle>
                      <CardDescription>Configuración de reportes semanales</CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={() => sendTestReport(techCompany.id, techCompany.name)}
                    disabled={sendingTest === techCompany.id || activeRecipients.length === 0}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {sendingTest === techCompany.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Enviar Prueba V8 Ultra Compacto 🎯
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Destinatarios:</span>
                    <Badge variant="secondary">{activeRecipients.length} activos</Badge>
                    <Badge variant="outline">{techCompanyRecipients.length - activeRecipients.length} inactivos</Badge>
                  </div>

                  {techCompanyRecipients.length > 0 ? (
                    <div className="grid gap-2">
                      {techCompanyRecipients.map((recipient) => (
                        <div
                          key={recipient.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${recipient.is_active ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200 opacity-60"}`}
                        >
                          <div>
                            <p className="font-medium">
                              {recipient.users.first_name} {recipient.users.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{recipient.users.email}</p>
                            <p className="text-sm text-muted-foreground">Idioma: {recipient.preferred_language}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={recipient.is_active ? "default" : "secondary"}>
                              {recipient.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleRecipientStatus(recipient.id, recipient.is_active)}
                            >
                              {recipient.is_active ? "Desactivar" : "Activar"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeRecipient(recipient.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No hay destinatarios configurados para esta tech company</p>
                      <p className="text-sm">Usa el botón "Agregar Destinatario" para configurar usuarios</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {techCompanies.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No hay tech companies</h3>
            <p className="text-muted-foreground">No se encontraron tech companies en el sistema</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
