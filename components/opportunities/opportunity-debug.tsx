"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface OpportunityDebugProps {
  id: string
}

export function OpportunityDebug({ id }: OpportunityDebugProps) {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchOpportunity = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/opportunities/${id}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setData(data)
    } catch (err: any) {
      setError(err.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOpportunity()
  }, [id])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Depuración de Oportunidad (ID: {id})</span>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={fetchOpportunity} disabled={loading}>
              {loading ? "Cargando..." : "Recargar"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/opportunities")}>
              Volver
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <p>Cargando datos...</p>}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 mb-4">
            <h3 className="font-semibold mb-2">Error:</h3>
            <p>{error}</p>
          </div>
        )}

        {data && (
          <div>
            <h3 className="font-semibold mb-2">Datos de la oportunidad:</h3>
            <pre className="p-4 bg-gray-50 border border-gray-200 rounded-md overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
