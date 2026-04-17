"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { Loader2 } from "lucide-react"
import dynamic from "next/dynamic"

// Importar los componentes de forma dinámica para evitar problemas de SSR
const PartnerTechCompanies = dynamic(() => import("@/components/partners/partner-tech-companies-fixed"), {
  ssr: false,
  loading: () => (
    <Card>
      <CardContent className="py-8">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-center mt-4">Cargando empresas tecnológicas...</p>
      </CardContent>
    </Card>
  ),
})

const PartnerUsers = dynamic(() => import("@/components/partners/partner-users-with-data"), {
  ssr: false,
  loading: () => (
    <Card>
      <CardContent className="py-8">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-center mt-4">Cargando usuarios...</p>
      </CardContent>
    </Card>
  ),
})

const PartnerTasks = dynamic(() => import("@/components/partners/partner-tasks"), {
  ssr: false,
  loading: () => (
    <Card>
      <CardContent className="py-8">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-center mt-4">Cargando tareas...</p>
      </CardContent>
    </Card>
  ),
})

const PartnerContactsSection = dynamic(() => import("@/components/partners/partner-contacts-section").then(m => ({ default: m.PartnerContactsSection })), {
  ssr: false,
  loading: () => (
    <Card>
      <CardContent className="py-8">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-center mt-4">Cargando contactos...</p>
      </CardContent>
    </Card>
  ),
})

export default function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [partner, setPartner] = useState<any | null>(null)

  // Validación de ID
  if (!id || id === 'undefined') {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-500">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">ID de partner inválido</p>
            <Button className="mt-4" onClick={() => router.back()}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Función para obtener el partner
  const fetchPartner = async () => {
    try {
      setLoading(true)
      setError(null)

      // Consulta directa a Supabase
      const { data, error } = await supabase
        .from("partners")
        .select(`
          id, name, code, logo_url, website, address, 
          main_country_id, city, postal_code, is_active, 
          created_at, updated_at,
          countries:main_country_id (name)
        `)
        .eq("id", id)
        .single()

      if (error) {
        console.error("Error al obtener partner:", error)
        setError(`Error al obtener partner: ${error.message}`)
        return
      }

      if (!data) {
        setError("No se encontró ningún partner con ese ID")
        return
      }

      // Extrae el string del country name si es un objeto
      const countryName = typeof data.countries?.name === 'string'
        ? data.countries.name
        : (data.countries as any)?.name || 'No especificado'

      // Extrae strings de campos que pueden venir como objetos
      const name = typeof data.name === 'string' ? data.name : 'Sin nombre'
      const website = typeof data.website === 'string' ? data.website : null
      const address = typeof data.address === 'string' ? data.address : null
      const city = typeof data.city === 'string' ? data.city : null
      const postalCode = typeof data.postal_code === 'string' ? data.postal_code : null
      const logoUrl = typeof data.logo_url === 'string' ? data.logo_url : null

      // Formatear los datos para incluir el nombre del país
      const partnerData = {
        ...data,
        name,
        website,
        address,
        city,
        postal_code: postalCode,
        logo_url: logoUrl,
        main_country_name: countryName,
      }

      // Eliminar el objeto countries anidado
      delete (partnerData as any).countries

      setPartner(partnerData)
    } catch (err) {
      console.error("Error inesperado:", err)
      setError(`Error inesperado: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  // Cargar el partner al montar el componente
  useEffect(() => {
    fetchPartner()
  }, [id])

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-8">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <p className="text-center mt-4">Cargando detalles del partner...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mostrar error si lo hay
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-500">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button className="mt-4" onClick={() => router.back()}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mostrar detalles del partner
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {typeof partner?.name === 'string'
            ? partner.name
            : (partner?.name?.name || "Detalle del Partner")}
        </h1>
        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
      </div>

      {/* RECUERDA: Este es el Grid que envuelve las dos columnas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* COLUMNA IZQUIERDA: La que se había perdido */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Partner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mb-4">
                  <ImageWithFallback
                    src={partner?.logo_url || ""}
                    fallback="/diverse-business-team.png"
                    alt={typeof partner?.name === 'string' ? partner.name : "Logo"}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="text-xl font-semibold">
                  {typeof partner?.name === 'string' ? partner.name : (partner?.name?.name || "Partner")}
                </h2>
                <p className="text-gray-500">{partner?.website || "Sin sitio web"}</p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">País:</span>{" "}
                  <span>{partner?.main_country_name || "No especificado"}</span>
                </div>
                <div>
                  <span className="font-medium">Ciudad:</span>{" "}
                  <span>{partner?.city || "No especificada"}</span>
                </div>
                <div>
                  <span className="font-medium">Dirección:</span>{" "}
                  <span>{partner?.address || "No especificada"}</span>
                </div>
                <div>
                  <span className="font-medium">Código Postal:</span>{" "}
                  <span>{partner?.postal_code || "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA DERECHA: La que tenías pero le faltaba el diseño */}
        <div className="md:col-span-2 space-y-6">
          {id && (
            <>
              <PartnerTechCompanies partnerId={id} />

              <PartnerUsers
                partnerId={id}
                partnerName={typeof partner?.name === 'string' ? partner.name : "Partner"}
              />

              <PartnerTasks
                partnerId={id}
                partnerName={typeof partner?.name === 'string' ? partner.name : "Partner"}
              />

              <PartnerContactsSection partnerId={id} />
            </>
          )}
        </div>
      </div> {/* Cierre del Grid */}
    </div>
  );
}