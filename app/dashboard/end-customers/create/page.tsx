import type { Metadata } from "next"
import { getCountries } from "@/lib/services/country-service"
import { EndCustomerForm } from "@/components/end-customers/end-customer-form"
import { RoleProtectedRoute } from "@/components/auth/role-protected-route"

export const metadata: Metadata = {
  title: "Crear Cliente Final | ScaleUp CRM",
  description: "Crear un nuevo cliente final",
}

export default async function CreateEndCustomerPage() {
  const countries = await getCountries()

  return (
    <RoleProtectedRoute allowedRoles={["Admin"]}>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Crear Cliente Final</h1>
        <EndCustomerForm countries={countries} />
      </div>
    </RoleProtectedRoute>
  )
}
