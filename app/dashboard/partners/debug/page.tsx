"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase/client"

export default function PartnerDebugPage() {
  const [partnerId, setPartnerId] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testPartnerFetch = async () => {
    if (!partnerId) {
      setError("Por favor ingresa un ID de partner")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Consulta directa a Supabase
      const { data, error } = await supabase
        .from("partners")
        .select(`
          id, name, code, logo_url, website, address, 
          main_country_id, city, postal_code, is_active, 
          created_at, updated_at,
          countries:main_country_id (name)
        `)
        .eq("id", partnerId)
        .single()

      if (error) {
        setError(`Error de Supabase: ${error.message}`)
        return
      }

      if (!data) {
        setError("No se encontró ningún partner con ese ID")
        return
      }

      // Formatear los datos para incluir el nombre del país
      const partner = {
        ...data,
        main_country_name: data.countries?.name || null,
      }

      // Eliminar el objeto countries anidado
      delete (partner as any).countries

      setResult(partner)
    } catch (err: any) {
      setError(`Error inesperado: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testNavigation = () => {
    if (!partnerId) {
      setError("Por favor ingresa un ID de partner")
      return
    }

    // Abrir la página de detalle del partner en una nueva pestaña
    window.open(`/dashboard/partners/${partnerId}`, "_blank")
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Depuración de Partners</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Probar obtención de partner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="ID del partner"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="max-w-md"
            />
            <Button onClick={testPartnerFetch} disabled={loading}>
              {loading ? "Probando..." : "Probar obtención"}
            </Button>
            <Button variant="outline" onClick={testNavigation}>
              Probar navegación
            </Button>
          </div>

          {error && <div className="text-red-500 mb-4">{error}</div>}

          {result && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Resultado:</h3>
              <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instrucciones</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Ingresa el ID de un partner que sepas que existe en la base de datos.</li>
            <li>
              Haz clic en "Probar obtención" para verificar si se puede obtener correctamente el partner de la base de
              datos.
            </li>
            <li>
              Si la obtención es exitosa, haz clic en "Probar navegación" para intentar navegar a la página de detalle
              del partner.
            </li>
            <li>
              Si la obtención es exitosa pero la navegación falla con un error 404, entonces el problema está en la
              configuración de rutas de Next.js o en cómo se está renderizando la página.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
