import { SetupInstructions } from "@/components/setup-instructions"

export default function SupabaseSetupPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configuración de Supabase</h1>
      <SetupInstructions />
    </div>
  )
}
