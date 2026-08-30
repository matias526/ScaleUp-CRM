"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { StatusTechCompanyPage } from "@/components/status-techcompany/status-techcompany-page"

export default function StatusTechCompanyRoute() {
  const { userInfo } = useAuth()
  const roleCode = String(userInfo?.roleCode || "").toLowerCase()
  const allowed = Boolean(userInfo?.isAdmin) || roleCode === "bdd"

  if (!allowed) {
    return <main className="flex min-h-[60vh] items-center justify-center p-8"><div className="max-w-md text-center"><h1 className="text-2xl font-semibold">Acceso restringido</h1><p className="mt-2 text-muted-foreground">Esta funcionalidad está disponible únicamente para usuarios Admin y BDD.</p></div></main>
  }

  return <StatusTechCompanyPage />
}
