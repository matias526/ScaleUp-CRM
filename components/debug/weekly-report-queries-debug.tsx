"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function WeeklyReportQueriesDebug() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [techCompanyId, setTechCompanyId] = useState("")

  const runQueries = async () => {
    if (!techCompanyId.trim()) {
      alert("Por favor ingresa un Tech Company ID")
      return
    }

    setLoading(true)
    setResults(null)

    try {
      const supabase = createClient()
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const oneWeekAgoISO = oneWeekAgo.toISOString()

      console.log("🔍 Fecha una semana atrás:", oneWeekAgoISO)

      // 1. Verificar tech company
      const { data: techCompany } = await supabase
        .from("tech_companies")
        .select("id, name")
        .eq("id", techCompanyId)
        .single()

      // 2. Obtener todas las oportunidades
      const { data: allOpportunities } = await supabase
        .from("opportunities")
        .select(`
          id, 
          title, 
          created_at, 
          updated_at,
          pipeline_stages (code)
        `)
        .eq("tech_company_id", techCompanyId)
        .order("created_at", { ascending: false })

      // 3. Verificar campos técnicos disponibles (CORREGIDO)
      const { data: techFields } = await supabase
        .from("opportunity_tech_fields")
        .select("id, field_name, field_type, tech_company_id")
        .eq("tech_company_id", techCompanyId)

      // 4. Verificar valores técnicos (CORREGIDO)
      const opportunityIds = allOpportunities?.map((opp) => opp.id) || []
      const { data: techValues } = await supabase
        .from("opportunity_tech_values")
        .select(
          "id, opportunity_id, opportunity_tech_field_id, value_text, value_numeric, value_boolean, value_date, value_json",
        )
        .in("opportunity_id", opportunityIds)

      // 5. Analizar oportunidades Won
      const wonOpportunities = allOpportunities?.filter((opp) => opp.pipeline_stages?.code === "Won") || []

      const wonThisWeek = wonOpportunities.filter((opp) => opp.updated_at && new Date(opp.updated_at) >= oneWeekAgo)

      const wonOlderThanWeek = wonOpportunities.filter(
        (opp) => !opp.updated_at || new Date(opp.updated_at) < oneWeekAgo,
      )

      // 6. Hacer JOIN manual de campos técnicos (CORREGIDO)
      const techFieldsById: { [key: string]: any } = {}
      techFields?.forEach((field) => {
        techFieldsById[field.id] = field
      })

      const processedTechValues =
        techValues
          ?.map((value) => {
            const field = techFieldsById[value.opportunity_tech_field_id]

            // Determinar el valor real según el tipo
            let actualValue = null
            if (value.value_text) actualValue = value.value_text
            else if (value.value_numeric !== null) actualValue = value.value_numeric
            else if (value.value_boolean !== null) actualValue = value.value_boolean
            else if (value.value_date) actualValue = value.value_date
            else if (value.value_json) actualValue = JSON.stringify(value.value_json)

            return {
              ...value,
              field_name: field?.field_name,
              field_type: field?.field_type,
              actual_value: actualValue,
              has_value: actualValue !== null,
            }
          })
          .filter((v) => v.has_value) || []

      setResults({
        techCompany,
        oneWeekAgoISO,
        queries: {
          // Query 1: Tech Company
          techCompanyQuery: {
            sql: `SELECT id, name FROM tech_companies WHERE id = '${techCompanyId}'`,
            result: techCompany,
          },

          // Query 2: Todas las oportunidades
          allOpportunitiesQuery: {
            sql: `SELECT id, title, created_at, updated_at, pipeline_stages.code 
                  FROM opportunities 
                  LEFT JOIN pipeline_stages ON opportunities.pipeline_stage_id = pipeline_stages.id
                  WHERE tech_company_id = '${techCompanyId}' 
                  ORDER BY created_at DESC`,
            result: allOpportunities,
            count: allOpportunities?.length || 0,
          },

          // Query 3: Campos técnicos (CORREGIDO)
          techFieldsQuery: {
            sql: `SELECT id, field_name, field_type, tech_company_id 
                  FROM opportunity_tech_fields 
                  WHERE tech_company_id = '${techCompanyId}'`,
            result: techFields,
            count: techFields?.length || 0,
          },

          // Query 4: Valores técnicos (CORREGIDO)
          techValuesQuery: {
            sql: `SELECT id, opportunity_id, opportunity_tech_field_id, 
                         value_text, value_numeric, value_boolean, value_date, value_json
                  FROM opportunity_tech_values 
                  WHERE opportunity_id IN (${opportunityIds.map((id) => `'${id}'`).join(", ")})`,
            result: techValues,
            processedResult: processedTechValues,
            count: techValues?.length || 0,
            countWithValues: processedTechValues?.length || 0,
          },

          // Query 5: Oportunidades Won (PROBLEMA)
          wonAnalysis: {
            allWon: wonOpportunities,
            wonThisWeek: wonThisWeek,
            wonOlderThanWeek: wonOlderThanWeek,
            currentLogic: `
              // LÓGICA ACTUAL (INCORRECTA):
              const wonThisWeek = allOpportunities.filter(opp => {
                const isWon = opp.pipeline_stages?.code === 'Won'
                const wasUpdatedThisWeek = opp.updated_at && new Date(opp.updated_at) >= oneWeekAgo
                return isWon && wasUpdatedThisWeek  // ❌ Solo filtra por updated_at
              })
            `,
            suggestedFix: `
              // LÓGICA SUGERIDA (CORRECTA):
              // Opción 1: Crear tabla de stage_history para trackear cambios
              // Opción 2: Solo mostrar Won si created_at es de esta semana
              // Opción 3: Usar un campo stage_changed_at en opportunities
            `,
          },
        },
        analysis: {
          techFieldsIssue: {
            hasFields: (techFields?.length || 0) > 0,
            hasValues: (techValues?.length || 0) > 0,
            hasProcessedValues: (processedTechValues?.length || 0) > 0,
            possibleIssue:
              techFields?.length === 0
                ? "❌ No hay campos técnicos definidos"
                : techValues?.length === 0
                  ? "❌ No hay valores técnicos guardados"
                  : processedTechValues?.length === 0
                    ? "❌ Los valores técnicos están vacíos (todos los campos value_* son null)"
                    : "✅ Campos técnicos OK - Problema debe estar en el código del reporte",
          },
          wonIssue: {
            totalWon: wonOpportunities.length,
            wonThisWeek: wonThisWeek.length,
            wonOlderThanWeek: wonOlderThanWeek.length,
            problem:
              "Las oportunidades Won antiguas aparecen porque solo filtramos por updated_at, no por cuándo cambiaron a Won",
          },
        },
      })
    } catch (error) {
      console.error("Error:", error)
      setResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug de Queries - Weekly Report (CORREGIDO)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tech Company ID:</label>
            <input
              type="text"
              value={techCompanyId}
              onChange={(e) => setTechCompanyId(e.target.value)}
              placeholder="Ingresa el ID de la tech company"
              className="w-full p-2 border rounded"
            />
          </div>

          <Button onClick={runQueries} disabled={loading} className="w-full">
            {loading ? "Ejecutando queries..." : "Ejecutar Queries de Debug"}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          {results.error ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">❌ Error</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-red-600">{results.error}</pre>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Tech Company Info */}
              <Card>
                <CardHeader>
                  <CardTitle>🏢 Tech Company</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(results.techCompany, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              {/* Queries */}
              <Card>
                <CardHeader>
                  <CardTitle>📊 Queries Ejecutadas (CORREGIDAS)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Query 1: Oportunidades */}
                  <div>
                    <h4 className="font-semibold text-blue-600 mb-2">1. Todas las Oportunidades</h4>
                    <Textarea
                      value={results.queries.allOpportunitiesQuery.sql}
                      readOnly
                      className="font-mono text-xs mb-2"
                      rows={3}
                    />
                    <p className="text-sm text-gray-600">
                      Resultado: {results.queries.allOpportunitiesQuery.count} oportunidades
                    </p>
                  </div>

                  {/* Query 2: Campos técnicos */}
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">2. Campos Técnicos (CORREGIDO: field_name)</h4>
                    <Textarea
                      value={results.queries.techFieldsQuery.sql}
                      readOnly
                      className="font-mono text-xs mb-2"
                      rows={3}
                    />
                    <p className="text-sm text-gray-600">
                      Resultado: {results.queries.techFieldsQuery.count} campos técnicos
                    </p>
                    {results.queries.techFieldsQuery.count > 0 && (
                      <pre className="bg-green-50 p-2 rounded text-xs mt-2 overflow-auto">
                        {JSON.stringify(results.queries.techFieldsQuery.result.slice(0, 3), null, 2)}
                      </pre>
                    )}
                  </div>

                  {/* Query 3: Valores técnicos */}
                  <div>
                    <h4 className="font-semibold text-purple-600 mb-2">
                      3. Valores Técnicos (CORREGIDO: value_text, value_numeric, etc.)
                    </h4>
                    <Textarea
                      value={results.queries.techValuesQuery.sql}
                      readOnly
                      className="font-mono text-xs mb-2"
                      rows={4}
                    />
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Registros totales: {results.queries.techValuesQuery.count}
                      </p>
                      <p className="text-sm text-gray-600">
                        Registros con valores: {results.queries.techValuesQuery.countWithValues}
                      </p>
                    </div>

                    {results.queries.techValuesQuery.countWithValues > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Valores Procesados (con JOIN):</h5>
                        <pre className="bg-purple-50 p-2 rounded text-xs mt-2 overflow-auto max-h-60">
                          {JSON.stringify(results.queries.techValuesQuery.processedResult.slice(0, 5), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Análisis de Problemas */}
              <Card>
                <CardHeader>
                  <CardTitle>🚨 Análisis de Problemas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Problema 1: Campos técnicos */}
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-semibold text-red-600 mb-2">🔧 Estado: Campos Técnicos</h4>
                    <p className="text-sm mb-2">
                      <strong>Diagnóstico:</strong> {results.analysis.techFieldsIssue.possibleIssue}
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>
                        • Campos técnicos definidos: {results.analysis.techFieldsIssue.hasFields ? "✅" : "❌"} (
                        {results.queries.techFieldsQuery.count})
                      </li>
                      <li>
                        • Registros en values: {results.analysis.techFieldsIssue.hasValues ? "✅" : "❌"} (
                        {results.queries.techValuesQuery.count})
                      </li>
                      <li>
                        • Valores procesados: {results.analysis.techFieldsIssue.hasProcessedValues ? "✅" : "❌"} (
                        {results.queries.techValuesQuery.countWithValues})
                      </li>
                    </ul>
                  </div>

                  {/* Problema 2: Oportunidades Won */}
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold text-orange-600 mb-2">⚠️ Problema: Oportunidades Won</h4>
                    <p className="text-sm mb-2">
                      <strong>Problema:</strong> {results.analysis.wonIssue.problem}
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• Total Won: {results.analysis.wonIssue.totalWon}</li>
                      <li>• Won esta semana (updated_at): {results.analysis.wonIssue.wonThisWeek}</li>
                      <li>• Won más antiguas: {results.analysis.wonIssue.wonOlderThanWeek}</li>
                    </ul>

                    <div className="mt-4 space-y-2">
                      <h5 className="font-medium">Lógica Actual (Incorrecta):</h5>
                      <pre className="bg-red-50 p-2 rounded text-xs overflow-auto">
                        {results.queries.wonAnalysis.currentLogic}
                      </pre>

                      <h5 className="font-medium">Solución Sugerida:</h5>
                      <pre className="bg-green-50 p-2 rounded text-xs overflow-auto">
                        {results.queries.wonAnalysis.suggestedFix}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Datos detallados */}
              <Card>
                <CardHeader>
                  <CardTitle>📋 Datos Detallados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Campos técnicos detallados */}
                    {results.queries.techValuesQuery.countWithValues > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Campos Técnicos (Muestra)</h4>
                        <div className="bg-blue-50 p-4 rounded">
                          <pre className="text-xs overflow-auto max-h-40">
                            {JSON.stringify(results.queries.techValuesQuery.processedResult.slice(0, 10), null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Oportunidades Won detalladas */}
                    <div>
                      <h4 className="font-semibold mb-2">Oportunidades Won (Detalle)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-green-600">
                            Won Esta Semana ({results.queries.wonAnalysis.wonThisWeek.length})
                          </h5>
                          <pre className="bg-green-50 p-2 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(results.queries.wonAnalysis.wonThisWeek, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h5 className="font-medium text-red-600">
                            Won Más Antiguas ({results.queries.wonAnalysis.wonOlderThanWeek.length})
                          </h5>
                          <pre className="bg-red-50 p-2 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(results.queries.wonAnalysis.wonOlderThanWeek, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}
