import { TranslationSystemDiagnostics } from "@/components/debug/translation-system-diagnostics"

export default function DebugTranslationSystemPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Diagnóstico del Sistema de Traducciones</h1>
        <p className="text-muted-foreground">
          Herramienta completa para diagnosticar y resolver problemas con las traducciones
        </p>
      </div>

      <TranslationSystemDiagnostics />
    </div>
  )
}
