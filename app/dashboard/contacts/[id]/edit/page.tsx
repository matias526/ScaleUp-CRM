"use client"

import { useState, useEffect } from "react"
import { ContactForm } from "@/components/contacts/contact-form"
import { ContactService } from "@/lib/services/contact-service"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function EditContactPage({ params }: { params: { id: string } }) {
  const [contact, setContact] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadContact = async () => {
      try {
        const data = await ContactService.getContactById(params.id)
        if (data) {
          setContact(data)
        } else {
          setError("Contacto no encontrado")
          router.push("/dashboard/contacts")
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar el contacto")
      } finally {
        setIsLoading(false)
      }
    }

    loadContact()
  }, [params.id, router])

  if (isLoading) {
    return (
      <main className="flex h-96 items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </main>
    )
  }

  if (error || !contact) {
    return (
      <main className="space-y-6 p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error || "Contacto no encontrado"}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Contacto</h1>
        <p className="text-gray-600">Actualiza la información del contacto</p>
      </div>

      <div className="max-w-3xl">
        <ContactForm initialData={contact} showCancel={true} />
      </div>
    </main>
  )
}
