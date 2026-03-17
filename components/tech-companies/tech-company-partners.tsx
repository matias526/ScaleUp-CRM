"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building, ExternalLink, Plus, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { AddPartnerToTechCompanyDialog } from "./add-partner-to-tech-company-dialog"

interface Partner {
  id: string
  name: string
  code: string
  logo_url: string | null
  website: string | null
  is_active: boolean
}

interface TechCompanyPartnersProps {
  techCompanyId: string
  techCompanyName?: string
}

export function TechCompanyPartners({ techCompanyId, techCompanyName = "esta empresa" }: TechCompanyPartnersProps) {
  const router = useRouter()
  const [partners, setPartners] = useState<Partner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const supabase = createClientComponentClient()

  const loadPartners = async () => {
    if (!techCompanyId) return

    setIsLoading(true)
    setError(null)

    try {
      // Consulta para obtener los partners asociados a esta tech company
      const { data, error: supabaseError } = await supabase
        .from("partner_tech_companies")
        .select(`
          partners:partner_id (
            id, name, code, logo_url, website, is_active
          )
        `)
        .eq("tech_company_id", techCompanyId)

      if (supabaseError) throw new Error(supabaseError.message)

      // Transformar los datos para obtener solo los partners
      const partnersData = data?.map((item) => item.partners) || []
      setPartners(partnersData)
    } catch (err: any) {
      console.error("Error al cargar partners:", err)
      setError(err.message || "Error al cargar partners")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPartners()
  }, [techCompanyId])

  const handleViewPartner = (partnerId: string) => {
    router.push(`/dashboard/partners/${partnerId}`)
  }

  // Asegurarse de que techCompanyName sea una cadena
  const companyName = typeof techCompanyName === "string" ? techCompanyName : "esta empresa"

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Partners Asociados</CardTitle>
            <CardDescription>Partners que trabajan con {companyName}</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={loadPartners}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Partner
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-4 text-destructive">{error}</div>
          ) : partners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay partners asociados con esta empresa tecnológica</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Partner
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {partner.logo_url ? (
                      <div className="relative w-10 h-10 rounded-md overflow-hidden border">
                        <Image
                          src={partner.logo_url || "/placeholder.svg"}
                          alt={`Logo de ${partner.name || "partner"}`}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                        <Building className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{partner.name || "Sin nombre"}</div>
                      <div className="text-sm text-muted-foreground">{partner.code || "Sin código"}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={partner.is_active ? "success" : "destructive"}>
                      {partner.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                    {partner.website && (
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Web
                      </a>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleViewPartner(partner.id)}>
                      Ver detalles
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddPartnerToTechCompanyDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        techCompanyId={techCompanyId}
        onPartnerAdded={loadPartners}
      />
    </>
  )
}
