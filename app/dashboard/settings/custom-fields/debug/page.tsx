import { TechCompaniesDebug } from "@/components/custom-fields/tech-companies-debug"

export default function CustomFieldsDebugPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Depuración de Campos Personalizados</h1>

      <TechCompaniesDebug />

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h2 className="text-lg font-semibold mb-2">Instrucciones de Depuración</h2>
        <p className="mb-2">
          Usa los botones de arriba para probar las diferentes funciones de obtención de empresas tecnológicas.
        </p>
        <p className="mb-2">
          Revisa los logs para ver qué consultas se están ejecutando y qué errores están ocurriendo.
        </p>
        <p>Si no se muestran empresas, verifica los permisos en Supabase para la tabla tech_companies.</p>
      </div>
    </div>
  )
}
