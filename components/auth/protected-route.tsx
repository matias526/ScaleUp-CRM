"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"
import { Skeleton } from "@/components/ui/skeleton"

interface ProtectedRouteProps {
  children: React.ReactNode
  checkRole?: boolean
  allowedRoles?: string[]
  fallbackPath?: string
}

export function ProtectedRoute({
  children,
  checkRole = false,
  allowedRoles = [],
  fallbackPath = "/dashboard",
}: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const checkAuth = async () => {
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

        // Si no necesitamos verificar el rol, el usuario tiene acceso
        if (!checkRole) {
          setHasAccess(true)
          setLoading(false)
          return
        }

        // Verificar el rol del usuario si es necesario
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

        const userRole = userData.roles.code.toLowerCase()

        // Verificar si el usuario tiene un rol permitido
        if (allowedRoles.includes(userRole)) {
          setHasAccess(true)
        } else {
          router.push(fallbackPath)
        }
      } catch (error) {
        console.error("Error in protected route:", error)
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase, checkRole, allowedRoles, fallbackPath])

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
