"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getTechFieldsForOpportunity } from "@/lib/services/follow-up-meeting-service"
import { supabase } from "@/lib/supabase/client"

export function FollowUpTechFieldsDebug() {
  const [opportunityId, setOpportunityId] = useState<string>("")
  const [techFields, setTechFields] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [allTechFields, setAllTechFields] = useState<any[]>([])

  // Cargar oportunidades para seleccionar
  useEffect(() => {
    const loadOpportunities = async () => {
      try {
        const { data, error } = await supabase
          .from("opportunities")
          .select("id, name")
          .order("created_at", { ascending: false })
          .limit(10)

        if (error) {
          console.error("Error al cargar oportunidades:", error)
          return
        }

        setOpportunities(data || [])
      } catch (err) {
        console.error("Error inesperado al cargar oportunidades:", err)
      }
    }

    const loadAllTechFields = async () => {
      try {
        const { data, error } = await supabase
          .from("opportunity_tech_fields")
          .select("*")
          .order("display_order", { ascending: true })

        if (error) {
          console.error("Error al cargar campos técnicos:", error)
          return
        }

        setAllTechFields(data || [])
      } catch (err) {
        console.error("Error inesperado al cargar campos técnicos:", err)
      }
    }

    loadOpportunities()
    loadAllTechFields()
  }, [])

  const loadTechFields = async () => {
    if (!opportunityId) {
      setError("Por favor, selecciona una oportunidad")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const fields = await getTechFieldsForOpportunity(opportunityId)
      console.log("Tech fields loaded:", fields)
      setTechFields(fields)
    } catch (err) {
      console.error("Error al cargar campos técnicos:", err)
      setError("Error al cargar campos técnicos")
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener el valor formateado de un campo técnico
  const getFieldValue = (field: any) => {
    if (!field) return "No especificado"

    // Verificar el tipo de campo y mostrar el valor correspondiente
    if (field.value_text !== null && field.value_text !== undefined) {
      return field.value_text || "No especificado"
    }

    if (field.value_numeric !== null && field.value_numeric !== undefined) {
      return field.value_numeric.toString()
    }

    if (field.value_boolean !== null && field.value_boolean !== undefined) {
      return field.value_boolean ? "Sí" : "No"
    }

    if (field.value_date) {
      return field.value_date
    }

    if (field.value_json) {
      try {
        const jsonValue = typeof field.value_json === "string" ? JSON.parse(field.value_json) : field.value_json
        return JSON.stringify(jsonValue)
      } catch (e) {
        return "Valor JSON inválido"
      }
    }

    return "No especificado"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Depuración de Campos Técnicos en Reuniones de Seguimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Selecciona una oportunidad:</label>
              <div className="flex space-x-2">
                <select
                  className="w-full p-2 border rounded"
                  value={opportunityId}
                  onChange={(e) => setOpportunityId(e.target.value)}
                >
                  <option value="">Selecciona una oportunidad</option>
                  {opportunities.map((opp) => (
                    <option key={opp.id} value={opp.id}>
                      {opp.name}
                    </option>
                  ))}
                </select>
                <Button onClick={loadTechFields} disabled={loading}>
                  {loading ? "Cargando..." : "Cargar campos"}
                </Button>
              </div>
            </div>

            {error && <div className="text-red-500">{error}</div>}

            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Campos técnicos disponibles:</h3>
              <div className="bg-gray-50 p-4 rounded overflow-auto max-h-60">
                <pre className="text-xs">{JSON.stringify(allTechFields, null, 2)}</pre>
              </div>
            </div>

            {techFields.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Campos técnicos de la oportunidad:</h3>
                <div className="space-y-4">
                  {techFields.map((field) => (
                    <div key={field.id} className="bg-white p-4 rounded border">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium">Información del campo:</h4>
                          <div className="text-sm mt-2">
                            <p>
                              <span className="font-medium">ID:</span> {field.id}
                            </p>
                            <p>
                              <span className="font-medium">Campo técnico ID:</span> {field.opportunity_tech_field_id}
                            </p>
                            <p>
                              <span className="font-medium">Nombre:</span>{" "}
                              {field.field_info?.field_name || "No disponible"}
                            </p>
                            <p>
                              <span className="font-medium">Tipo:</span>{" "}
                              {field.field_info?.field_type || "No disponible"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium">Valor:</h4>
                          <div className="text-sm mt-2">
                            <p>
                              <span className="font-medium">Valor formateado:</span> {getFieldValue(field)}
                            </p>
                            <p>
                              <span className="font-medium">value_text:</span>{" "}
                              {field.value_text !== null && field.value_text !== undefined
                                ? `"${field.value_text}"`
                                : "null"}
                            </p>
                            <p>
                              <span className="font-medium">value_numeric:</span>{" "}
                              {field.value_numeric !== null && field.value_numeric !== undefined
                                ? field.value_numeric
                                : "null"}
                            </p>
                            <p>
                              <span className="font-medium">value_boolean:</span>{" "}
                              {field.value_boolean !== null && field.value_boolean !== undefined
                                ? field.value_boolean.toString()
                                : "null"}
                            </p>
                            <p>
                              <span className="font-medium">value_date:</span> {field.value_date || "null"}
                            </p>
                            <p>
                              <span className="font-medium">value_json:</span>{" "}
                              {field.value_json ? JSON.stringify(field.value_json) : "null"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
