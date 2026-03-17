"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
//import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/types/supabase"
import { Skeleton } from "@/components/ui/skeleton"

interface RoleProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallbackPath?: string
}

export function RoleProtectedRoute({ children, allowedRoles, fallbackPath = "/dashboard" }: RoleProtectedRouteProps) {
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const router = useRouter()
  //const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        // Verificar si el usuario está autenticado
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          router.push("/auth/login")
          return
        }

        // Obtener el rol del usuario
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role_id, roles(code)")
          .eq("id", user.id)
          .single()

        if (userError || !userData || !userData.roles) {
          console.error("Error fetching user role:", userError)
          setHasAccess(false)
          setLoading(false)
          router.push(fallbackPath)
          return
        }

        // Obtener el código de rol y convertirlo a minúsculas para comparación
        const userRoleCode = userData.roles.code
        const userRoleCodeLower = userRoleCode.toLowerCase()

        // Verificar si el usuario tiene un rol permitido
        const hasAllowedRole = allowedRoles.some((role) => {
          const roleLower = role.toLowerCase()

          // Si el rol es "partner", verificar si el userRoleCodeLower contiene "partner"
          if (roleLower === "partner") {
            return userRoleCodeLower.includes("partner")
          }

          // Para otros roles, verificar coincidencia exacta
          return userRoleCodeLower === roleLower
        })

        if (hasAllowedRole) {
          setHasAccess(true)
        } else {
          router.push(fallbackPath)
        }
      } catch (error) {
        console.error("Error in role protection:", error)
        router.push(fallbackPath)
      } finally {
        setLoading(false)
      }
    }

    checkUserRole()
  }, [router, supabase, allowedRoles, fallbackPath])

  if (loading) {
    return (
      <div className="flex flex-col space-y-3 p-10">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-6 w-[200px]" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return null // No renderizar nada si no tiene acceso (la redirección ya está en marcha)
  }

  return <>{children}</>
}
