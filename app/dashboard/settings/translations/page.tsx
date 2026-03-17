import { TranslationTest } from "@/components/translation-test"
import { DebugLanguage } from "@/components/debug-language"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Bug } from "lucide-react"

export default function TranslationsPage() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Traducciones</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard/settings/translations/debug">
            <Bug className="mr-2 h-4 w-4" />
            Depurador Avanzado
          </Link>
        </Button>
      </div>

      <TranslationTest />
      <DebugLanguage />
    </div>
  )
}
