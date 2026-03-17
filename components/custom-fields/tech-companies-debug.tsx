"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getTechCompanies } from "@/lib/services/tech-company-service"
import { TechCompanyService } from "@/lib/services/tech-company-service"

export function TechCompaniesDebug() {
  const [companies, setCompanies] = useState<any[]>([])
  const [companiesBasic, setCompaniesBasic] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queryLog, setQueryLog] = useState<string[]>([])

  const addLog = (message: string) => {
    setQueryLog((prev) => [...prev, `[${new Date().toISOString()}] ${message}`])
  }

  const fetchCompanies = async () => {
    setLoading(true)
    setError(null)
    addLog("Iniciando fetchCompanies con getTechCompanies()")

    try {
      const result = await getTechCompanies()
      addLog(`getTechCompanies() devolvió ${result.length} registros`)
      setCompanies(result)
    } catch (err: any) {
      const errorMessage = err.message || "Error desconocido"
      addLog(`ERROR en getTechCompanies(): ${errorMessage}`)
      setError(`Error al obtener empresas: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompaniesBasic = async () => {
    setLoading(true)
    setError(null)
    addLog("Iniciando fetchCompaniesBasic con TechCompanyService.getTechCompaniesBasic()")

    try {
      const result = await TechCompanyService.getTechCompaniesBasic()
      addLog(`getTechCompaniesBasic() devolvió ${result.length} registros`)
      setCompaniesBasic(result)
    } catch (err: any) {
      const errorMessage = err.message || "Error desconocido"
      addLog(`ERROR en getTechCompaniesBasic(): ${errorMessage}`)
      setError(`Error al obtener empresas básicas: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    addLog("Componente montado")
  }, [])

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Depuración de Empresas Tecnológicas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Button onClick={fetchCompanies} disabled={loading}>
            {loading ? "Cargando..." : "Obtener Empresas (getTechCompanies)"}
          </Button>
          <Button onClick={fetchCompaniesBasic} disabled={loading} variant="outline">
            {loading ? "Cargando..." : "Obtener Empresas Básicas (getTechCompaniesBasic)"}
          </Button>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Empresas (getTechCompanies)</h3>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(companies, null, 2)}
            </pre>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Empresas Básicas (getTechCompaniesBasic)</h3>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(companiesBasic, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Log de Consultas</h3>
          <div className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
            {queryLog.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
