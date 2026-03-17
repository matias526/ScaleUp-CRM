"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Mail, Globe } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  preferred_language?: string
}

interface TechCompany {
  id: string
  name: string
}

interface Recipient {
  id: string
  user_id: string
  preferred_language: string
  users: User
}

export function WeeklyReportsConfig() {
  const [users, setUsers] = useState<User[]>([])
  const [techCompanies, setTechCompanies] = useState<TechCompany[]>([])
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedTechCompanyId, setSelectedTechCompanyId] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("es")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  const languages = [
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "pt", name: "Português", flag: "🇧🇷" },
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Cargar usuarios
      const usersResponse = await fetch("/api/weekly-reports/users")
      const usersData = await usersResponse.json()
      setUsers(usersData.users || [])

      // Cargar tech companies
      const techCompaniesResponse = await fetch("/api/weekly-reports/tech-companies")
      const techCompaniesData = await techCompaniesResponse.json()
      setTechCompanies(techCompaniesData.techCompanies || [])

      // Cargar destinatarios existentes
      const recipientsResponse = await fetch("/api/weekly-reports/recipients")
      const recipientsData = await recipientsResponse.json()
      setRecipients(recipientsData.recipients || [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addRecipient = async () => {
    if (!selectedUserId || !selectedTechCompanyId) {
      toast({
        title: "Error",
        description: "Selecciona un usuario y una tech company",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/weekly-reports/recipients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: selectedUserId,
          tech_company_id: selectedTechCompanyId,
          preferred_language: selectedLanguage,
        }),
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Destinatario agregado correctamente",
        })
        setSelectedUserId("")
        setSelectedTechCompanyId("")
        setSelectedLanguage("es")
        loadData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Error al agregar destinatario",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding recipient:", error)
      toast({
        title: "Error",
        description: "Error al agregar destinatario",
        variant: "destructive",
      })
    }
  }

  const removeRecipient = async (recipientId: string) => {
    try {
      const response = await fetch(`/api/weekly-reports/recipients/${recipientId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Destinatario eliminado correctamente",
        })
        loadData()
      } else {
        toast({
          title: "Error",
          description: "Error al eliminar destinatario",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing recipient:", error)
      toast({
        title: "Error",
        description: "Error al eliminar destinatario",
        variant: "destructive",
      })
    }
  }

  const sendTestReport = async () => {
    if (!selectedTechCompanyId) {
      toast({
        title: "Error",
        description: "Selecciona una tech company para enviar el reporte de prueba",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    try {
      const response = await fetch("/api/weekly-reports/send-test-v8", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tech_company_id: selectedTechCompanyId,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: "Éxito",
          description: `Reporte de prueba enviado correctamente a ${result.results?.length || 0} destinatarios`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al enviar reporte de prueba",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending test report:", error)
      toast({
        title: "Error",
        description: "Error al enviar reporte de prueba",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const sendAllReports = async () => {
    setSending(true)
    try {
      const response = await fetch("/api/weekly-reports/send-all-v2", {
        method: "POST",
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: "Éxito",
          description: `Reportes enviados a ${result.summary?.successful || 0} tech companies`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al enviar reportes",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending all reports:", error)
      toast({
        title: "Error",
        description: "Error al enviar reportes",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const getLanguageInfo = (code: string) => {
    return languages.find((lang) => lang.code === code) || languages[0]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Agregar Destinatario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Agregar Destinatario
          </CardTitle>
          <CardDescription>Configura quién recibirá los reportes semanales y en qué idioma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="user-select">Usuario</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tech-company-select">Tech Company</Label>
              <Select value={selectedTechCompanyId} onValueChange={setSelectedTechCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tech company" />
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
              <Label htmlFor="language-select" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Idioma del Reporte
              </Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar idioma" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={addRecipient} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Destinatarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Destinatarios Configurados ({recipients.length})
          </CardTitle>
          <CardDescription>Lista de usuarios que reciben reportes semanales</CardDescription>
        </CardHeader>
        <CardContent>
          {recipients.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay destinatarios configurados</p>
          ) : (
            <div className="space-y-3">
              {recipients.map((recipient) => {
                const langInfo = getLanguageInfo(recipient.preferred_language)
                const techCompany = techCompanies.find((tc) => tc.id === recipient.tech_company_id)

                return (
                  <div
                    key={recipient.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">
                          {recipient.users.first_name} {recipient.users.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{recipient.users.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <span>{langInfo.flag}</span>
                          <span>{langInfo.name}</span>
                        </Badge>
                        {techCompany && <Badge variant="secondary">{techCompany.name}</Badge>}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeRecipient(recipient.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones</CardTitle>
          <CardDescription>Enviar reportes de prueba o programar envíos automáticos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={sendTestReport} disabled={sending || !selectedTechCompanyId} variant="outline">
              {sending ? "Enviando..." : "Enviar Reporte de Prueba"}
            </Button>
            <Button onClick={sendAllReports} disabled={sending}>
              {sending ? "Enviando..." : "Enviar Todos los Reportes"}
            </Button>
          </div>
          {!selectedTechCompanyId && (
            <p className="text-sm text-amber-600">
              💡 Selecciona una Tech Company arriba para enviar un reporte de prueba
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
