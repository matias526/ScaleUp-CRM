"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mail, User, CheckCircle, AlertCircle } from "lucide-react"

interface EmailPreview {
  user: {
    id: string
    name: string
    email: string
    role: string
    isScaleUp: boolean
  }
  stats: {
    myTasks: number
    assignedTasks: number
    myCommitments: number
    assignedCommitments: number
  }
  html: string
}

interface PreviewResponse {
  totalUsers: number
  usersWithTasks: number
  previews: EmailPreview[]
}

export default function PreviewDailyEmailsPage() {
  const [data, setData] = useState<PreviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  useEffect(() => {
    fetchPreviews()
  }, [])

  const fetchPreviews = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/preview-daily-emails")
      if (!response.ok) {
        throw new Error("Error al cargar los previews")
      }
      const result = await response.json()
      setData(result)
      if (result.previews.length > 0) {
        setSelectedUser(result.previews[0].user.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Cargando previews de emails...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Error</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchPreviews}>Reintentar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data || data.previews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Sin emails para enviar</h2>
              <p className="text-muted-foreground">
                {data?.totalUsers === 0 
                  ? "No hay usuarios con receive_daily_email = true"
                  : "Ningún usuario tiene tareas pendientes"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedPreview = data.previews.find(p => p.user.id === selectedUser)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Preview: Emails Diarios</h1>
              <p className="text-muted-foreground">
                {data.usersWithTasks} de {data.totalUsers} usuarios recibirían email (tienen tareas pendientes)
              </p>
            </div>
            <Button onClick={fetchPreviews} variant="outline">
              Refrescar
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - User List */}
          <div className="col-span-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Usuarios ({data.previews.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-[calc(100vh-250px)] overflow-y-auto">
                  {data.previews.map((preview) => (
                    <button
                      key={preview.user.id}
                      onClick={() => setSelectedUser(preview.user.id)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        selectedUser === preview.user.id ? "bg-blue-50 border-l-4 border-blue-600" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{preview.user.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{preview.user.email}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {preview.user.role || "Sin rol"}
                            </Badge>
                            {preview.user.isScaleUp && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                ScaleUp
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{preview.stats.myTasks} mis tareas</span>
                            <span>{preview.stats.assignedTasks} asignadas</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main - Email Preview */}
          <div className="col-span-8">
            <Card>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base">Vista Previa del Email</CardTitle>
                </div>
                {selectedPreview && (
                  <div className="text-sm text-muted-foreground">
                    Para: {selectedPreview.user.email}
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {selectedPreview ? (
                  <iframe
                    srcDoc={selectedPreview.html}
                    className="w-full h-[calc(100vh-280px)] border-0"
                    title="Email Preview"
                  />
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    Selecciona un usuario para ver el preview
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
