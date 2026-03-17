import { DebugCustomFieldCreation } from "@/components/custom-fields/debug-custom-field-creation"

export default function DebugCustomFieldCreationPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Debug: Creación de Campos Personalizados</h1>
        <p className="text-gray-600 mt-2">
          Herramienta de diagnóstico para identificar problemas en la creación de campos personalizados.
        </p>
      </div>

      <DebugCustomFieldCreation />
    </div>
  )
}
