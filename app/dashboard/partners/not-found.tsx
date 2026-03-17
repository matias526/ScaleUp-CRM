import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PartnersNotFound() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col items-center justify-center py-12">
        <h1 className="text-4xl font-bold mb-4">Partner no encontrado</h1>
        <p className="text-lg mb-8">Lo sentimos, el partner que estás buscando no existe.</p>
        <Button asChild>
          <Link href="/dashboard/partners">Volver a la lista de partners</Link>
        </Button>
      </div>
    </div>
  )
}
