import { notFound } from "next/navigation"
import { getEndCustomerById } from "@/lib/services/end-customer-service-server"
import { getCountries } from "@/lib/services/country-service"
import { EndCustomerForm } from "@/components/end-customers/end-customer-form"

interface EditEndCustomerPageProps {
  params: {
    id: string
  }
}

export default async function EditEndCustomerPage({ params }: EditEndCustomerPageProps) {
  const [customer, countries] = await Promise.all([getEndCustomerById(params.id), getCountries()])

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
