import { CustomFieldsList } from "@/components/custom-fields/custom-fields-list"
import { CustomFieldsHeader } from "@/components/custom-fields/custom-fields-header"
import { getTechCompaniesServer } from "@/lib/services/tech-company-service-server"

export const dynamic = "force-dynamic"

export default async function CustomFieldsPage() {
  // Obtener las empresas tecnológicas desde el servidor
  const techCompanies = await getTechCompaniesServer()

  return (
    <div className="container mx-auto py-6">
      <CustomFieldsHeader />
      <CustomFieldsList initialTechCompanies={techCompanies} />
    </div>
  )
}
