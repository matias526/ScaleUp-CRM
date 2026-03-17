"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash, Download, RefreshCw } from "lucide-react"

// Definir el tipo para los logs
type DebugLog = {
  timestamp: string
  message: string
  type: "info" | "error" | "success"
}

// Extender Window para incluir debugLogs
declare global {
  interface Window {
    debugLogs: DebugLog[]
  }
}

export function DebugLogger() {
  const [logs, setLogs] = useState<DebugLog[]>([])
  const [isVisible, setIsVisible] = useState(true)

  // Inicializar los logs y configurar el listener
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Inicializar el array de logs si no existe
      if (!window.debugLogs) {
        window.debugLogs = []
      }

      // Actualizar el estado con los logs existentes
      setLogs([...window.debugLogs])

      // Configurar el listener para nuevos logs
      const handleNewLog = () => {
        setLogs([...window.debugLogs])
      }

      window.addEventListener("debugLogAdded", handleNewLog)

      // Limpiar el listener al desmontar
      return () => {
        window.removeEventListener("debugLogAdded", handleNewLog)
      }
    }
  }, [])

  // Función para limpiar los logs
  const clearLogs = () => {
    if (typeof window !== "undefined") {
      window.debugLogs = []
      setLogs([])
    }
  }

  // Función para descargar los logs como archivo de texto
  const downloadLogs = () => {
    if (typeof window !== "undefined" && logs.length > 0) {
      const logText = logs.map((log) => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join("\n")
      const blob = new Blob([logText], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `debug-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  // Función para refrescar los logs
  const refreshLogs = () => {
    if (typeof window !== "undefined") {
      setLogs([...window.debugLogs])
    }
  }

  // Función para obtener el color de fondo según el tipo de log
  const getLogColor = (type: "info" | "error" | "success") => {
    switch (type) {
      case "error":
        return "bg-red-50 border-l-4 border-red-500"
      case "success":
        return "bg-green-50 border-l-4 border-green-500"
      default:
        return "bg-blue-50 border-l-4 border-blue-500"
    }
  }

  // Función para formatear la marca de tiempo
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString()
    } catch (e) {
      return timestamp
    }
  }

  if (!isVisible) {
    return (
      <Button variant="outline" size="sm" className="fixed bottom-4 right-4 z-50" onClick={() => setIsVisible(true)}>
        Mostrar Logs
      </Button>
    )
  }

  return (
    <Card className="w-[600px] max-h-[80vh] shadow-xl border-2 border-red-500">
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <CardTitle className="text-md">Debug Logs</CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={refreshLogs} title="Refrescar logs">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={downloadLogs} title="Descargar logs">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={clearLogs} title="Limpiar logs">
            <Trash className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setIsVisible(false)} title="Cerrar">
            &times;
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-y-auto max-h-[calc(80vh-60px)] p-0">
        {logs.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No hay logs para mostrar</div>
        ) : (
          <div className="space-y-1 p-2">
            {logs.map((log, index) => (
              <div key={index} className={`p-2 text-sm rounded ${getLogColor(log.type)}`}>
                <span className="font-mono text-xs text-gray-500 mr-2">[{formatTimestamp(log.timestamp)}]</span>
                <span className="whitespace-pre-wrap">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
