"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Tag, UserCheck, Plus, Trash2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface KBLabel {
  id: string
  name: string
  color: string | null
  created_at: string
}

interface TechCompany {
  id: string
  name: string
}

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
}

interface Approver {
  id: string
  tech_company_id: string
  user_id: string
  tech_companies?: { id: string; name: string }
  users?: { id: string; first_name: string; last_name: string; email: string }
}

const COLORS = [
  { name: "Azul", value: "blue" },
  { name: "Verde", value: "green" },
  { name: "Rojo", value: "red" },
  { name: "Amarillo", value: "yellow" },
  { name: "Púrpura", value: "purple" },
  { name: "Rosa", value: "pink" },
  { name: "Naranja", value: "orange" },
  { name: "Gris", value: "gray" },
]

export function KnowledgeBaseSettings() {
  const { toast } = useToast()
  const [labels, setLabels] = useState<KBLabel[]>([])
  const [approvers, setApprovers] = useState<Approver[]>([])
  const [techCompanies, setTechCompanies] = useState<TechCompany[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Labels form
  const [newLabelName, setNewLabelName] = useState("")
  const [newLabelColor, setNewLabelColor] = useState("blue")

  // Approvers form
  const [selectedTechCompany, setSelectedTechCompany] = useState("")
  const [selectedUser, setSelectedUser] = useState("")

  const [debugInfo, setDebugInfo] = useState<{
    sql: string
    error: any
    timestamp: string
  } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [labelsRes, approversRes, techCompaniesRes, usersRes] = await Promise.all([
        fetch("/api/knowledge-base/labels"),
        fetch("/api/knowledge-base/approvers"),
        fetch("/api/tech-companies"),
        fetch("/api/knowledge-base/users"), // Endpoint específico nuevo
      ])

      if (labelsRes.ok) {
        const data = await labelsRes.json()
        setLabels(data)
      }

      if (approversRes.ok) {
        const data = await approversRes.json()
        setApprovers(data)
      }

      if (techCompaniesRes.ok) {
        const data = await techCompaniesRes.json()
        setTechCompanies(data)
      }

      if (usersRes.ok) {
        const response = await usersRes.json()
        const usersData = response.data || response
        console.log("[v0] Usuarios Admin/BDD cargados:", usersData.length)
        setUsers(usersData)
      }
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

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del label es requerido",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/knowledge-base/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLabelName.trim(),
          color: newLabelColor,
        }),
      })

      if (!response.ok) throw new Error("Error al crear label")

      const newLabel = await response.json()
      setLabels([...labels, newLabel])
      setNewLabelName("")
      setNewLabelColor("blue")

      toast({
        title: "Éxito",
        description: "Label creado correctamente",
      })
    } catch (error) {
      console.error("Error creating label:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el label",
        variant: "destructive",
      })
    }
  }

  const handleDeleteLabel = async (labelId: string) => {
    if (!confirm("¿Estás seguro de eliminar este label?")) return

    try {
      const response = await fetch(`/api/knowledge-base/labels/${labelId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Error al eliminar label")

      setLabels(labels.filter((l) => l.id !== labelId))

      toast({
        title: "Éxito",
        description: "Label eliminado correctamente",
      })
    } catch (error) {
      console.error("Error deleting label:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el label",
        variant: "destructive",
      })
    }
  }

  const handleAddApprover = async () => {
    if (!selectedTechCompany || !selectedUser) {
      toast({
        title: "Error",
        description: "Debes seleccionar una tecnología y un usuario",
        variant: "destructive",
      })
      return
    }

    const techCompanyName = techCompanies.find((tc) => tc.id === selectedTechCompany)?.name || "N/A"
    const userName =
      users.find((u) => u.id === selectedUser)?.first_name +
        " " +
        users.find((u) => u.id === selectedUser)?.last_name || "N/A"

    const sqlStatement = `INSERT INTO knowledge_base_tech_company_approvers (tech_company_id, user_id, created_at)
VALUES (
  '${selectedTechCompany}', -- ${techCompanyName}
  '${selectedUser}', -- ${userName}
  NOW()
)
RETURNING *;`

    try {
      console.log("[v0] SQL a ejecutar:", sqlStatement)
      console.log("[v0] Intentando agregar aprobador:", {
        tech_company_id: selectedTechCompany,
        user_id: selectedUser,
      })

      const response = await fetch("/api/knowledge-base/approvers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tech_company_id: selectedTechCompany,
          user_id: selectedUser,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Error completo del servidor:", errorData)

        setDebugInfo({
          sql: sqlStatement,
          error: errorData,
          timestamp: new Date().toLocaleString(),
        })

        alert(
          `ERROR AL AGREGAR APROBADOR:\n\n` +
            `Mensaje: ${errorData.error || errorData.message}\n` +
            `Detalles: ${errorData.details || "N/A"}\n` +
            `Hint: ${errorData.hint || "N/A"}\n` +
            `Código: ${errorData.code || "N/A"}`,
        )
        throw new Error(errorData.error || errorData.message || "Error al agregar aprobador")
      }

      const newApprover = await response.json()
      console.log("[v0] Aprobador agregado exitosamente:", newApprover)
      await loadData()
      setSelectedTechCompany("")
      setSelectedUser("")
      setDebugInfo(null)

      toast({
        title: "Éxito",
        description: "Aprobador agregado correctamente",
      })
    } catch (error: any) {
      console.error("Error adding approver:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el aprobador",
        variant: "destructive",
      })
    }
  }

  const handleDeleteApprover = async (approverId: string) => {
    if (!confirm("¿Estás seguro de eliminar este aprobador?")) return

    try {
      const response = await fetch(`/api/knowledge-base/approvers/${approverId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Error al eliminar aprobador")

      setApprovers(approvers.filter((a) => a.id !== approverId))

      toast({
        title: "Éxito",
        description: "Aprobador eliminado correctamente",
      })
    } catch (error) {
      console.error("Error deleting approver:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el aprobador",
        variant: "destructive",
      })
    }
  }

  const getColorClass = (color: string | null) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-100 text-blue-800 border-blue-300",
      green: "bg-green-100 text-green-800 border-green-300",
      red: "bg-red-100 text-red-800 border-red-300",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
      purple: "bg-purple-100 text-purple-800 border-purple-300",
      pink: "bg-pink-100 text-pink-800 border-pink-300",
      orange: "bg-orange-100 text-orange-800 border-orange-300",
      gray: "bg-gray-100 text-gray-800 border-gray-300",
    }
    return colorMap[color || "gray"] || colorMap.gray
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configuración de Base de Conocimiento</h1>
      </div>

      <Tabs defaultValue="labels" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="labels">
            <Tag className="h-4 w-4 mr-2" />
            Labels
          </TabsTrigger>
          <TabsTrigger value="approvers">
            <UserCheck className="h-4 w-4 mr-2" />
            Aprobadores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="labels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crear Nuevo Label</CardTitle>
              <CardDescription>Los labels ayudan a categorizar las preguntas frecuentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="label-name">Nombre del Label</Label>
                  <Input
                    id="label-name"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Ej: Integración, API, Seguridad"
                  />
                </div>
                <div>
                  <Label htmlFor="label-color">Color</Label>
                  <Select value={newLabelColor} onValueChange={setNewLabelColor}>
                    <SelectTrigger id="label-color">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded ${getColorClass(color.value)}`} />
                            <span>{color.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreateLabel} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Crear Label
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Labels Existentes</CardTitle>
              <CardDescription>
                {labels.length} label{labels.length !== 1 ? "s" : ""} creado
                {labels.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {labels.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay labels creados aún. Crea el primero arriba.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {labels.map((label) => (
                    <Badge
                      key={label.id}
                      variant="outline"
                      className={`${getColorClass(label.color)} flex items-center space-x-1`}
                    >
                      <span>{label.name}</span>
                      <button
                        onClick={() => handleDeleteLabel(label.id)}
                        className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agregar Aprobador</CardTitle>
              <CardDescription>Define qué usuarios pueden aprobar preguntas para cada tecnología</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tech-company">Tecnología</Label>
                  <Select value={selectedTechCompany} onValueChange={setSelectedTechCompany}>
                    <SelectTrigger id="tech-company">
                      <SelectValue placeholder="Selecciona una tecnología" />
                    </SelectTrigger>
                    <SelectContent>
                      {techCompanies.map((tc) => (
                        <SelectItem key={tc.id} value={tc.id}>
                          {tc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="user">Usuario (Admin/BDD)</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger id="user">
                      <SelectValue placeholder="Selecciona un usuario" />
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
              </div>
              <Button onClick={handleAddApprover} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Aprobador
              </Button>

              {debugInfo && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-900 mb-2">Debug Info - {debugInfo.timestamp}</h4>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-red-800 mb-1">SQL que se intentó ejecutar:</p>
                    <pre className="text-xs bg-white p-3 rounded border border-red-300 overflow-x-auto">
                      {debugInfo.sql}
                    </pre>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-red-800 mb-1">Error recibido:</p>
                    <div className="text-xs bg-white p-3 rounded border border-red-300 space-y-1">
                      <p>
                        <strong>Mensaje:</strong> {debugInfo.error.error || debugInfo.error.message || "N/A"}
                      </p>
                      <p>
                        <strong>Detalles:</strong> {debugInfo.error.details || "N/A"}
                      </p>
                      <p>
                        <strong>Hint:</strong> {debugInfo.error.hint || "N/A"}
                      </p>
                      <p>
                        <strong>Código:</strong> {debugInfo.error.code || "N/A"}
                      </p>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" onClick={() => setDebugInfo(null)} className="mt-3">
                    Cerrar Debug
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aprobadores por Tecnología</CardTitle>
              <CardDescription>
                {approvers.length} aprobador{approvers.length !== 1 ? "es" : ""} configurado
                {approvers.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvers.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No hay aprobadores configurados aún. Agrega el primero arriba.
                </p>
              ) : (
                <div className="space-y-2">
                  {techCompanies.map((tc) => {
                    const tcApprovers = approvers.filter((a) => a.tech_company_id === tc.id)
                    if (tcApprovers.length === 0) return null

                    return (
                      <div key={tc.id} className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">{tc.name}</h3>
                        <div className="space-y-1">
                          {tcApprovers.map((approver) => (
                            <div
                              key={approver.id}
                              className="flex items-center justify-between bg-muted/50 rounded px-3 py-2"
                            >
                              <span className="text-sm">
                                {approver.users?.first_name} {approver.users?.last_name} ({approver.users?.email})
                              </span>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteApprover(approver.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default KnowledgeBaseSettings
