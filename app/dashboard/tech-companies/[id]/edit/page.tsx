"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { TechCompanyEditForm } from "@/components/tech-companies/tech-company-edit-form"

export default function EditTechCompanyPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Editar Empresa Tecnológica</h1>
      </div>

      <TechCompanyEditForm companyId={params.id} />
    </div>
  )
}
