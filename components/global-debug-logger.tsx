"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash, Download, RefreshCw, Bug } from "lucide-react"

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
    addGlobalLog: (message: string, type?: "info" | "error" | "success") => void
  }
}

// Función global para añadir logs
export function addGlobalLog(message: string, type: "info" | "error" | "success" = "info") {
  console.log(`[${type.toUpperCase()}] ${message}`)

  if (typeof window !== "undefined") {
    const timestamp = new Date().toISOString()

    // Inicializar el array si no existe
    if (!window.debugLogs) {
      window.debugLogs = []
    }

    // Añadir el log
    window.debugLogs.push({ timestamp, message, type })

    // Guardar en localStorage para persistencia
    try {
      localStorage.setItem("debugLogs", JSON.stringify(window.debugLogs))
    } catch (e) {
      console.error("Error al guardar logs en localStorage:", e)
    }

    // Disparar evento
    try {
      window.dispatchEvent(new CustomEvent("globalLogAdded"))
    } catch (e) {
      console.error("Error al disparar evento globalLogAdded:", e)
    }
  }
}

export function GlobalDebugLogger() {
  const [logs, setLogs] = useState<DebugLog[]>([])
  const [isVisible, setIsVisible] = useState(false)

  // Inicializar los logs y configurar el listener
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Exponer la función globalmente
      window.addGlobalLog = addGlobalLog

      // Intentar cargar logs desde localStorage
      try {
        const savedLogs = localStorage.getItem("debugLogs")
        if (savedLogs) {
          window.debugLogs = JSON.parse(savedLogs)
        }
      } catch (e) {
        console.error("Error al cargar logs desde localStorage:", e)
      }

      // Inicializar el array si no existe
      if (!window.debugLogs) {
        window.debugLogs = []
      }

      // Actualizar el estado con los logs existentes
      setLogs([...window.debugLogs])

      // Configurar el listener para nuevos logs
      const handleNewLog = () => {
        setLogs([...window.debugLogs])
      }

      window.addEventListener("globalLogAdded", handleNewLog)

      // Añadir un log inicial
      addGlobalLog("Depurador global inicializado", "success")

      // Limpiar el listener al desmontar
      return () => {
        window.removeEventListener("globalLogAdded", handleNewLog)
      }
    }
  }, [])

  // Función para limpiar los logs
  const clearLogs = () => {
    if (typeof window !== "undefined") {
      window.debugLogs = []
      setLogs([])
      localStorage.removeItem("debugLogs")
      addGlobalLog("Logs limpiados", "info")
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
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-red-100 hover:bg-red-200 border-red-500"
        onClick={() => setIsVisible(true)}
      >
        <Bug className="h-4 w-4 mr-2" />
        Debug ({logs.length})
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-[600px] max-h-[80vh] z-50 shadow-xl border-2 border-red-500">
      <CardHeader className="flex flex-row items-center justify-between py-2 bg-red-100">
        <CardTitle className="text-md flex items-center">
          <Bug className="h-4 w-4 mr-2" />
          Debug Logs ({logs.length})
        </CardTitle>
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
