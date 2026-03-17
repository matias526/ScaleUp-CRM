import { notFound } from "next/navigation"
import { CustomFieldForm } from "@/components/custom-fields/custom-field-form"
import { getTechCompanies } from "@/lib/services/tech-company-service"
import { getOpportunityTechFieldById } from "@/lib/services/opportunity-tech-field-service"

interface EditCustomFieldPageProps {
  params: {
    id: string
  }
}

export default async function EditCustomFieldPage({ params }: EditCustomFieldPageProps) {
  const { id } = params

  try {
    const [field, techCompanies] = await Promise.all([getOpportunityTechFieldById(id), getTechCompanies()])

    if (!field) {
      return notFound()
    }

    return (
      <div>
        <CustomFieldForm techCompanies={techCompanies} field={field} />
      </div>
    )
  } catch (error) {
    console.error("Error loading field data:", error)
    return notFound()
  }
}
