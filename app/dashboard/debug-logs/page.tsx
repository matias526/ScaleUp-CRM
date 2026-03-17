"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DebugLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/log")
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error("Error al obtener logs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Logs de depuración</h1>
        <Button onClick={fetchLogs} disabled={loading}>
          {loading ? "Cargando..." : "Actualizar"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logs recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No hay logs disponibles</p>
          ) : (
            <div className="space-y-4">
              {logs
                .slice()
                .reverse()
                .map((log, index) => (
                  <div key={index} className="border p-4 rounded-md">
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">{log.timestamp}</span>
                      <span
                        className={`text-sm font-medium ${log.type === "error" ? "text-red-500" : "text-blue-500"}`}
                      >
                        {log.type}
                      </span>
                    </div>
                    <p className="font-medium mt-2">{log.message}</p>
                    {log.data && (
                      <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-auto max-h-40">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
