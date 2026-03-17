"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"

export default function DebugWeeklyReportSimple() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleTestV2 = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log("=== INICIO TEST V2 ===")

      const response = await fetch("/api/weekly-reports/send-test-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tech_company_id: "41515822-764d-4d44-9b6f-8987916a674d",
        }),
      })

      const data = await response.json()
      console.log("Resultado V2:", data)
      setResult(data)
    } catch (error) {
      console.error("Error:", error)
      setResult({ success: false, error: "Network error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Weekly Report V2</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleTestV2} disabled={loading} size="lg">
            {loading ? "Enviando..." : "Enviar Reporte V2"}
          </Button>

          {result && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Resultado:</h3>
              <div className="bg-gray-100 p-4 rounded text-sm">
                <p>
                  <strong>Success:</strong> {result.success ? "✅ Sí" : "❌ No"}
                </p>
                {result.totalOpportunities && (
                  <p>
                    <strong>Total Oportunidades:</strong> {result.totalOpportunities}
                  </p>
                )}
                {result.recentOpportunities !== undefined && (
                  <p>
                    <strong>Nuevas esta semana:</strong> {result.recentOpportunities}
                  </p>
                )}
                {result.results && (
                  <div className="mt-2">
                    <strong>Emails enviados:</strong>
                    {result.results.map((r: any, i: number) => (
                      <div key={i} className="ml-4">
                        {r.email}: {r.success ? "✅" : "❌"} {r.message}
                      </div>
                    ))}
                  </div>
                )}
                {result.error && (
                  <p className="text-red-600">
                    <strong>Error:</strong> {result.error}
                  </p>
                )}
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer font-semibold">Ver JSON completo</summary>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96 mt-2">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
