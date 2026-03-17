import { CustomFieldForm } from "@/components/custom-fields/custom-field-form"
import { getTechCompaniesServer } from "@/lib/services/tech-company-service-server"
import { TechCompaniesDebug } from "@/components/custom-fields/tech-companies-debug"

export const dynamic = "force-dynamic"

export default async function CreateCustomFieldPage() {
  console.log("SERVER PAGE: Iniciando carga de página de creación de campo personalizado")

  try {
    console.log("SERVER PAGE: Llamando a getTechCompaniesServer")
    const techCompanies = await getTechCompaniesServer()
    console.log(`SERVER PAGE: getTechCompaniesServer devolvió ${techCompanies?.length || 0} registros`)

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Crear campo personalizado</h1>

        {/* Componente de depuración */}
        <TechCompaniesDebug initialTechCompanies={techCompanies} />

        <CustomFieldForm techCompanies={techCompanies} />
      </div>
    )
  } catch (error) {
    console.error("SERVER PAGE ERROR:", error)
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Crear campo personalizado</h1>
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">Error cargando datos: {String(error)}</p>
        </div>

        {/* Componente de depuración con array vacío */}
        <TechCompaniesDebug initialTechCompanies={[]} />

        <CustomFieldForm techCompanies={[]} />
      </div>
    )
  }
}
