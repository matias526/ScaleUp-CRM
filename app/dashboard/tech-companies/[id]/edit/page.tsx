"use client"

import { use } from "react" // 1. Importamos el hook 'use'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { TechCompanyEditForm } from "@/components/tech-companies/tech-company-edit-form"

// 2. Definimos que params es una Promesa
interface EditTechCompanyPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditTechCompanyPage({ params }: EditTechCompanyPageProps) {
  const router = useRouter()

  // 3. Resolvemos la promesa de los params
  const resolvedParams = use(params)
  const id = resolvedParams.id

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Editar Empresa Tecnológica</h1>
      </div>

      {/* 4. Pasamos el id ya resuelto al formulario */}
      <TechCompanyEditForm companyId={id} />
    </div>
  )
}