"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"

export default function TechFieldsErrorDebug() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  //const supabase = createClientComponentClient()

  const testTechFields = async () => {
    setLoading(true)
    setError(null)
    try {
      // Primero obtenemos todos los campos técnicos disponibles
      const { data: allTechFields, error: allTechFieldsError } = await supabase
        .from("opportunity_tech_fields")
        .select("*")
        .order("display_order", { ascending: true })

      if (allTechFieldsError) {
        throw new Error(`Error al obtener campos técnicos: ${allTechFieldsError.message}`)
      }

      // Crear un mapa de ID a campo técnico para acceso rápido
      const techFieldsMap = new Map()
      allTechFields?.forEach((field) => {
        techFieldsMap.set(field.id, field)
      })

      // Obtener una oportunidad de ejemplo
      const { data: opportunities, error: oppError } = await supabase.from("opportunities").select("id").limit(1)

      if (oppError) {
        throw new Error(`Error al obtener oportunidad: ${oppError.message}`)
      }

      if (!opportunities || opportunities.length === 0) {
        throw new Error("No se encontraron oportunidades")
      }

      const opportunityId = opportunities[0].id

      // Ahora obtenemos los valores de los campos técnicos para esta oportunidad
      const { data: techFieldsData, error: techFieldsError } = await supabase
        .from("opportunity_tech_values")
        .select("*")
        .eq("opportunity_id", opportunityId)

      if (techFieldsError) {
        throw new Error(`Error al obtener valores de campos técnicos: ${techFieldsError.message}`)
      }

      // Intentar enriquecer los valores con la información del campo técnico
      const enrichedTechFieldsData = techFieldsData?.map((value) => {
        const fieldInfo = techFieldsMap.get(value.opportunity_tech_field_id)

        // Verificar si fieldInfo existe y tiene las propiedades esperadas
        if (!fieldInfo) {
          console.warn(`Campo técnico no encontrado para ID: ${value.opportunity_tech_field_id}`)
        }

        // Registrar para depuración
        console.log(
          `Campo ${value.opportunity_tech_field_id} (${fieldInfo?.field_type || "desconocido"}): valor cargado = ${
            value.value_text ||
            value.value_numeric ||
            (value.value_boolean !== null ? (value.value_boolean ? "Sí" : "No") : "") ||
            value.value_date ||
            (value.value_json ? "JSON" : "") ||
            "null"
          }`,
        )

        return {
          ...value,
          field_info: fieldInfo || { field_type: "desconocido", field_name: "Campo desconocido" },
        }
      })

      setData({
        allTechFields: allTechFields || [],
        techFieldsMap: Array.from(techFieldsMap.entries()),
        opportunityId,
        techFieldsData: techFieldsData || [],
        enrichedTechFieldsData: enrichedTechFieldsData || [],
      })
    } catch (err: any) {
      console.error("Error en la prueba:", err)
      setError(err.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Depuración de Campos Técnicos</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={testTechFields} disabled={loading}>
          {loading ? "Probando..." : "Probar Campos Técnicos"}
        </Button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md">
            <h3 className="font-bold">Error:</h3>
            <p>{error}</p>
          </div>
        )}

        {data && (
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="font-bold">Campos Técnicos ({data.allTechFields.length}):</h3>
              <pre className="mt-2 p-2 bg-gray-100 rounded-md overflow-auto text-xs">
                {JSON.stringify(data.allTechFields.slice(0, 3), null, 2)}
                {data.allTechFields.length > 3 && "..."}
              </pre>
            </div>

            <div>
              <h3 className="font-bold">Valores de Campos Técnicos ({data.techFieldsData.length}):</h3>
              <pre className="mt-2 p-2 bg-gray-100 rounded-md overflow-auto text-xs">
                {JSON.stringify(data.techFieldsData.slice(0, 3), null, 2)}
                {data.techFieldsData.length > 3 && "..."}
              </pre>
            </div>

            <div>
              <h3 className="font-bold">Valores Enriquecidos ({data.enrichedTechFieldsData.length}):</h3>
              <pre className="mt-2 p-2 bg-gray-100 rounded-md overflow-auto text-xs">
                {JSON.stringify(data.enrichedTechFieldsData.slice(0, 3), null, 2)}
                {data.enrichedTechFieldsData.length > 3 && "..."}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
