import { TechCompanyForm } from "@/components/tech-companies/tech-company-form"

export default function CreateTechCompanyPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Nueva Empresa Tecnológica</h1>
      <TechCompanyForm />
    </div>
  )
}
