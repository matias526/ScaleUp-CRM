"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function SqlTestPage() {
  const [partnerId, setPartnerId] = useState("f7b15f4a-6977-47c0-96e7-ec783fed7bb1")
  const [sqlQuery, setSqlQuery] = useState(`
SELECT *
FROM partners
WHERE id = '${partnerId}'
  `)
  const [result, setResult] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const executeQuery = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Ejecutar la consulta SQL directamente
      const { data, error: queryError } = await supabase.rpc("execute_sql", {
        query: sqlQuery,
      })

      if (queryError) {
        setError(`Error al ejecutar la consulta: ${queryError.message}`)
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(`Error inesperado: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const executeRawQuery = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Ejecutar la consulta usando la API de Supabase
      const response = await supabase.from("partners").select("*").eq("id", partnerId)

      setResult(response)
    } catch (err) {
      setError(`Error inesperado: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Prueba de SQL</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Consulta SQL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">ID del Partner</label>
              <Input
                value={partnerId}
                onChange={(e) => {
                  setPartnerId(e.target.value)
                  setSqlQuery(`
SELECT *
FROM partners
WHERE id = '${e.target.value}'
                  `)
                }}
                placeholder="ID del partner"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Consulta SQL</label>
              <Textarea value={sqlQuery} onChange={(e) => setSqlQuery(e.target.value)} rows={5} className="font-mono" />
            </div>

            <div className="flex space-x-2">
              <Button onClick={executeQuery} disabled={loading}>
                Ejecutar consulta SQL
              </Button>
              <Button onClick={executeRawQuery} disabled={loading} variant="outline">
                Ejecutar consulta API
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-500">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">{JSON.stringify(result, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
