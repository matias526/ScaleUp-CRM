"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

// Modificar la interfaz de props para aceptar name e imageUrl directamente
interface OrganizationAvatarProps {
  userId?: string
  name?: string
  imageUrl?: string | null
  size?: "sm" | "md" | "lg"
  className?: string
}

export function OrganizationAvatar({ userId, name, imageUrl, size = "md", className }: OrganizationAvatarProps) {
  const [organization, setOrganization] = useState<{
    type: "scaleup" | "partner" | "tech_company"
    name: string
    logo_url: string | null
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Determinar las clases de tamaño
  const sizeClasses =
    {
      sm: "h-6 w-6",
      md: "h-8 w-8",
      lg: "h-10 w-10",
    }[size] || "h-8 w-8"

  useEffect(() => {
    // Si se proporcionan name e imageUrl directamente, usarlos en lugar de buscar por userId
    if (name !== undefined) {
      setOrganization({
        type: "partner", // Tipo por defecto, no importa mucho en este caso
        name: typeof name === "string" ? name : "Organización",
        logo_url: typeof imageUrl === "string" ? imageUrl : null,
      })
      setIsLoading(false)
      return
    }

    // Si no hay name pero hay userId, buscar la información basada en el userId
    if (userId) {
      const loadOrganizationInfo = async () => {
        setIsLoading(true)
        try {
          // Obtener información del usuario
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id, role_id, partner_id, tech_company_id")
            .eq("id", userId)
            .single()

          if (userError) throw userError

          // Determinar la organización basada en los datos del usuario
          if (userData.partner_id) {
            // Usuario pertenece a un partner
            const { data: partnerData, error: partnerError } = await supabase
              .from("partners")
              .select("id, name, logo_url")
              .eq("id", userData.partner_id)
              .single()

            if (partnerError) throw partnerError

            setOrganization({
              type: "partner",
              name: typeof partnerData.name === "string" ? partnerData.name : "Partner",
              logo_url: typeof partnerData.logo_url === "string" ? partnerData.logo_url : null,
            })
          } else if (userData.tech_company_id) {
            // Usuario pertenece a una empresa tecnológica
            const { data: techCompanyData, error: techCompanyError } = await supabase
              .from("tech_companies")
              .select("id, name, logo_url")
              .eq("id", userData.tech_company_id)
              .single()

            if (techCompanyError) throw techCompanyError

            setOrganization({
              type: "tech_company",
              name: typeof techCompanyData.name === "string" ? techCompanyData.name : "Empresa Tecnológica",
              logo_url: typeof techCompanyData.logo_url === "string" ? techCompanyData.logo_url : null,
            })
          } else {
            // Usuario es de ScaleUp (por defecto)
            setOrganization({
              type: "scaleup",
              name: "ScaleUp",
              logo_url: "/images/scaleup-isotipo-color.jpeg",
            })
          }
        } catch (error) {
          console.error("Error al cargar información de la organización:", error)
          // Establecer ScaleUp como organización por defecto en caso de error
          setOrganization({
            type: "scaleup",
            name: "ScaleUp",
            logo_url: "/images/scaleup-isotipo-color.jpeg",
          })
        } finally {
          setIsLoading(false)
        }
      }

      loadOrganizationInfo()
    } else {
      // Si no hay userId ni name, establecer ScaleUp como organización por defecto
      setOrganization({
        type: "scaleup",
        name: "ScaleUp",
        logo_url: "/images/scaleup-isotipo-color.jpeg",
      })
      setIsLoading(false)
    }
  }, [userId, name, imageUrl])

  // Obtener las iniciales de la organización
  const getOrganizationInitials = () => {
    if (!organization) return "??"

    // Tomar las primeras letras de cada palabra del nombre
    return organization.name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2) // Limitar a 2 caracteres
  }

  return (
    <Avatar className={cn(`bg-primary/10 ${sizeClasses}`, className)}>
      {organization?.logo_url ? (
        <AvatarImage src={organization.logo_url || "/placeholder.svg"} alt={organization.name || "Organización"} />
      ) : null}
      <AvatarFallback>{isLoading ? "..." : getOrganizationInitials()}</AvatarFallback>
    </Avatar>
  )
}
