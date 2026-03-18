import { Suspense } from "react"
import { NewAdminDashboard } from "@/components/dashboard/new-admin-dashboard"
import { BddDashboard } from "@/components/dashboard/bdd-dashboard"
import { PartnerDashboard } from "@/components/dashboard/partner-dashboard"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
//import {  } from "@supabase/auth-helpers-nextjs"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

export default async function DashboardPage() {
  //const supabase = createServerComponentClient<Database>({ cookies })
  const supabase = createServerClient()
  // Obtener el usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Valores por defecto
  let roleCode = "admin"
  let roleId = null
  let partnerId = null
  const dashboardType = "Admin Dashboard"
  const userId = user?.id || ""
  const email = user?.email

  if (user) {
    try {
      // Consulta correcta para obtener información del usuario y su rol
      const { data: userData, error } = await supabase
        .from("users")
        .select("id, email, role_id, roles:role_id(id, code), partner_id")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Error fetching user data:", error)
      } else if (userData) {
        roleId = userData.role_id
        partnerId = userData.partner_id

        // Asegurarse de que roles existe antes de acceder a code
        if (userData.roles && userData.roles.code) {
          roleCode = userData.roles.code
        }
      }
    } catch (error) {
      console.error("Error in dashboard page:", error)
    }
  }

  // Convertir a minúsculas para comparación
  const roleCodeLower = roleCode.toLowerCase()

  // Verificar si es un usuario partner (cualquier rol que contenga "partner" en minúsculas)
  const isPartnerUser = roleCodeLower.includes("partner")

  // Verificar si es un usuario BDD
  const isBddUser = roleCodeLower === "bdd"

  return (
    <div className="w-full">
      <Suspense fallback={<DashboardSkeleton />}>
        {isPartnerUser ? <PartnerDashboard /> : isBddUser ? <BddDashboard /> : <NewAdminDashboard />}
      </Suspense>
    </div>
  )
}
