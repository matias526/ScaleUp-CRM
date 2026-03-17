"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PartnerDiagnosePage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [partner, setPartner] = useState<any | null>(null)
  const [rawResponse, setRawResponse] = useState<any | null>(null)
  const [connectionTest, setConnectionTest] = useState<string | null>(null)

  const partnerId = params.id

  // Función para probar la conexión a Supabase
  const testConnection = async () => {
    try {
      setConnectionTest("Probando conexión a Supabase...")
      const { data, error } = await supabase.from("partners").select("count(*)").limit(1)

      if (error) {
        setConnectionTest(`Error de conexión: ${error.message}`)
      } else {
        setConnectionTest(`Conexión exitosa. Conteo: ${JSON.stringify(data)}`)
      }
    } catch (err) {
      setConnectionTest(`Error inesperado: ${(err as Error).message}`)
    }
  }

  // Función para obtener el partner directamente
  const fetchPartner = async () => {
    setLoading(true)
    setError(null)
    setPartner(null)
    setRawResponse(null)

    try {
      // Consulta directa a Supabase
      const response = await supabase
        .from("partners")
        .select(`
          id, name, code, logo_url, website, address, 
          main_country_id, city, postal_code, is_active, 
          created_at, updated_at,
          countries:main_country_id (name)
        `)
        .eq("id", partnerId)
        .single()

      // Guardar la respuesta completa para diagnóstico
      setRawResponse(response)

      if (response.error) {
        setError(`Error al obtener partner: ${response.error.message}`)
      } else if (!response.data) {
        setError("No se encontró ningún partner con ese ID")
      } else {
        // Formatear los datos para incluir el nombre del país
        const partnerData = {
          ...response.data,
          main_country_name: response.data.countries?.name || null,
        }

        // Eliminar el objeto countries anidado
        delete (partnerData as any).countries

        setPartner(partnerData)
      }
    } catch (err) {
      setError(`Error inesperado: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  // Ejecutar la consulta al cargar la página
  useEffect(() => {
    fetchPartner()
    testConnection()
  }, [partnerId])

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico de Partner</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Información de diagnóstico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="font-medium">ID del partner:</span> {partnerId}
            </div>
            <div>
              <span className="font-medium">Estado:</span>{" "}
              {loading ? "Cargando..." : error ? "Error" : partner ? "Partner encontrado" : "Partner no encontrado"}
            </div>
            <div>
              <span className="font-medium">Prueba de conexión:</span> {connectionTest || "Pendiente..."}
            </div>
            <div className="mt-4">
              <Button onClick={fetchPartner} disabled={loading}>
                Reintentar consulta
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

      {partner && (
        <Card className="mb-6 border-green-500">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-700">Partner encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">ID:</span> {partner.id}
              </div>
              <div>
                <span className="font-medium">Nombre:</span> {partner.name}
              </div>
              <div>
                <span className="font-medium">Código:</span> {partner.code}
              </div>
              <div>
                <span className="font-medium">Sitio web:</span> {partner.website || "No especificado"}
              </div>
              <div>
                <span className="font-medium">Dirección:</span> {partner.address || "No especificada"}
              </div>
              <div>
                <span className="font-medium">Ciudad:</span> {partner.city || "No especificada"}
              </div>
              <div>
                <span className="font-medium">Código postal:</span> {partner.postal_code || "No especificado"}
              </div>
              <div>
                <span className="font-medium">País:</span> {partner.main_country_name || "No especificado"}
              </div>
              <div>
                <span className="font-medium">Activo:</span> {partner.is_active ? "Sí" : "No"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Respuesta completa de Supabase</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">{JSON.stringify(rawResponse, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
