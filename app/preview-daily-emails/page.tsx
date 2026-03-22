"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mail, User, CheckCircle, AlertCircle, Database, ChevronDown, ChevronRight } from "lucide-react"

interface EmailPreview {
  user: {
    id: string
    name: string
    email: string
    role: string
    language: string
    isScaleUp: boolean
  }
  subject: string
  stats: {
    myTasks: number
    assignedTasks: number
    overdueCount: number
    myCommitments: number
    assignedCommitments: number
  }
  html: string
}

interface DebugLog {
  query: string
  params: Record<string, any>
  result: {
    success: boolean
    count: number
    error?: string
    data?: any
  }
}

interface PreviewResponse {
  totalUsers: number
  usersWithTasks: number
  previews: EmailPreview[]
  debugLogs?: DebugLog[]
  message?: string
}

export default function PreviewDailyEmailsPage() {
  const [data, setData] = useState<PreviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [showDebugLogs, setShowDebugLogs] = useState(true)
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set())

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

  const toggleLogExpand = (index: number) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedLogs(newExpanded)
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

  const selectedPreview = data?.previews.find(p => p.user.id === selectedUser)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Preview: Emails Diarios</h1>
              <p className="text-muted-foreground">
                {data?.usersWithTasks || 0} de {data?.totalUsers || 0} usuarios recibirían email
                {data?.message && <span className="text-amber-600 ml-2">({data.message})</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setShowDebugLogs(!showDebugLogs)} 
                variant={showDebugLogs ? "default" : "outline"}
                size="sm"
              >
                <Database className="h-4 w-4 mr-2" />
                Debug Logs
              </Button>
              <Button onClick={fetchPreviews} variant="outline">
                Refrescar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Debug Logs Section */}
        {showDebugLogs && data?.debugLogs && data.debugLogs.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-600" />
                Debug Logs - Queries Ejecutados ({data.debugLogs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {data.debugLogs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-lg overflow-hidden ${
                      log.result.success ? 'border-gray-200' : 'border-red-300 bg-red-50'
                    }`}
                  >
                    <button
                      onClick={() => toggleLogExpand(index)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {expandedLogs.has(index) ? (
                          <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        )}
                        <Badge 
                          variant={log.result.success ? "secondary" : "destructive"}
                          className="flex-shrink-0"
                        >
                          {log.result.success ? `${log.result.count} resultados` : 'ERROR'}
                        </Badge>
                        <code className="text-xs text-gray-700 truncate flex-1 text-left font-mono">
                          {log.query.substring(0, 100)}{log.query.length > 100 ? '...' : ''}
                        </code>
                      </div>
                    </button>
                    
                    {expandedLogs.has(index) && (
                      <div className="border-t bg-gray-50 p-4 space-y-3">
                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-1">QUERY:</div>
                          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto font-mono">
                            {log.query}
                          </pre>
                        </div>
                        
                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-1">PARAMS:</div>
                          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto font-mono">
                            {JSON.stringify(log.params, null, 2)}
                          </pre>
                        </div>
                        
                        {log.result.error && (
                          <div>
                            <div className="text-xs font-semibold text-red-500 mb-1">ERROR:</div>
                            <pre className="text-xs bg-red-100 p-3 rounded border border-red-200 overflow-x-auto text-red-700 font-mono">
                              {log.result.error}
                            </pre>
                          </div>
                        )}
                        
                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-1">
                            RESULTADO ({log.result.count} registros):
                          </div>
                          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto max-h-[300px] font-mono">
                            {JSON.stringify(log.result.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No emails case */}
        {(!data || data.previews.length === 0) && (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">Sin emails para enviar</h2>
                <p className="text-muted-foreground">
                  {data?.totalUsers === 0 
                    ? "No hay usuarios con receive_daily_email = true"
                    : "Ningún usuario tiene tareas pendientes"}
                </p>
                {data?.message && (
                  <p className="text-sm text-amber-600 mt-2">{data.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email previews */}
        {data && data.previews.length > 0 && (
          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar - User List */}
            <div className="col-span-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Usuarios ({data.previews.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y max-h-[calc(100vh-450px)] overflow-y-auto">
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
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Para:</span> {selectedPreview.user.email}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Asunto:</span> <strong>{selectedPreview.subject}</strong>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3">
                        <span>Idioma: {selectedPreview.user.language}</span>
                        {selectedPreview.stats.overdueCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {selectedPreview.stats.overdueCount} vencidas
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {selectedPreview ? (
                    <iframe
                      srcDoc={selectedPreview.html}
                      className="w-full h-[calc(100vh-480px)] border-0"
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
        )}
      </div>
    </div>
  )
}
