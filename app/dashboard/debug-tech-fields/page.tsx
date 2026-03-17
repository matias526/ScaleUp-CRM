import TechFieldsErrorDebug from "@/components/debug/tech-fields-error-debug"

export default function DebugTechFieldsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Depuración de Campos Técnicos</h1>
      <TechFieldsErrorDebug />
    </div>
  )
}
