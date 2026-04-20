import { notFound } from "next/navigation"
import { getEndCustomerById } from "@/lib/services/end-customer-service-server"
import { getCountries } from "@/lib/services/country-service"
import { EndCustomerForm } from "@/components/end-customers/end-customer-form"

// 1. Tipar params como una Promise
interface EditEndCustomerPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditEndCustomerPage({ params }: EditEndCustomerPageProps) {
  // 2. Esperar a que los params se resuelvan
  const { id } = await params

  // 3. Usar el id resuelto en las llamadas
  const [customer, countries] = await Promise.all([
    getEndCustomerById(id),
    getCountries()
  ])

  // Ahora el chequeo es seguro porque el id era el correcto
  if (!customer) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Editar Cliente Final</h1>
      <EndCustomerForm customer={customer} countries={countries} />
    </div>
  )
}